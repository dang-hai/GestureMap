Link to Website: https://jainlab.cise.ufl.edu/publications.html#Kinder-Gator

Link to File: http://jainlab.cise.ufl.edu/documents/dataset/Kinder_Gator_dataset.zip

Aloba, A., Flores, G., Woodward, J., Shaw, A., Castonguay, A., Cuba, I., Dong, Y., Jain, E.and Anthony, L. 2018. Kinder-Gator: The UF Kinect Database of Child and Adult Motion. EUROGRAPHICS Proceedings, Delft, Netherlands, April 16-20, 2018, 4 pages. [Link to PDF](http://init.cise.ufl.edu/wordpress/wp-content/uploads/2018/11/Aloba-et-al.-EUROGRAPHICS-2018.pdf)

# Setup

1. Download the dataset
```
$ python download_dataset.py
```

2. Unpack the file with an approriate program and change into the unpacked directory.

3. Reformat to csv files and normalize it and change into the unpacked directory

```
python ./convert_raw2csv.py ./Kinder-Gator_dataset/SKELETON_DATA ./output
python ./preprocess.py ./output
python ./create_combined_file.py ./output kindergator
```

4. Train the VAE
```
python -m cli.train --epochs 1000 --data kindergator.h5 --device cuda --validation_freq 100 --annealing monotonic --warmup 20 --zdim 2 --dataset_type wholebody --cold_duration 10 --lr 3e-04
```