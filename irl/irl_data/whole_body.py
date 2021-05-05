import pandas as pd

class WholeBodyDataset:
    def __init__(self, path):
        self.path = path

    def load(self):

        if (self.path.suffix == ".csv"):
            df = pd.read_csv(self.path)
            df.index.name = 'Index'
            index_cols = df.columns[:len(df.columns) - 60]
            df = df.set_index(index_cols.tolist(), append=True)
        else:
            df = pd.read_hdf(self.path)

        return df