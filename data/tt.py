import json
import numpy as np
import sys
from sklearn.manifold import MDS

from sklearn.metrics.pairwise import cosine_similarity
class MDS_D:
    def __init__(self):
        self.time = 4
        self.month = 5
        self.daytime = 16
        self.sourceKey = "1BY6WEcLGh8j5v7"
        self.value = [8,12]
        self.day = dict()
        self.similar = dict()



        self.splitTime = []
        self.mds_data = []
        self.dataFilter = dict()
        self.hour = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]
        self.dataRead()
        self.dataDeal()
    def dataRead(self):
        with open(fileName,"r") as f:
            self.data = json.load(f)

    def get_cos_similar_matrix(self,v1, v2):
        s = cosine_similarity(v1, v2)
        return s
        # num = float(np.dot(v1, v2))  # 向量点乘
        # denom = np.linalg.norm(v1) * np.linalg.norm(v2)
        # return 0.5 + 0.5 * (num / denom) if denom != 0 else 0
    def dataDeal(self):
        dataTarget = []
        TargetFeature = []
        for name in self.data:
            for item in self.data[name]:
                if item['month'] not in self.day:
                    self.day[item['month']] = []
                if item['day'] not in self.day[item['month']]:
                    self.day[item['month']].append(item['day'])
            break
        print(self.day)
        for i in range(0,24,self.time):
            self.splitTime.append([i,i+self.time])
        for item in self.data[self.sourceKey]:
            if item['month']==self.month:
                if item['day']==self.daytime:
                    if item['hour']>=self.value[0] and item['hour']<self.value[1]:
                        dataTarget.append(item)
        for item in dataTarget:
            TargetFeature.append(item['ambient_temperature'])
            TargetFeature.append(item['module_temperature'])
            TargetFeature.append(item['irradiation'])
        TargetFeature = np.mat(TargetFeature)
        for name in self.data:
            if name!=self.sourceKey:
                for m in self.day:
                    for d in self.day[m]:
                        for time in self.splitTime:
                            datasource = []
                            SourceFeature = []
                            for item in self.data[name]:
                                if item['month']== int(m) and item['day']==int(d):
                                    if item['hour']>=time[0] and item['hour']<time[1]:
                                        datasource.append(item)
                            for item in datasource:
                                SourceFeature.append(item['ambient_temperature'])
                                SourceFeature.append(item['module_temperature'])
                                SourceFeature.append(item['irradiation'])
                            SourceFeature = np.mat(SourceFeature)
                            # print(SourceFeature)
                            # print(SourceFeature)
                            similar_ = self.get_cos_similar_matrix(TargetFeature,SourceFeature)
                            # print(SourceFeature)
                            # print(TargetFeature)
                            print(similar_,time,name)
                            print("----------------------------------")
        # self.tags = []
        # self.matx = []
        # for key in self.data:
        #     dataset = []
        #     for item in self.data[key]:
        #         if item['month']==self.month and item['day']==self.day:
        #             dataset.append(item)
        #     self.dataFilter[key]=dataset
        # for key in self.dataFilter:
        #     for time in self.splitTime:
        #         abnornal = 0
        #         node = []
        #         for item in self.dataFilter[key]:
        #             if item['hour']>=time[0] and item['hour']<time[1]:
        #                 node.append([item['irradiation'],item['ambient_temperature'],item['module_temperature'],item['dc_power']])
        #                 if item['loss_mae']>self.mae:
        #                     abnornal+=1
        #         self.matx.append(node)
        #         self.tags.append({"id": key, "split": time,"abnum":abnornal})
        # self.similar = []
        # for i in range(len(self.matx)):
        #     one = np.array(np.mat(self.matx[i]).reshape(-1))[0]
        #     self.similar.append(one)
        # self.similar = np.mat(self.similar)
        # embedding = MDS(n_components=2)
        # X_transformed = embedding.fit_transform(self.similar)
        # for i in range(len(self.tags)):
        #     self.mds_data.append({
        #         "id":self.tags[i]['id'],
        #         "split":self.tags[i]['split'],
        #         "x":X_transformed[i][0],
        #         "y":X_transformed[i][1],
        #         "abnum":self.tags[i]['abnum']
        #     })
        # print(self.mds_data)

def main():
    mds = MDS_D()
if __name__ == "__main__":
    fileName = "./dataLast.json"
    main()