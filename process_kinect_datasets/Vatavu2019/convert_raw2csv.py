#! /usr/local/Caskroom/miniconda/base/envs/irl/bin/python

from scipy.io import loadmat
import pandas as pd
import numpy as np
from pathlib import Path
import sys
import tqdm

from xml.etree import ElementTree as ET

if __name__ == "__main__":
    output_dir = Path(__file__).parent / sys.argv[2]

    if not output_dir.exists():
        output_dir.mkdir()

    dirs = [f for f in Path(sys.argv[1]).iterdir()]

    for d in tqdm.tqdm(dirs):
        if not d.is_dir():
            continue

        for f in d.iterdir():
            if f.suffix != '.xml':
                continue

            gesture, tid = f.stem.split('-')

            pid = d.stem
            tree = ET.parse(f)
            root = tree.getroot()

            def parsePosture(elem):
                return dict(timestamp=elem.attrib['Time'], joints=elem)
            
            def parseJoints(data):
                res = []

                joints = [list(j.attrib.values())[1:] for j in data['joints']]
                joints = [j2 for j1 in joints for j2 in j1]
                joints = dict(enumerate(joints))

                entry = dict(
                    Timestamp=data['timestamp'],
                    NumJoints=20,
                    GestureType=gesture,
                    ParticipantID=pid,
                    TrialID=tid,
                )
                entry.update(joints)
                
                res.append(entry)
                    
                return res
            # print(f.stem)
            comp = map(parseJoints, map(parsePosture, root))
            data = [trial for part in comp for trial in part]

            if len(data) > 0:
                df = pd.DataFrame.from_records(data, index=['GestureType', 'ParticipantID', 'TrialID', 'Timestamp', 'NumJoints'])
                df.to_csv(Path(sys.argv[2], f'{gesture.replace(" ", "-")}_{pid}_{tid}.csv'))
            else:
                print('Missing data for ', f.stem)
