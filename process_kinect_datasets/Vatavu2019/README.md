Link to Website: http://www.eed.usv.ro/~vatavu/projects/DissimilarityConsensus/

Link to Dataset: http://www.eed.usv.ro/~vatavu/projects/DissimilarityConsensus/Dataset.rar

Radu-Daniel Vatavu. 2019. The Dissimilarity-Consensus Approach to Agreement Analysis in Gesture Elicitation Studies. In Proceedings of the 2019 CHI Conference on Human Factors in Computing Systems (CHI '19). Association for Computing Machinery, New York, NY, USA, Paper 224, 1–13. DOI:https://doi.org/10.1145/3290605.3300454

# Setup

1. Download the dataset
```
$ python download_dataset.py
```

2. Unpack the file with an approriate program and change into the unpacked directory.

3. Reformat to csv files and normalize it

```
python ./convert_raw2csv.py ./Dataset/ ./output \
python ./preprocess.py ./output \ 
python ./create_combined_file.py ./output vatavu_combined
```

4. Train the VAE
```
python -m cli.train  --epochs 1000 --data vatavu_combined --device cuda --validation_freq 100 --annealing monotonic --warmup 20 --zdim 2 --dataset_type wholebody --cold_duration 10 --lr 3e-04
```