import json
import numpy as np
import sys
from sklearn.manifold import MDS
from sklearn.decomposition import PCA
from sklearn.cluster import DBSCAN
class MDS_D:
    def __init__(self):
        self.get = sys.argv[1:]
        self.time = int(sys.argv[1:][0])
        # self.mae = int(sys.argv[1:][1])
        self.month = int(sys.argv[1:][1])
        self.day = int(sys.argv[1:][2])
        self.splitTime = []
        self.mds_data = []
        self.dataFilter = dict()
        self.hour = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]
        self.dataRead()
        self.dataDeal()
    def dataRead(self):
        with open(fileName,"r") as f:
            self.data = json.load(f)

    def get_cos_similar_matrix(self,v1, v2):
        num = float(np.dot(v1, v2))  # 向量点乘
        denom = np.linalg.norm(v1) * np.linalg.norm(v2)
        return 0.5 + 0.5 * (num / denom) if denom != 0 else 0
    def dataDeal(self):
        for i in range(7, 19, self.time):
            self.splitTime.append([i, i + self.time])
        self.tags = []
        self.matx = []
        for key in self.data:
            dataset = []
            for item in self.data[key]:
                if item['month']==self.month and item['day']==self.day:
                    dataset.append(item)
            self.dataFilter[key]=dataset
        node = []
        for key in self.dataFilter:
            # for time in self.splitTime:
            #     abnornal = 0
            #     t = 0
            for index,item in enumerate(self.dataFilter[key]):
                if index >= 24 and index < 76:
                    node.append([index,item['dc_power']])
                    self.tags.append({
                        "id": key,
                        "split": [int(index/4),int(index/4)+1],
                        # "abnum":abnornal
                    })
        self.matx = node
        clustering = DBSCAN(eps=0.3, min_samples=2).fit(self.matx)
        self.similar = []
        # for i in range(len(self.matx)):
        #     row = []
        #     for j in range(len(self.matx)):
        #         one = np.array(np.mat(self.matx[i]).reshape(-1))[0]
        #         two = np.array(np.mat(self.matx[j]).reshape(-1))[0]
        #         sim_AB = self.get_cos_similar_matrix(one,two)
        #         row.append(sim_AB)
        #     self.similar.append(row)
        for i in range(len(self.matx)):
            one = np.array(np.mat(self.matx[i]).reshape(-1))[0]
            self.similar.append(one)
        self.similar = np.mat(self.similar)
        embedding = MDS(n_components=2)
        pca = PCA(n_components=2)
        X_transformed = embedding.fit_transform(self.similar)
        for i in range(len(self.matx)):
            self.mds_data.append({
                "id":self.tags[i]['id'],
                "split":self.tags[i]['split'],
                "x":self.matx[i][0],
                "y":self.matx[i][1],
                'color':clustering.labels_[i]
                # "abnum":self.tags[i]['abnum']
            })
        print(self.mds_data)

def main():
    mds = MDS_D()
if __name__ == "__main__":
    # fileName = "D:\\劳动人民智慧的结晶\\作业\\大二下\\vis能源\\含注释系统\\data\\dataLast.json"
    fileName = "./data/dataLast.json"
    main()