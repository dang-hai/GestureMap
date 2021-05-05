"""
This module provides handles all actions
related to embedding into latent space.
"""
import json
import torch
import datetime
from pathlib import Path
from typing import List
from itertools import product, count

import pymongo
from pymongo.errors import PyMongoError
from bson.objectid import ObjectId

import torch
import numpy as np
import pandas as pd

from irl_model.model import VAEFully512R4
from irl_data import WholeBodyDataset
from irl_plotter import WholeBodyPlotter

from tslearn.barycenters import dtw_barycenter_averaging
from tslearn.clustering import TimeSeriesKMeans
from tslearn.utils import to_time_series_dataset

from dtaidistance.dtw_ndim import distance_fast, warping_paths
from dtaidistance.dtw import best_path


class Controller:
    """This class encapsulates methods to embed data using a pretrained model.

    The function output of each method is a pandas dataframe which can be sent to
    a frontend client for visualization.
    """

    def __init__(self, filestore, upload_dir):
        """Initializes a new Controller instance.

        Parameters
        ----------
        model:
            A pytorch model used to embed the data.
        """
        self.model = None
        self._active_dataset = None
        self.plotter = None
        self.domain_range = (-1.0, 1.0)
        self.filestore = filestore
        self.upload_dir = upload_dir
        self.db = pymongo.MongoClient()['irl']

    def _groupby(self, dataframe):
        return dataframe.groupby(['ParticipantID', 'GestureType', 'TrialID'])

    def init_app(self, _id) -> None:
        doc = self.db['config'].find_one({'name': _id})
        print('Init app', doc, _id)
        self.plotter = WholeBodyPlotter(skeleton=dict(
            head=3, shoulder_center=2, spine=1, hip_center=0, 
            shoulder_left=4, elbow_left=5, wrist_left=6, hand_left=7,
            shoulder_right=8, elbow_right=9, wrist_right=10, hand_right=11,
            hip_left=12, knee_left=13, ankle_left=14, foot_left=15,
            hip_right=16, knee_right=17, ankle_right=18, foot_right=19
        ))

        if doc:
            dataset_path = Path(self.upload_dir, doc['data'])
            dataset = WholeBodyDataset(dataset_path).load()
            self._active_dataset = dataset

            ckpt_path = Path(self.upload_dir, doc['model'])
            ckpt = torch.load(ckpt_path, map_location='cpu')
            model = VAEFully512R4(inp_dim=60, z_dim=2)
            model.load_state_dict(ckpt['model_state_dict'])
            model.eval()
            self.model = model
        else:
            raise Exception("Can not load configuration", _id)

    def calculate_reconstruction(self, data: np.ndarray) -> str:
        """Decodes the latent embedding and reconstructs the original dimensions.

        Parameters
        ----------
        data:
            A numpy array containing the values in latent dimensioins.

        Returns
        -------
            A json array rerpresenting the paths for drawing the skeleton.
        """
        with torch.no_grad():
            tensor = torch.tensor(data).float()
            decoded_data = self.model.decode(tensor)
            decoded_data = decoded_data.numpy()

        values = [frame.reshape(-1, 3) for frame in decoded_data]
        values = [{
            'x': arr[:, 0].tolist(),
            'y': arr[:, 1].tolist(),
            'z': arr[:, 2].tolist()
        } for arr in values]

        return json.dumps({'data': values, 'type': 'reconstructed'})


    def get_skeleton(self, query) -> np.ndarray:
        """Retrieves the original skeleton data given the index.

        Parameters
        ----------
        query:
            A query object.

        Returns
        -------
            A json array rerpresenting the paths for drawing the skeleton.
        """
        res = dict(data=[])

        if query is None:
            return json.dumps(res)

        if isinstance(query, int):
            values = self._active_dataset.iloc[query, :].values

        else:
            values = self._active_dataset[
                self._active_dataset.index.get_level_values('GestureType').isin([query['GestureType']]) &
                self._active_dataset.index.get_level_values('ParticipantID').isin([query['ParticipantID']]) &
                self._active_dataset.index.get_level_values('TrialID').isin([query['TrialID']])
            ]
        
        values = [frame.reshape(-1, 3) for frame in values]
        values = [{
            'x': arr[:, 0].tolist(),
            'y': arr[:, 1].tolist(),
            'z': arr[:, 2].tolist()
        } for arr in values]
        return json.dumps({'data': values, 'type': 'original'})

    def calculate_skeleton_grid(self, xrange, yrange, num=11):
        """Calculates a grid of reconstructed latent samples.

        The grid of reconstructed latent samples gives the user a quick overview
        over the latent space. For this, a point grid is calculated over the plotting area
        representing `areas` of reconstructed values.

        Parameters
        ----------
        num:
            The density of the grid.

        Returns
        -------
        A list containing the data values to be plotted using the plotly framework.
        """
        # Draw grid background
        xsize = np.abs(xrange[1] - xrange[0])
        ysize = np.abs(yrange[1] - yrange[0])

        # number of reconstructed gestures in one row
        x_grid, y_grid = np.meshgrid(
            np.linspace(xrange[0], xrange[1], num + 1),
            np.linspace(yrange[0], yrange[1], num + 1))

        grid = np.zeros((num, num, 3))
        grid[:, :, 0] += x_grid[:1, :-1]
        grid[:, :, 1] += y_grid[:-1, :-1]

        # center each grid cell horizontally
        grid[:, :, 0:1] += (xsize/num) * 0.5
        grid[:, :, 1:2] += (ysize/num) * 0.5

        with torch.no_grad():
            latent_tensor = torch.tensor(grid[:, :, :2].reshape(-1, 2)).float()
            decoded_data = self.model.decode(latent_tensor).numpy()

        # scale data to fit within one grid cell
        decoded_data = decoded_data.reshape(num, num, -1, 3)
        decoded_data = decoded_data - np.amin(decoded_data, axis=2, keepdims=True)
        max_dim = np.amax(decoded_data, axis=2, keepdims=True)
        min_dim = np.amin(decoded_data, axis=2, keepdims=True)

        ranges = np.abs(max_dim - min_dim)
        
        x_scale = np.max(ranges[:, :, :, 0]) / (xsize / num)
        y_scale = np.max(ranges[:, :, :, 1]) / (ysize / num)

        decoded_data[:, :, :, 0] /= x_scale * 1.2
        decoded_data[:, :, :, 1] /= y_scale * 1.2

        # Center the calculated cuboid centroid of the skeleton within the grid cell
        centroids = decoded_data.sum(axis=2) / decoded_data.shape[2]
        decoded_data += np.expand_dims(grid - centroids, axis=2)

        res = []
        idx = count()
        for i, j in product(range(num), range(num)):
            skeleton = decoded_data[i, j]
            # skeleton[i, j, :, 0] = np.expand_dims(grid[i, j, 0], axis = 2) - skeleton[i, j, :, 0]


            skeleton_paths = []
            for path in self.plotter.get_skeleton_paths(skeleton):
                path[:, 0] = path[:, 0] - 2 * (path[:, 0] - grid[i, j, 0])
    
                skeleton_paths.append(
                    {
                        'z1_dim': path[:, 0].tolist(),
                        'z2_dim': path[:, 1].tolist()
                    }
                )

            skeleton_data = dict(id=next(idx), skeleton=skeleton_paths)
            res.append(skeleton_data)

        return json.dumps(res)

    def get_referents(self) -> str:
        """Retrieves a list of unique gesture types contained in the active dataset.

        Returns
        -------
        A json string representing a list of gesture types
        """
        gesture_types = self._active_dataset.index.get_level_values('GestureType').unique()
        return pd.DataFrame(gesture_types, columns=["GestureType"]).to_json(orient="table")

    def get_latent_trial_values(self, gesture_type: List[str]) -> str:
        """Retrieves individual static poses for the given gesture type.

        Parameters
        ----------
        gesture_type:
            The identifier of the gesture type

        Returns
        -------
        A json string representing the various trials.
        """

        filter_idx = self._active_dataset.index.get_level_values('GestureType').isin(gesture_type)
        gesture_df = self._active_dataset[filter_idx]

        with torch.no_grad():
            tensor = torch.from_numpy(gesture_df.values).float()
            mean, _ = self.model.encode(tensor)
        
        df = pd.DataFrame(mean.numpy(), columns=["z1", "z2"])
        df.index.name = "Index"

        df['GestureType'] = gesture_df.index.get_level_values('GestureType')
        df['ParticipantID'] = gesture_df.index.get_level_values('ParticipantID')
        df['TrialID'] = gesture_df.index.get_level_values('TrialID')
        df = df.reset_index()

        return df.groupby(['GestureType', 'ParticipantID', 'TrialID']).agg(list).to_json(orient="table")

    def get_raw_gesture(self, rid, pid, tid):
        res = self._active_dataset[
            (self._active_dataset.index.get_level_values('GestureType').isin([rid])
            & self._active_dataset.index.get_level_values('ParticipantID').isin([pid])
            & self._active_dataset.index.get_level_values('TrialID').isin([tid]))
        ]

        if res.shape[0] != 1:
            arr = res.values
            frames = [frame.reshape(-1, 3) for frame in arr]
            frames = [{'x': f[:, 0].tolist(), 'y': f[:, 1].tolist(), 'z': f[:, 2].tolist()} for f in frames]
    
            return json.dumps({'referent': rid, 'data': frames})
        
        return json.dumps({'error': { 'msg': f'Could not find data matching: Referent {rid} Participant {pid} Trial {tid}'}})

    
    def _find_barycenter(self, key, configID):
            return self.db['barycenters'].find_one({'Referent': key, 'configID': configID})


    def _caluclate_barycenter(self, key):
        idx = self._active_dataset.index.get_level_values('GestureType').isin([key])
        filtered = self._active_dataset[idx]

        with torch.no_grad():
            tensor = torch.from_numpy(filtered.values).float()
            encoded, _ = self.model.encode(tensor)

        tss = pd.DataFrame(encoded, index=filtered.index)
        tss = tss.groupby(['GestureType', 'ParticipantID', 'TrialID']).apply(lambda g: g.values)
        
        barycenters = (tss.groupby('GestureType')
            .apply(to_time_series_dataset)
            .apply(dtw_barycenter_averaging, verbose=True)
        )

        return barycenters.values[0]

    def get_barycenters(self, gesture_types, configID) -> str:
        """Get the barycenter for each gesture type in @gesture_types
        
        Returns
        -------
        A json string representing the barycenters for the given gesture types.
        """
        res = dict([(key, None) for key in gesture_types])

        for k, v in res.items():
            doc = self._find_barycenter(k, configID)
            
            if not doc:
                bary = self._caluclate_barycenter(k)
                doc = {'configID': configID, 'Referent': k, 'data': bary.tolist()}
                self.db['barycenters'].insert_one(doc)

            bary = np.array(doc['data'])

            doc['_id'] = str(doc['_id'])
            res[k] = dict(
                Referent=doc['Referent'],
                configID=doc['configID'],
                z1=bary[:, 0].tolist(),
                z2=bary[:, 1].tolist()
            )
            
        return json.dumps({'data': list(res.values())})

    def get_barycenter_reconstruction(self, referent, configID):
        doc = self.db['barycenters'].find_one({'Referent': referent}, {'_id': False})

        if doc:
            with torch.no_grad():
                arr = np.array(doc['data'])
                tensor = torch.from_numpy(arr).float()
                rec = self.model.decode(tensor).numpy()

            frames = [frame.reshape(-1, 3) for frame in rec]
            frames = [{'x': f[:, 0].tolist(), 'y': f[:, 1].tolist(), 'z': f[:, 2].tolist()} for f in frames]
            return json.dumps({'referent': referent, 'data': frames})
        else:
            return json.dumps({'error': {'msg': f'Could not find barycenter for: {referent} {configID}'}})

    def get_cluster_status(self, uuid):
        doc = self.db['cluster_status'].find_one({'id': str(uuid)}, {'_id': False})
        doc['timestamp'] = str(doc['timestamp'])
        return json.dumps(doc) 

    def get_cluster(self, uuid):
        # doc = self.db['trained_cluster_models'].find_one({'_id': str(uuid)}, {'_id': False})
        doc = self.db['trained_cluster_models'].find_one({'_id': str(uuid)}, {'_id': False})


        centers = None
        if doc:
            k = doc['config']['hyper_params']['n_clusters']
            centers = [np.array(c) for c in doc['config']['model_params']['cluster_centers_']]
            centers = [{
                'GestureType': doc['referent'],
                'z1': c[:, 0].tolist(),
                'z2': c[:, 1].tolist()} for c in centers]

            centroid_names = []
            
            if 'centroid_names' in doc['config']:
                centroid_names = doc['config']['centroid_names']
            else:
                centroid_names = [f'Center {i}' for i in range(k)]
        
        return json.dumps({
            'K': k,
            'centroids': centers,
            'predictions': doc['config']['predictions'],
            'uid': str(uuid),
            'centroid_names': centroid_names
        })
    
    def list_clusters(self, rid):
        docs = self.db['cluster_status'].find({'referent': rid, 'status': {'$ne': 'ERROR'}}, {'_i': False})
        docs = [{
            'referent': d['referent'],
            'init_keys': d['init_keys'],
            'K': d['K'],
            'id': d['id'],
            'timestamp': str(d.get('timestamp', "")),
        } for d in docs]
        return json.dumps(docs)

    def update_config(self, config):
        centroids = [list(zip(c['z1'], c['z2'])) for c in config['centroids']]
        doc = self.db['trained_cluster_models'].update_one({'_id': str(config['uid'])}, 
            {'$set': {
                "config.hyper_params.n_clusters": config['K'],
                "config.model_params.cluster_centers_": centroids,
                "config.predictions": config['predictions'],
                "config.centroid_names": config['centroid_names']
            }})

        return json.dumps({'msg': 'Success'})

    def run_clustering(self, uid, referent, k, init, centroid_names):
        try:
            
            self.db['cluster_status'].insert_one({
                'id': uid,
                'referent': referent,
                'init_keys': init,
                'K': k,
                'centroid_names': centroid_names,
                'timestamp': datetime.datetime.utcnow(),
                'status': 'RUNNING'
            })

            data = self._active_dataset[self._active_dataset.index.get_level_values('GestureType').isin([referent])]

            with torch.no_grad():
                tensor = torch.from_numpy(np.stack(data.values)).float()
                encoded, _ = self.model.encode(tensor)

            tss_df = pd.DataFrame(encoded, columns=["z1", "z2"], index=data.index)
            tss_df = tss_df.groupby(['GestureType', 'ParticipantID', 'TrialID']).apply(lambda g: g.values)
            tss = pd.Series(to_time_series_dataset(tss_df.values).tolist(), index=tss_df.index)            
            tss = np.stack(tss.values)

            init_samples = to_time_series_dataset([list(zip(i['z1'], i['z2'])) for i in init])
            padded_init = np.full((init_samples.shape[0], tss.shape[1], tss.shape[2]), np.nan)

            padded_init[:, :init_samples.shape[1]] = init_samples


            kmeans = TimeSeriesKMeans(n_clusters=k, init=init_samples, metric="dtw", verbose=1)
            pred = kmeans.fit_predict(tss)
            pred_df = pd.DataFrame(pred, columns=['cls_asign'], index=tss_df.index).reset_index()

            json_data = kmeans._to_dict(output="json").copy()
            json_data['hyper_params']['init'] = init
            json_data['predictions'] = pred_df.to_dict(orient='records')
            json_data['timestamp'] = datetime.datetime.utcnow()
            json_data['hyper_params']['init_keys'] = init
            json_data['centroid_names'] = centroid_names

            oid = self.db['trained_cluster_models'].insert_one({'_id': uid, 'referent': referent, 'config': json_data})
            self.db['cluster_status'].update_one({'id': uid}, {'$set': {'status': "FINISHED", 'timestamp': datetime.datetime.utcnow()}})
        except Exception as err:
            self.db['cluster_status'].update_one({'id': uid}, {'$set': {'status': "ERROR", 'msg': str(err) , 'timestamp': datetime.datetime.utcnow()}})
            raise Exception(err)
        

    def new_config(self, name, model, data):
        model_file = self.filestore.save(model, name)
        data_file = self.filestore.save(data, name)
        try: 
            objId = self.db['config'].insert_one({'name': name, 'model': model_file, 'data': data_file})
            return json.dumps({'id': str(objId.inserted_id)})
        except PyMongoError as err:
            print(err)
            return json.dumps({'error': str(err.cause)})

    def list_config(self):
        try: 
            cursor = list(self.db['config'].find())

            for item in cursor:
                item['_id'] = str(item['_id'])
                
            return json.dumps(cursor)
        except PyMongoError as err:
            print(err)
            return json.dumps({'error': str(err)})

    def get_mean_d2b(self, referent, configID):
        doc = self.db['d2b'].find_one({'referent': referent, 'configID': configID})

        if not doc:
            data = self._active_dataset[self._active_dataset.index.get_level_values('GestureType').isin([referent])]
            
            with torch.no_grad():
                tensor = torch.tensor(data.values).float()
                mean, var = self.model.encode(tensor)

            latent = pd.DataFrame(mean.numpy(), index=data.index, dtype=np.double)
            latent = latent.groupby(['GestureType', 'ParticipantID', 'TrialID']).apply(lambda g: g.values)

            doc = self._find_barycenter(referent, configID)

            if doc:
                barycenter = np.array(doc['data'])
            else:
                barycenter = self._caluclate_barycenter(referent)

            values = list(map(lambda d: distance_fast(d, barycenter, window=25, psi=2), latent.values))
            # values = [d * 1.0 / len(best_path(paths)) for d, paths in values]
            
            doc = {
                'referent': referent,
                'configID': configID,
                'dist': values,
                'median': np.mean(values),
                'mean': np.mean(values),
                'var': np.var(values),
            }
            self.db['d2b'].insert_one(doc)

        doc['_id'] = str(doc['_id'])

        return json.dumps(doc)
    

    def get_nn(self, rid, z1, z2):
        data = self._active_dataset[
            self._active_dataset.index.get_level_values('GestureType').isin([rid])
        ]

        with torch.no_grad():
            tensor = torch.from_numpy(data.values).float()
            mean, var = self.model.encode(tensor)
        
        arr = np.stack([z1, z2]).transpose()
        latent = pd.DataFrame(mean.numpy(), index=data.index, dtype=np.double)
        latent = latent.groupby(['GestureType', 'ParticipantID', 'TrialID']).apply(lambda g: g.values)

        values = list(map(lambda d: distance_fast(d, arr), latent.values))
        res = pd.DataFrame(values, index=latent.index, columns=["DTW"])
        res['Index'] = list(range(res.shape[0]))
        res.set_index('Index', append=True, inplace=True)
        res = res.sort_values(by="DTW").reset_index()
        return res.to_json(orient='records', index=True)