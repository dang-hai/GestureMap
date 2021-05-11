# Setup 

1. Install python requirements

```bash
> pip install -r requirements.txt
```

2. Install frontend application dependencies:

```bash
> cd frontend && npm i
```

3. Run backend

```
> python backend/app.py
```

4. Run frontend

```
> cd frontend && npm start
```

The application should now run on localhost:3000


## Datasets used in this project

[Vatavu et al. Whole Body Gestures Dataset *](http://www.eed.usv.ro/~vatavu/projects/DissimilarityConsensus/)

*Radu-Daniel Vatavu. 2019. The Dissimilarity-Consensus Approach to Agreement Analysis in Gesture Elicitation Studies. In Proceedings of the 2019 CHI Conference on Human Factors in Computing Systems (CHI '19). Association for Computing Machinery, New York, NY, USA, Paper 224, 1–13. DOI: https://doi.org/10.1145/3290605.3300454

[Kinder-Gator DataSet]()
*Aloba, A., Flores, G., Woodward, J., Shaw, A., Castonguay, A., Cuba, I., Dong, Y., Jain, E.and )Anthony, L. 2018. Kinder-Gator: The UF Kinect Database of Child and Adult Motion. EUROGRAPHICS Proceedings, Delft, Netherlands, April 16-20, 2018, 4 pages. [Link to PDF](http://init.cise.ufl.edu/wordpress/wp-content/uploads/2018/11/Aloba-et-al.-EUROGRAPHICS-2018.pdf)


## Download, Data Preprocessing and Model Training

* [Setup Vatavu2019 Dataset](./process_kinect_datasets/Vatavu2019/README.md)
* [Setup KinderGator Dataset](./process_kinect_datasets/KinderGator/README.md)