import argparse
import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dropout, RepeatVector, TimeDistributed, Dense

import matplotlib.pyplot as plt
# from sklearn.preprocessing import StandardScaler, MinMaxScaler
# from tensorflow.keras.layers import Input, Dropout, Dense, LSTM, TimeDistributed, RepeatVector
# from tensorflow.keras.models import Model,Sequential

class LSTMPredict:
    def __init__(self, args): # 初始化(整合出训练集数据和测试集数据)
        self.dataRead(args)
        self.dataSplit()
    def insert_missing_date_times(self, x):
        # .reindex(): 为DataFrame对象创建一个适应新索引的新对象;
        # pd.range(start:None, end:None): 生成一个固定频率的时间索引(其中freq:日期偏移量, name: 生成时间索引对象的名称)
        # x.index: 行索引数据，x.index.min():行索引数据的最小值
        return x.reindex(pd.date_range(x.index.min(), x.index.max(), freq='15min', name='date_time'))
    def dataRead(self, args): # 读取数据, 清洗整理数据
        g1 = pd.read_csv(args.generation1_name) # 读取多个光伏板的数据
        w1 = pd.read_csv(args.weather1_name) # 读取一个光伏板的数据
        for df in [g1, w1]:
            # for col in df.columns: # 遍历df对应的那个矩阵的列名
            df.columns = [col.lower() for col in df.columns] # .lower(): 将字符串里面所有字母变成小写
        # 统一时间列的格式: pd.to_datetime()里面第一个参数是原时间数据，format里面是原时间数据的格式，该方法将原时间数据转化为 %Y-%m-%d %H:%M:%S
        g1['date_time'] = pd.to_datetime(g1['date_time'], format='%d-%m-%Y %H:%M')
        w1['date_time'] = pd.to_datetime(w1['date_time'], format='%Y-%m-%d %H:%M:%S')
        original_rowcounts = [df.shape[0] for df in [g1, w1]] # 获取g1和w1的行数：。shape()返回:(行数, 列数)元组
        # .set_index(): 将某一列设为索引; .groupby()按某一关键词分组; .apply()里面的函数可对DataFrame对象进行操作(函数的参数就是DataFrame对象);
        # .drop("", axis): 第一个参数是列名或行名，axis为1则为列，为0则为行，用于删除指定的行或列。
        g1_new = g1.set_index('date_time').groupby('source_key').apply(self.insert_missing_date_times).drop("source_key", axis=1)
        g1_new.reset_index(inplace=True) # .reset_index(): 重置索引或其level的函数，inplace为True表示无索引(即将原有的索引删除，并以0,1,2,……来代替原有的索引)
        w1_new = w1.set_index('date_time').groupby('source_key').apply(self.insert_missing_date_times).drop("source_key", axis=1)
        w1_new.reset_index(inplace=True)
        g1 = g1_new
        w1 = w1_new
        del g1_new, w1_new # 删除g1_new, w1_new，解除g1_new, w1_new对相关数据的引用

        for df in [w1]:
            df.rename(columns={'source_key': 'weather_sensor_key'}, inplace=True) # 重命名索引、行名或列名; 其中如果inplace为True,则再原DataFrame上面更改
            df.drop('plant_id', axis=1, inplace=True) # inplace为True代表原DataFrame被替换(这里是在原DataFrame上面删除名为plant_id的这列数据)
        plant1 = pd.merge(g1, w1, how='left', on=['date_time']) # how:连接方式(left:左连接); on:用于连接的列名。(这里是左连接, 此时w1里面的板名数据的列名已经被更改，使得w1里面的数据可以重复地赋给g1里面相应的板上)
        p1_times_of_no_light = plant1[plant1['irradiation'] == 0.0].groupby('date_time')['source_key'].count().reset_index() # 其中plant1['irradiation'] == 0.0: 是遍历判断的方法(遍历判断每行数据)
        # .count()计数每组数据里非空行的数量
        p1_times_of_no_light['hour'] = p1_times_of_no_light['date_time'].dt.hour # .dt.hour: 获取该列日期数据里的小时数据
        for df in [plant1]:
            df['date'] = df['date_time'].dt.date
            df['hour'] = df['date_time'].dt.hour
            df['day'] = df['date_time'].dt.day
            df['weekday'] = df['date_time'].dt.day_name()
            df['month'] = df['date_time'].dt.month
            df['year'] = df['date_time'].dt.year
        # 按照每个光伏板以及其日期(哪天)对数据分组, 获取每组数据里面日期最后的一组数据
        grouped = plant1.groupby(['source_key', 'date']).last().reset_index()
        grouped['total_yield'] - grouped['daily_yield'] == grouped['total_yield'].shift(1) # 将 total_yield这列数据上移一个单位
        for df in [plant1]:
            # .loc[]: 选择行或列(其中第一个参数是判断条件，第二个是列名); .isna(): 判断数据里面是否有空值
            df.loc[(df['dc_power'].isna()) & ((df['hour'] < 5) | (df['hour'] > 18)), 'dc_power'] = 0
            df.loc[(df['ac_power'].isna()) & ((df['hour'] < 5) | (df['hour'] > 18)), 'ac_power'] = 0
            df.loc[(df['irradiation'].isna()) & (df['hour'] < 5), 'daily_yield'] = 0
            df.loc[(df['irradiation'].isna()) & ((df['hour'] < 5) | (df['hour'] > 18)), 'irradiation'] = 0
        for df in [plant1]:
            #  ~ : 按位取反; &: 按位与; |: 按位或
            fill_values = df[~df['daily_yield'].isna()].groupby(['source_key', 'date'])['daily_yield'].last().reset_index()
            fill_values.rename(columns={'daily_yield': 'daily_yield_fill_value_after_sunset'}, inplace=True)
            df = pd.merge(df, fill_values, how='left', on=['source_key', 'date'])
            df.loc[(df['daily_yield'].isna()) & (df['hour'] > 18), 'daily_yield'] = df.loc[(df['daily_yield'].isna()) & (df['hour'] > 18), 'daily_yield_fill_value_after_sunset']
            df.drop("daily_yield_fill_value_after_sunset", axis=1, inplace=True)
        for df in [plant1]:
            # .interpolate(): 插值函数, method: 可用的插值方法(linear: 线性等距插值)
            df['dc_power'].interpolate(method='linear', axis=0, inplace=True)
            df['ac_power'].interpolate(method='linear', axis=0, inplace=True)
            df['daily_yield'].interpolate(method='linear', axis=0, inplace=True)
            df['module_temperature'].interpolate(method='linear', axis=0, inplace=True)
            df['ambient_temperature'].interpolate(method='linear', axis=0, inplace=True)
            df['irradiation'].interpolate(method='linear', axis=0, inplace=True)
        for df in [plant1]:
            final_non_null_total_yields = df[~df['total_yield'].isna()].groupby(['source_key', 'date'])['total_yield'].last().reset_index()
            final_daily_yields = df.groupby(['source_key', 'date'])['daily_yield'].last().reset_index()
            fill_values = pd.merge(final_non_null_total_yields, final_daily_yields, how='left', on=['source_key', 'date'])
            fill_values['total_yield_fill_value'] = fill_values['total_yield'] + fill_values['daily_yield']
            df = pd.merge(df, fill_values.drop(['total_yield', 'daily_yield'], axis=1), how='left', on=['source_key', 'date'])
            # .fillna(): 填充空值方法(这里用于填充空值的值为: df['total_yield_fill_value'])
            df['total_yield'].fillna(df['total_yield_fill_value'], inplace=True)
            df.drop('total_yield_fill_value', axis=1, inplace=True)
        for df in [plant1]:
            df.sort_values(['source_key', 'date_time'], ascending=True, inplace=True)# sort_values(): 按行或列排序(其中ascending: 排序方式，True代表升序);
            df['total_yield'].fillna(method='ffill', inplace=True)# method:填充空值的方法(ffill: 用前面行/列的值，填充当前行/列的值)
            df['plant_id'].fillna(method='ffill', inplace=True)
        for df in [plant1]:
            df.loc[(df['daily_yield'] > 0) & (df['hour'] < 5), 'daily_yield'] = 0
        plant1['dc_power'] /= 10. # ‘dc_power’该列所有数据除以10
        for df in [plant1]:
            df.sort_values(['source_key', 'date_time'], ascending=True, inplace=True)
            df.rename(columns={'daily_yield': 'cumulative_daily_yield'}, inplace=True)
            df['dc_ac_ratio'] = np.where(df['ac_power'] == 0, 0, df['dc_power'] / df['ac_power']) # np.where(condition, x, y): 满足condition条件，则输出x，否则就输出y
            df['yield'] = df['cumulative_daily_yield'].diff().fillna(0)# .diff(): 一阶差分操作(相当于 df['cumulative_daily_yield'] - df['cumulative_daily_yield'].shift(1), .shift(1): 数据向下平移一格)
            source_key_mask = df['source_key'] != df['source_key'].shift(1) # 判断source_key这一列上一行和该行的数据是否相同。
            day_mask = df['date'] != df['date'].shift(1)
            df.loc[source_key_mask, 'yield'] = 0
            df.loc[day_mask, 'yield'] = 0
            df['avg_hourly_dc_power'] = df.groupby(['source_key', 'hour'])['dc_power'].transform(func=np.mean)# .transform(): ; np.mean: 取平均值, 这里的transfrom()方法是将分组后每组的'dc_power'列数据的平均值存入到'avg_hourly_dc_power'里面，每行数据都有其所在的那组数据的平均值
            df['avg_hourly_ac_power'] = df.groupby(['source_key', 'hour'])['ac_power'].transform(func=np.mean)
            df['hourly_yield'] = df.groupby(['source_key', 'hour'])['yield'].transform(func=np.sum)
            df['avg_daily_dc_power'] = df.groupby(['source_key', 'date'])['dc_power'].transform(func=np.mean)
            df['avg_daily_ac_power'] = df.groupby(['source_key', 'date'])['ac_power'].transform(func=np.mean)
            df['avg_daily_dc_ac_ratio'] = df.groupby(['source_key', 'date'])['dc_ac_ratio'].transform(func=np.mean)
            df['total_daily_yield'] = df.groupby(['source_key', 'date'])['cumulative_daily_yield'].transform(func='last')
            df['avg_daily_yield'] = df.groupby(['source_key'])['total_daily_yield'].transform(func=np.mean)
        features_to_keep = [ # 要保存的属性的目录
            "source_key", "plant_id",
            "date_time", "date", "hour", "day", "weekday", "month", "year",
            'dc_power', 'cumulative_daily_yield',
            'ambient_temperature', 'module_temperature', 'irradiation',
            'avg_hourly_dc_power',
            'avg_daily_dc_power',
            'total_daily_yield', 'avg_daily_yield',
            'yield', 'hourly_yield',
        ]
        plant1.drop([c for c in plant1.columns if c not in features_to_keep], axis=1, inplace=True) # 删除我们不想保存的列
        self.plant = plant1 # 数据集(用于训练的那个)
        self.df = df
        self.features = features_to_keep # 属性名称列表
        self.keys = self.df['source_key'].unique() # .unique(): 将某列数据去重之后转成以为numpy矩阵返回
        # print("按source_key(电机序号)分组的数据的行列数---------------")
        # for key in self.keys:
        #     print(self.plant[self.plant['source_key'] == key].shape) # 输出按source_key(电机序号)分组的数据的行列数
        # print("--------------------------------------------------")

    def dataSplit(self): # 分裂数据
        self.source_key = self.plant['source_key'].unique()
        self.useful_features = ['irradiation', 'ambient_temperature', 'module_temperature', 'dc_power']
        train_ = []
        test_ = []
        for key in self.source_key:
            dataset = self.df[self.df['source_key'] == key]
            dataset = dataset[self.useful_features].values
            # 对半分出训练集和测试集(对于每个电机而言)
            train_one = dataset[:len(dataset) // 2] # // 向下(即向负无穷方向)取整，例如：5//2=2, -5//2=-3
            test_one = dataset[len(dataset) // 2 : ]
            for t in train_one:
                train_.append(t)
            for t in test_one:
                test_.append(t)
            # 所以说我们是将所有的电机放到一起来进行训练
        self.train = np.array(train_)
        self.test = np.array(test_)
        self.scale = MinMaxScaler(feature_range=(0, 1)) # 创建一个放缩器，可将数据归一化到(0, 1)之间
        self.train_scale = self.scale.fit_transform(self.train) # .fit_transform(): 将训练集数据归一化至(0，1)之间
        self.test_scale = self.scale.fit_transform(self.test)
        self.train_x = self.train_scale.reshape(self.train_scale.shape[0], 1, self.train_scale.shape[1]) # .reshape(): 更换数据的行列数，这里是将原数据转换成三维数据。
        self.test_x = self.test_scale.reshape(self.test_scale.shape[0], 1, self.test_scale.shape[1])
    def BuildModel(self): # 创建训练模型
        timestep = self.train_x.shape[1]
        dim = self.train_x.shape[2]
        model = Sequential() # 创建一个时序模型
        model.add(LSTM(64, activation='relu', input_shape=(timestep, dim), return_sequences=True)) # .add(): 添加层(或者说是增量创建顺序模型)
        # LSTM(输出空间的维度, activation(要使用的激活函数，这里是reLU函数), input_shape(输入的每组数据的维度), return_sequences(是否要返回结果)): 该层输入要为一个三维数据
        model.add(Dropout(rate=0.2)) # Dropout层应用于输入，在训练期间以每一步的频率随机将输入单元设置为0(防止过度拟合), 未设置为 0 的输入按 1/(1 - rate) 放大，以使所有输入的总和保持不变。
        model.add(LSTM(32, activation='relu', return_sequences=False))
        model.add(Dropout(rate=0.2))
        model.add(RepeatVector(timestep)) # RepeatVector(n): 重复输入向量n次(输入二维张量，输出三维张量)
        model.add(LSTM(32, activation='relu', return_sequences=True))
        model.add(Dropout(rate=0.2))
        model.add(LSTM(64, activation='relu', return_sequences=True))
        model.add(Dropout(rate=0.2))
        model.add(TimeDistributed(Dense(dim))) # TimeDistributed(): 时间分布层(该包装器允许将层应用于输入的每个时间切片。); Dense(units): 常规密集连接的 NN 层(units: 输出的空间维度)
        model.compile(optimizer='adam', loss='mse') # .compile(): 用于在配置训练方法时，告知训练时用的优化器、损失函数和准确率评测标准。
        # 其中optimizer: 优化器(这里是adam优化器); loss: 损失函数(mse: 均方误差);
        model.summary() # .summary(): 显示模型内容的方法
        print(model)
        return model
    def TrainModel(self, args): # args：解析器
        self.model = self.BuildModel()
        # 训练模型 .fit()
        history = self.model.fit(self.train_x, self.train_x, epochs=args.epochs, batch_size=args.batch, validation_split=.2, verbose=1).history
        # .fit(训练集的输入特征, 训练集的标签, epochs(迭代次数), batch_size(每一批的大小), validation_split(若为0.2, 则表示从测试集中划分80%给训练集), verbose())函数:
        print(history)
        plt.plot(history['loss'], label='Training loss') # 训练集损失函数
        plt.plot(history['val_loss'], label='Validation loss') # 测试集损失函数
        plt.legend()
        plt.show()

        # 用训练集数据预测(我们这里的预测就是按照当前的原始数据与我们预测的数据的差异找有问题的电机)
        trainPredict = self.model.predict(self.train_x)
        trainPredict = trainPredict.reshape(trainPredict.shape[0], trainPredict.shape[2]) # 将预测数据转成二维数据
        trainPredict = self.scale.inverse_transform(trainPredict) # 对预测数据进行反归一化(或者说是撤销缩放)
        print(trainPredict)
        print(self.train)
        self.train = self.train.reshape(self.train.shape[0], 1, self.train.shape[1])
        trainPredict = trainPredict.reshape(trainPredict.shape[0], 1, trainPredict.shape[1])
        # 求预测数据与原数据在每列(每种属性)上面的差值的平均值
        trainMAE = np.mean(np.abs(trainPredict - self.train), axis=1) # .abs(): 求预测数据与原数据的差值的绝对值; .mean(): 求平均值(沿axis=1轴求平均值，由于该轴只有一个列表元素，所以相当于将该三维数据[70000, 1, 4]等价降维到二维[70000, 4])
        plt.hist(trainMAE[:, -1], bins=30) # 绘制交流电的差值情况(直方图，其中bins为整数时，横轴为bins定义范围内等宽bins的数量，就是每个柱状图的宽度所对应的值为bins，然后一直堆叠bins)
        plt.show()
        self.maxMAE = max(trainMAE[:, -1]) # 求这个最大值(最大的直流电发电量)
        self.choiceMAE = 200
    def Predect(self):
        self.dataLast = dict()
        for key in self.source_key:
            dataset = self.df[self.df['source_key'] == key] # self.df: 前面将原数据升维后的数据(所有数据)
            dataset = dataset[self.useful_features].values # 取出我们用于预测的数据
            dataset_scale = self.scale.fit_transform(dataset) # 数据归一化(重新训练归一化的scale模型)(此时为二维数据)
            test = dataset_scale.reshape(len(dataset_scale), 1, len(dataset_scale[0]))
            testPredect = self.model.predict(test) # 训练该电机所有的原数据
            testPredect = testPredect.reshape(testPredect.shape[0], testPredect.shape[2])
            testPredect_t = self.scale.inverse_transform(testPredect) # 反缩放(反归一化)

            # 储存该电机所有原数据的预测数据
            datasave = self.df[self.df['source_key'] == key]
            datasave['testPre'] = testPredect_t[:, -1]
            datasave['loss_mae'] = (datasave['testPre'] - datasave['dc_power']).abs() # 储存预测出的直流电数据与原直流电数据的差值的绝对值
            datasave['trainMAE'] = self.maxMAE # 最大的差值的绝对值
            datasave['Threshold'] = self.choiceMAE # 阈值
            datasave['anomaly'] = datasave['loss_mae'] > datasave['Threshold'] # 异常现象(大于阈值就是异常了)
            print(datasave)
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
            break

def main(args): # 主函数
    lstm = LSTMPredict(args)
    lstm.TrainModel(args)
    lstm.Predect()
if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='LSTM') # 创建解析器
    # description:在参数帮助文档之后显示的文本
    # .add_argument( 命名, dest: 被添加到parse_args()所返回对象上的属性名, default: 当参数未在命令行中出现时使用的值)
    parser.add_argument('-file1', dest='generation1_name', default="./data/Plant_1_Generation_Data.csv")
    parser.add_argument('-file2', dest='weather1_name', default='./data/Plant_1_Weather_Sensor_Data.csv')
    parser.add_argument('-file3', dest='check', default='./data/Try.csv')
    parser.add_argument('-epochs', dest='epochs', default=10)
    parser.add_argument('-batch', dest='batch', default=10)
    parser.add_argument('-seq_size', dest='seq_size', default=4)
    # epochs: 时代; batch: 一批; seq_size: 序号大小
    args = parser.parse_args() # 解析参数
    # 使用例如 args.batch(上面添加参数时参数的属性名dest即可返回其default的值)来调用即可。
    main(args)
