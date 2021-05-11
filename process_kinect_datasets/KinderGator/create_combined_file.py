import pandas as pd
from pathlib import Path
import sys
import tqdm

IDENTIFIER = 'KINDERGATOR'

if __name__ == "__main__":
    files = Path(sys.argv[1]).iterdir()
    iterator = tqdm.tqdm(list(files))
    df = pd.concat([pd.read_csv(f, index_col=['GestureType', 'ParticipantID', 'TrialID', 'Timestamp', 'NumJoints']) for f in iterator])

    fname = Path(sys.argv[2]).name
    df.to_hdf(fname + ".h5", IDENTIFIER)