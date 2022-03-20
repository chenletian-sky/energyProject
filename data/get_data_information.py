import csv
import time

if __name__ == '__main__':
    dataset = {}
    # data\Plant_1_Generation_Data.csv
    # path1 = ['D:\能源论文(光伏)\系统\系统\power\data\Plant_1_Generation_Data.csv', 'Plant_2_Generation_Data.csv']
    # path1 = ['D:\\劳动人民智慧的结晶\\作业\\大二下\\vis能源\\energyProject\\data\\Plant_1_Generation_Data.csv', 'Plant_2_Generation_Data.csv']
    path1 = ['./data/Plant_1_Generation_Data.csv', 'Plant_2_Generation_Data.csv']
    # path1 = ['Plant_1_Generation_Data.csv', 'Plant_2_Generation_Data.csv']
    path2 = ['Plant_1_Weather_Sensor_Data.csv', 'Plant_2_Weather_Sensor_Data.csv']

    # path1对应的数据集的数据
    time_min1 = ''
    time_max1 = ''
    number1 = 0
    names1 = {}
    with open(path1[0], 'r', encoding='utf-8') as f1:
        reader1 = csv.reader(f1)
        name1 = next(reader1)
        csv_reader1 = csv.DictReader(f1, fieldnames=name1)
        index = 0
        for row1 in csv_reader1:
            # 获取时间范围数据
            time1 = time.strptime(row1['DATE_TIME'], '%d-%m-%Y %H:%M') # 将字符串转换成时间数组
            time1 = time.strftime('%Y-%m-%d %H:%M', time1) # 将时间数组转换成时间戳
            if index == 0:
                time_min1 = time1
                time_max1 = time1
            else:
                if time1 > time_max1:
                    time_max1 = time1
                if time1 < time_min1:
                    time_min1 = time1
            index += 1
            # 获取逆变器数量数据
            if row1['SOURCE_KEY'] not in names1.keys():
                names1[row1['SOURCE_KEY']] = 0
                number1 += 1
            # break
        f1.close()
    dataset = {'start_time': str(time_min1), 'end_time': str(time_max1), 'number': number1}
    print(dataset)

    # 验证部分(验证数据的正确性)
    # # path2对应的数据集的数据
    # time_min1 = ''
    # time_max1 = ''
    # with open(path1[1], 'r', encoding='utf-8') as f1:
    #     reader1 = csv.reader(f1)
    #     name1 = next(reader1)
    #     csv_reader1 = csv.DictReader(f1, fieldnames=name1)
    #     index = 0
    #     for row1 in csv_reader1:
    #         # 获取时间范围数据
    #         time1 = time.strptime(row1['DATE_TIME'], '%Y-%m-%d %H:%M:%S')  # 将字符串转换成时间数组
    #         time1 = time.strftime('%Y-%m-%d %H:%M', time1)  # 将时间数组转换成时间戳
    #         if index == 0:
    #             time_min1 = time1
    #             time_max1 = time1
    #         else:
    #             if time1 > time_max1:
    #                 time_max1 = time1
    #             if time1 < time_min1:
    #                 time_min1 = time1
    #         index += 1
    #         # break
    #     f1.close()
    # if time_max1 < dataset['end_time']:
    #     dataset['end_time'] = time_max1
    # if time_min1 > dataset['end_time']:
    #     dataset['start_time'] = time_min1
    # print(dataset)