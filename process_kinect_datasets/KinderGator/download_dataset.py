import sys
import re
import requests

from tqdm import tqdm
from pathlib import Path


def clean(key: str):
    if re.search('[^0-9a-zA-Z]+', key):
        print(f'Dataset descriptior should only contain alphanumeric characters')
        sys.exit(1)

    return True

def create_filename_from_descriptor(descriptor):
    return re.sub('[^0-9a-zA-Z]+', '', descriptor)

def download(url, file_path):
    resp = requests.get(url, stream=True)

    total_size_in_bytes= int(resp.headers.get('content-length', 0))
    block_size = 1024
    progress_bar = tqdm(
        total=total_size_in_bytes,
        unit='iB',
        unit_scale=True)

    with open(file_path, 'wb') as out:
        for data in resp.iter_content(block_size):
            progress_bar.update(len(data))
            out.write(data)

    progress_bar.close()
    if total_size_in_bytes != 0 and progress_bar.n != total_size_in_bytes:
        print("ERROR, something went wrong")

def process(descriptor, url):
    suffix = Path(url).suffix
    file_path = Path(f'./{descriptor}{suffix}')
    
    if not file_path.exists():
        download(url, file_path)
 

if __name__ == "__main__":
    URL = "http://jainlab.cise.ufl.edu/documents/dataset/Kinder_Gator_dataset.zip"
    DESCRIPTOR = "KinderGator"

    process(DESCRIPTOR, URL)