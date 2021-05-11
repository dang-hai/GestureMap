from tqdm import tqdm
import sys

from pathlib import Path
import pandas as pd


def parse(sub_dir, base_dir, outdir):
    files = [f for f in Path(base_dir, sub_dir).iterdir() if f.suffix == '.csv']
    output_dir = Path(__file__).parent / sys.argv[2]

    if not output_dir.exists():
        output_dir.mkdir()
    
    for f in tqdm(files, desc="Convert to csv"):
        assert(f.stem.startswith('POSE-'))
        fname = f.stem[5:]
        felems = fname.split('-')

        pid, mid = felems[0].split('_')
        pid = f'{sub_dir[0]}{pid[1:]}'
        gesture = ' '.join(felems[1:-1])

        df = pd.read_csv(f, header=None, skiprows=1, index_col=0, dtype=str)
        df = df.drop(columns=[61, 62, 63])
        df.columns = list(range(60))
        df.index.name = 'Timestamp'
        df['GestureType'] = gesture
        df['ParticipantID'] = pid
        df['TrialID'] = mid
        df['NumJoints'] = 20

        df = df.set_index(['GestureType', 'ParticipantID', 'TrialID', 'NumJoints'], append=True)
        df.to_csv(Path(outdir, f'{sub_dir}_{gesture.replace(" ", "_")}_{pid}_{mid}.csv'))

        

if __name__ == "__main__":
    parse('Adults', sys.argv[1], sys.argv[2])
    parse('Children', sys.argv[1], sys.argv[2])