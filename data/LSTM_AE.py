import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import argparse
import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from tensorflow.keras.layers import Input, Dropout, Dense, LSTM, TimeDistributed, RepeatVector
from tensorflow.keras.models import Model,Sequential
from tensorflow.keras import regularizers
import seaborn as sns
# from sklearn.externals import joblib
from collections import Counter
import json
class LSTMPredict:
    def __init__(self,args):
        self.dataRead(args)
        self.dataSplit()
        # self.dataRead(args)
        # self.dataClean()
        # self.LSTM_S(args)

    def insert_missing_date_times(self,x):
        return x.reindex(pd.date_range(x.index.min(), x.index.max(), freq='15min', name='date_time'))

    def dataRead(self,args):
        g1 = pd.read_csv(args.generation1_name)
        w1 = pd.read_csv(args.weather1_name)
        for df in [g1, w1]:
            df.columns = [col.lower() for col in df.columns]
        g1['date_time']= pd.to_datetime(g1['date_time'],format='%d-%m-%Y %H:%M')
        w1['date_time']= pd.to_datetime(w1['date_time'],format='%Y-%m-%d %H:%M:%S')
        original_rowcounts = [df.shape[0] for df in [g1, w1]]
        g1_new = g1.set_index('date_time').groupby('source_key').apply(self.insert_missing_date_times).drop('source_key', axis=1)
        g1_new.reset_index(inplace=True)
        w1_new = w1.set_index('date_time').groupby('source_key').apply(self.insert_missing_date_times).drop('source_key', axis=1)
        w1_new.reset_index(inplace=True)
        g1 = g1_new
        w1 = w1_new
        del g1_new, w1_new
        validated_rowcounts = [
            df.isna().sum().max() + original_rowcounts[idx] == df.shape[0] for idx, df in enumerate(
                [g1, w1]
            )
        ]
        for df in [w1]:
            df.rename(columns={"source_key": "weather_sensor_key"}, inplace=True)
            df.drop("plant_id", axis=1, inplace=True)
        plant1 = pd.merge(g1, w1, how='left', on=['date_time'])
        p1_times_of_no_light = plant1[plant1['irradiation'] == 0.0].groupby('date_time')['source_key'].count().reset_index()
        p1_times_of_no_light['hour'] = p1_times_of_no_light['date_time'].dt.hour
        for df in [plant1]:
            df['date'] = df['date_time'].dt.date
            df['hour'] = df['date_time'].dt.hour
            df['day'] = df['date_time'].dt.day
            df['weekday'] = df['date_time'].dt.day_name()
            df['month'] = df['date_time'].dt.month
            df['year'] = df['date_time'].dt.year
        grouped = plant1.groupby(['source_key', 'date']).last().reset_index()
        # this should be mostly True
        grouped['total_yield'] - grouped['daily_yield'] == grouped['total_yield'].shift(1)
        for df in [plant1]:
            df.loc[(df['dc_power'].isna()) & ((df['hour'] < 5) | (df['hour'] > 18)), 'dc_power'] = 0
            df.loc[(df['ac_power'].isna()) & ((df['hour'] < 5) | (df['hour'] > 18)), 'ac_power'] = 0
            df.loc[(df['irradiation'].isna()) & (df['hour'] < 5), 'daily_yield'] = 0
            df.loc[(df['irradiation'].isna()) & ((df['hour'] < 5) | (df['hour'] > 18)), 'irradiation'] = 0
        for df in [plant1]:
            fill_values = df[~df['daily_yield'].isna()].groupby(["source_key", "date"])["daily_yield"].last().reset_index()
            fill_values.rename(columns={"daily_yield": "daily_yield_fill_value_after_sunset"}, inplace=True)
            df = pd.merge(df, fill_values, how='left', on=['source_key', 'date'])
            df.loc[(df['daily_yield'].isna()) & (df['hour'] > 18), 'daily_yield'] = df.loc[(df['daily_yield'].isna()) & (df['hour'] > 18), 'daily_yield_fill_value_after_sunset']
            df.drop("daily_yield_fill_value_after_sunset", axis=1, inplace=True)
        for df in [plant1]:
            df['dc_power'].interpolate(method='linear', axis=0, inplace=True)
            df['ac_power'].interpolate(method='linear', axis=0, inplace=True)
            df['daily_yield'].interpolate(method='linear', axis=0, inplace=True)
            df['module_temperature'].interpolate(method='linear', axis=0, inplace=True)
            df['ambient_temperature'].interpolate(method='linear', axis=0, inplace=True)
            df['irradiation'].interpolate(method='linear', axis=0, inplace=True)
        for df in [plant1]:
            final_non_null_total_yields = df[~df['total_yield'].isna()].groupby(["source_key", "date"])["total_yield"].last().reset_index()
            final_daily_yields = df.groupby(["source_key", "date"])["daily_yield"].last().reset_index()
            fill_values = pd.merge(final_non_null_total_yields, final_daily_yields, how='left',on=['source_key', 'date'])
            fill_values['total_yield_fill_value'] = fill_values['total_yield'] + fill_values['daily_yield']
            df = pd.merge(df, fill_values.drop(['total_yield', 'daily_yield'], axis=1), how='left',on=['source_key', 'date'])
            df['total_yield'].fillna(df['total_yield_fill_value'], inplace=True)
            df.drop('total_yield_fill_value', axis=1, inplace=True)
        for df in [plant1]:
            df.sort_values(['source_key', 'date_time'], ascending=True, inplace=True)
            df['total_yield'].fillna(method='ffill', inplace=True)
            df['plant_id'].fillna(method='ffill', inplace=True)
        for df in [plant1]:
            df.loc[(df['daily_yield'] > 0) & (df['hour'] < 5), 'daily_yield'] = 0
        plant1['dc_power'] /= 10.
        for df in [plant1]:
            df.sort_values(['source_key', 'date_time'], ascending=True, inplace=True)
            df.rename(columns={"daily_yield": "cumulative_daily_yield"}, inplace=True)
            df['dc_ac_ratio'] = np.where(df['ac_power'] == 0, 0, df['dc_power'] / df['ac_power'])
            df['yield'] = df['cumulative_daily_yield'].diff().fillna(0)
            # fix differences at the boundaries
            source_key_mask = df['source_key'] != df['source_key'].shift(1)
            day_mask = df['date'] != df['date'].shift(1)
            df.loc[source_key_mask, 'yield'] = 0
            df.loc[day_mask, 'yield'] = 0
            df['avg_hourly_dc_power'] = df.groupby(['source_key', 'hour'])['dc_power'].transform(func=np.mean)
            df['avg_hourly_ac_power'] = df.groupby(['source_key', 'hour'])['ac_power'].transform(func=np.mean)
            df['hourly_yield'] = df.groupby(['source_key', 'hour'])['yield'].transform(func=np.sum)
            df['avg_daily_dc_power'] = df.groupby(['source_key', 'date'])['dc_power'].transform(func=np.mean)
            df['avg_daily_ac_power'] = df.groupby(['source_key', 'date'])['ac_power'].transform(func=np.mean)
            df['avg_daily_dc_ac_ratio'] = df.groupby(['source_key', 'date'])['dc_ac_ratio'].transform(func=np.mean)
            df['total_daily_yield'] = df.groupby(['source_key', 'date'])['cumulative_daily_yield'].transform(func='last')
            df['avg_daily_yield'] = df.groupby(['source_key'])['total_daily_yield'].transform(func=np.mean)
        features_to_keep = [
            "source_key", "plant_id",
            "date_time", "date", "hour", "day", "weekday", "month", "year",
            'dc_power', 'cumulative_daily_yield',
            'ambient_temperature', 'module_temperature', 'irradiation',
            'avg_hourly_dc_power',
            'avg_daily_dc_power',
            'total_daily_yield', 'avg_daily_yield',
            'yield', 'hourly_yield',
        ]
        plant1.drop([c for c in plant1.columns if c not in features_to_keep], axis=1, inplace=True)
        self.plant = plant1
        self.df = df
        self.features = features_to_keep
        self.keys = self.df['source_key'].unique()
        for key in self.keys:
            print(self.plant[self.plant['source_key']==key].shape)

    def creat_data(self,data, look_back):
        dataX, dataY = [], []
        for i in range(len(data) - look_back):
            temp = data[i:i + look_back]
            dataX.append(temp)
            dataY.append([data[i + look_back]])
        return np.array(dataX), np.array(dataY)
    def BuildModel(self):
        timestep = self.train_x.shape[1]
        dim = self.train_x.shape[2]
        model = Sequential()
        model.add(LSTM(64, activation='relu', input_shape=(timestep, dim), return_sequences=True))
        model.add(Dropout(rate=0.2))
        model.add(LSTM(32, activation='relu', return_sequences=False))
        model.add(Dropout(rate=0.2))
        # model.add(LSTM(1, activation='relu'))
        model.add(RepeatVector(timestep))
        model.add(LSTM(32, activation='relu', return_sequences=True))
        model.add(Dropout(0.2))
        model.add(LSTM(64, activation='relu', return_sequences=True))
        model.add(Dropout(rate=0.2))
        model.add(TimeDistributed(Dense(dim)))
        model.compile(optimizer='adam', loss='mse')
        model.summary()
        print(model)
        return model
    def dataSplit(self):
        self.source_key = self.plant['source_key'].unique()
        self.useful_features = ['irradiation','ambient_temperature','module_temperature','dc_power']
        train_ = []
        test_ = []
        for key in self.source_key:
            dataset = self.df[self.df['source_key']==key]
            dataset = dataset[self.useful_features].values
            train_one = dataset[:len(dataset)//2]
            test_one = dataset[len(dataset)//2:]
            for t in train_one:
                train_.append(t)
            for t in test_one:
                test_.append(t)
        self.train = np.array(train_)
        self.test = np.array(test_)
        self.scale = MinMaxScaler(feature_range=(0, 1))
        self.train_scale = self.scale.fit_transform(self.train)
        self.test_scale = self.scale.fit_transform((self.test))
        self.train_x = self.train_scale.reshape(self.train_scale.shape[0],1,self.train_scale.shape[1])
        self.test_x = self.test_scale.reshape(self.test_scale.shape[0],1,self.test_scale.shape[1])
        # self.train_x, self.train_y = self.creat_data(self.train_scale, self.T)
        # self.test_x,self.test_y = self.creat_data(self.test_scale, self.T)
        # self.train_y = self.train_y[:,-1]
        # self.test_y = self.test_y[:,-1]
    def TrainModel(self,args):
        self.model = self.BuildModel()
        history = self.model.fit(self.train_x, self.train_x, epochs=args.epochs, batch_size=args.batch, validation_split=.2,verbose=1).history
        plt.plot(history['loss'], label="Training loss")
        plt.plot(history['val_loss'], label="Validation loss")
        plt.legend()
        plt.show()

        trainPredict = self.model.predict(self.train_x)
        trainPredict = trainPredict.reshape(trainPredict.shape[0],trainPredict.shape[2])
        trainPredict = self.scale.inverse_transform(trainPredict)
        print(trainPredict)
        print(self.train)
        self.train = self.train.reshape(self.train.shape[0],1,self.train.shape[1])
        trainPredict = trainPredict.reshape(trainPredict.shape[0],1,trainPredict.shape[1])
        trainMAE = np.mean(np.abs(trainPredict - self.train), axis=1)
        plt.hist(trainMAE[:, -1], bins=30)
        plt.show()
        self.maxMAE = max(trainMAE[:, -1])
        self.choiceMAE = 200
    def Predect(self):
        self.dataLast = dict()
        for key in self.source_key:
            dataset = self.df[self.df['source_key'] == key]
            dataset = dataset[self.useful_features].values
            dataset_scale = self.scale.fit_transform(dataset)
            test = dataset_scale.reshape(len(dataset_scale),1,len(dataset_scale[0]))
            testPredict = self.model.predict(test)
            testPredict = testPredict.reshape(testPredict.shape[0], testPredict.shape[2])
            testPredict_t = self.scale.inverse_transform(testPredict)
            # testPredict = testPredict_t.reshape(testPredict_t.shape[0],1,testPredict_t.shape[1])
            # dataset = dataset.reshape(dataset.shape[0],1,dataset.shape[1])
            # testMAE = np.mean(np.abs(testPredict - dataset), axis=1)
            # plt.hist(testMAE[:, -1], bins=30)
            # plt.show()
            # # print(testMAE)

            datasave = self.df[self.df['source_key']==key]
            datasave['testPre'] = testPredict_t[:,-1]
            datasave['loss_mae'] = (datasave['testPre']-datasave['dc_power']).abs()
            datasave['trainMAE'] = self.maxMAE
            datasave['Threshold'] = self.choiceMAE
            datasave['anomaly'] = datasave['loss_mae'] > datasave['Threshold']
            anomalies = datasave.loc[datasave['anomaly'] == True]
            fig = plt.figure()
            ax1 = fig.add_subplot(111)
            ax1.plot(datasave['date_time'], datasave['dc_power'], color='b', label="DC_POWER")
            ax1.plot(datasave['date_time'], datasave['testPre'], color='orange', label="Predict")
            ax1.scatter(anomalies['date_time'], y=anomalies['dc_power'], color="r")
            ax2 = ax1.twinx()
            ax2.plot(datasave['date_time'], datasave['irradiation'], color='y', label="IRRADIATION")
            ax1.legend(ncol=4, loc="best")
            plt.show()
            # data_save =  datasave.to_json(orient='records', date_format = 'iso')
            # data_save = json.loads(data_save, encoding='utf-8')
            # self.dataLast[key] = data_save
            break
        # with open('dataLast.json','w') as f:
        #     json.dump(self.dataLast,f)

def main(args):
    lstm = LSTMPredict(args)
    lstm.TrainModel(args)
    lstm.Predect()
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='LSTM')
    parser.add_argument('-file1', dest='generation1_name', default="./data/Plant_1_Generation_Data.csv")
    parser.add_argument('-file2', dest='weather1_name', default="./data/Plant_1_Weather_Sensor_Data.csv")
    parser.add_argument('-file3', dest='check', default="./data/Check_Data.csv")
    parser.add_argument('-epochs', dest='epochs', default=10)
    parser.add_argument('-batch', dest='batch', default=10)
    parser.add_argument('-seq_size', dest='seq_size', default=4)
    args = parser.parse_args()
    main(args)