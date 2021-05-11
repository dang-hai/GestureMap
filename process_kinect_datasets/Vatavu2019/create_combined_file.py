#! /usr/local/Caskroom/miniconda/base/envs/irl/bin/python
import pandas as pd
from pathlib import Path
import sys
import tqdm

IDENTIFIER = 'VATAVU2019'

if __name__ == "__main__":
    files = Path(sys.argv[1]).iterdir()
    iterator = tqdm.tqdm(list(files))

    arr = []

    for f in iterator:
        if not f.suffix == '.csv':
            continue

        df = pd.read_csv(f, index_col=['GestureType', 'ParticipantID', 'TrialID', 'Timestamp', 'NumJoints'])
        arr.append(df)

    df = pd.concat(arr)

    p = Path(sys.argv[2])
    
    df.to_hdf(p.name + '.h5', IDENTIFIER)