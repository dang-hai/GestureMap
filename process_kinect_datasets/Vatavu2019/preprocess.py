import sys
import tqdm

import pandas as pd
from pathlib import Path

def normalize_height(g):
    values = g.values.reshape(-1, 20, 3)
    minVals, maxVals = values[0:1].min(axis=(0, 1)), values[0:1].max(axis=(0, 1))

    scale = 1.0 / (maxVals[1] - minVals[1])
    new_values = (values - minVals) * scale + minVals
    new_values = new_values.reshape(-1, 60)
    return pd.DataFrame(new_values, index=g.index, columns=g.columns)

def translate_to_origin(g):
    values = g.values.reshape(-1, 20, 3)
    centroid_pose = values.sum(axis=0, keepdims=True) / values.shape[0]
    centroid_point = centroid_pose.sum(axis=1, keepdims=True) / values.shape[1]
    new_values = values - centroid_point
    new_values = new_values.reshape(-1, 60)

    return pd.DataFrame(new_values, index=g.index,  columns=g.columns)

def invert_ys(g):
    values = g.values.reshape(-1, 20, 3)
    values[:, 1] = -values[:, 1]
    new_values = values.reshape(-1, 60)

    return pd.DataFrame(new_values, index=g.index,  columns=g.columns)


if __name__ == "__main__":
    files = list(Path(sys.argv[1]).iterdir())
    iterator = tqdm.tqdm(files)
    for f in iterator:
        iterator.set_description(f.stem)

        if f.suffix == '.csv':
            frame = pd.read_csv(f, index_col=['GestureType', 'Timestamp', 'NumJoints', 'ParticipantID', 'TrialID'])
            (frame.groupby(['GestureType', 'ParticipantID', 'TrialID'])
                .apply(lambda g: (g.pipe(normalize_height)
                                  .pipe(translate_to_origin)
                                #   .pipe(invert_ys)
                                  .to_csv(f)))
            )