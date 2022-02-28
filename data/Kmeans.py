import numpy as np
import pandas as pd
import argparse
from sklearn.preprocessing import StandardScaler, MinMaxScaler
import json
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
import sys
class TimeStepGrate:
    def __init__(self):
        self.dataRead()
        self.timestep = int(sys.argv[1:][0])
        self.k = int(sys.argv[1:][1])
        # self.timestep = 4
        # self.k = 4
    def insert_missing_date_times(self,x):
        return x.reindex(pd.date_range(x.index.min(), x.index.max(), freq='15min', name='date_time'))

    def dataRead(self):
        g1 = pd.read_csv("./data/Plant_1_Generation_Data.csv")
        w1 = pd.read_csv("./data/Plant_1_Weather_Sensor_Data.csv")
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
        # print(self.df[['hour']])
    def meanns(self):
        time = [[i,i+self.timestep] for i in range(7,19,self.timestep)] # 从7到19(不含19)遍历，每次的遍历步长间隔为self.timestep
        category = []
        for t in time:
            attrs = []
            ambient = self.df.loc[(self.df['hour']>=t[0]) & (self.df['hour'] < t[1]),'ambient_temperature'].reset_index()
            module = self.df.loc[(self.df['hour']>=t[0]) & (self.df['hour'] < t[1]),'module_temperature'].reset_index()
            irradiation = self.df.loc[(self.df['hour']>=t[0]) & (self.df['hour'] < t[1]),'irradiation'].reset_index()
            lens = ambient.shape[0]
            for i in range(lens):
                attrs.append(ambient.iat[i,1])
                attrs.append(module.iat[i,1])
                attrs.append(irradiation.iat[i,1])
            attrs = np.array(attrs)
            category.append(attrs) # 每行数据都是这个小时间隔的数据
        category = np.array(category)
        kmeans = KMeans(n_clusters=self.k, random_state=0).fit(category) # n_clusters: 聚的类数(即据多少类)
        label = kmeans.labels_
        labeldict = dict()
        for i in range(len(time)):
            labeldict[str(time[i][0])+"~"+str(time[i][1])] = label[i] # 输出：{时间段：类别}
        print(labeldict)
def main():
    StepGrate = TimeStepGrate()
    StepGrate.meanns()
if __name__ == "__main__":
    main()