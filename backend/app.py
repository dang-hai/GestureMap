"""
This module handles the routing of different request to the
appropiate controller methods.
"""
import os
import threading
from functools import wraps
from pathlib import Path
from uuid import uuid4
from typing import List

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_uploads import UploadSet, configure_uploads

import click
import numpy as np

from controller import Controller


class ValidationError(Exception):
    def __init__(self, missing_field=None):
        super().__init__()
        self.missing_field = missing_field

    @property
    def message(self):
        return f"""The following field is required, but missing in
            the request: {self.missing_field}.
            """

def validate_request_field(field_name, required=True, field_type=str):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kw):
            try:
                json = request.json
                if required and field_name not in json:
                    raise ValidationError(field_name)
                data = kw.get('data', dict())

                field_val = json.get(field_name, None)

                data[field_name] = field_val
                kw['data'] = data

            except ValidationError as err:
                return jsonify({"error": err.message}), 400
            return f(*args, **kw)
        return wrapper
    return decorator

UPLOAD_FOLDER = Path.cwd() / 'uploads'

@click.command()
@click.option(
    '--debug', is_flag=True, default=False
)
def cli(**kwargs):
    app = create_app(**kwargs)
    app.run('0.0.0.0', 5000, debug=kwargs['debug'])

def create_gunicorn_app():
    return create_app()

def create_app(**kwargs):
    """Initializes the application backend with user provided arguments."""
    app = Flask(__name__)
    app.config['UPLOADED_FILES_DEST'] = UPLOAD_FOLDER
    uploads_set = UploadSet('files', {'pth', 'h5', 'csv'})
    configure_uploads(app, (uploads_set,))
    CORS(app)

    controller = Controller(filestore=uploads_set, upload_dir=UPLOAD_FOLDER)

    ############################# App Config Data ###############################

    @app.route('/api/config/new', methods=["POST"])
    def new_config():
        name = request.form['name']
        return controller.new_config(name, request.files['model_file'], request.files['data_file'])

    @app.route('/api/config/list', methods=["GET"])
    def list_config():
        return controller.list_config()

    @app.route('/api/init', methods=["POST"])
    @validate_request_field('id', required=True, field_type=str)
    def init_app(data):
        controller.init_app(data['id'])
        return jsonify({'msg': 'success', 'data': data})
    
    ######################### Skeleton Data #####################################

    @app.route('/api/data/skeleton_grid/', methods=["POST"])
    @validate_request_field('xrange', required=True, field_type=list)
    @validate_request_field('yrange', required=True, field_type=list)
    def skeleton_grid(data):
        return controller.calculate_skeleton_grid(data['xrange'], data['yrange'])

    @app.route('/api/data/decode/', methods=["POST"])
    @validate_request_field('latent_code', required=True, field_type=np.ndarray)
    def decode(data):
        latent_code = np.array(data['latent_code'])
        return controller.calculate_reconstruction(latent_code)

    @app.route('/api/data/skeleton/', methods=["POST"])
    @validate_request_field('index', required=False, field_type=int)
    def original_skeleton(data):
        return controller.get_skeleton(data['index'])

    ######################### Dataset Info #####################################

    @app.route('/api/data/trials/values', methods=["POST"])
    @validate_request_field('gesture_type', required=True, field_type=List[str])
    def trials_values(data):
        return controller.get_latent_trial_values(data['gesture_type'])

    @app.route('/api/data/referents', methods=["GET"])
    def get_referents():
        return controller.get_referents()


    ############################# Bary Center Data ###############################

    @app.route('/api/data/barycenters', methods=["POST"])
    @validate_request_field('gesture_type', required=True, field_type=List[str])
    @validate_request_field('configID', required=True, field_type=str)
    def barycenters(data):
        return controller.get_barycenters(data['gesture_type'], data['configID'])

    @app.route('/api/data/barycenter_reconstruction', methods=["POST"])
    @validate_request_field('referent', required=True, field_type=str)
    @validate_request_field('configID', required=True, field_type=str)
    def get_barycenter_reconstruction(data):
        barycenter = controller.get_barycenter_reconstruction(data['referent'], data['configID'])
        return barycenter
    
    ############################# Clustering Data ###############################

    @app.route('/api/cluster/trigger/rid', methods=["POST"])
    @validate_request_field('rid', required=True, field_type=str)
    @validate_request_field('k', required=True, field_type=int)
    @validate_request_field('init', required=True, field_type=List[List[int]])
    @validate_request_field('centroid_names', required=True, field_type=str)
    def trigger_clustering(data):
        uid = uuid4()
        th = threading.Thread(
            target=controller.run_clustering,
            args=(str(uid), data['rid'], data['k'], data['init'], data['centroid_names']))
        th.start()
        return jsonify(status_link=f'/status/cluster/id/{uid}')

    @app.route('/api/status/cluster/id/<uuid:uuid>')
    def get_cluster_status(uuid):
        return controller.get_cluster_status(uuid)

    @app.route('/api/cluster/id/<uuid:uuid>')
    def get_cluster(uuid):
        return controller.get_cluster(uuid)
    
    @app.route('/api/cluster/list', methods=["POST"])
    @validate_request_field('referent', required=True, field_type=str)
    def list_cluster(data):
        return controller.list_clusters(data['referent'])
    
    @app.route('/api/cluster/config/update', methods=["POST"])
    @validate_request_field('K', required=True, field_type=int)
    @validate_request_field('uid', required=True, field_type=str)
    @validate_request_field('centroids', required=True, field_type=str)
    @validate_request_field('centroid_names', required=True, field_type=str)
    @validate_request_field('predictions', required=True, field_type=str)
    def update_config(data):
        return controller.update_config(data)

    @app.route('/api/data/raw/gesture', methods=["POST"])
    @validate_request_field('rid', required=True, field_type=str)
    @validate_request_field('pid', required=True, field_type=int)
    @validate_request_field('tid', required=True, field_type=int)
    def get_gesture(data):
        return controller.get_raw_gesture(data['rid'], data['pid'], data['tid'])


    ############################# Metric Info ###############################

    @app.route('/api/data/d2b', methods=["POST"])
    @validate_request_field('referent', required=True, field_type=str)
    @validate_request_field('configID', required=True, field_type=str)
    def get_d2b(data):
        return controller.get_mean_d2b(data['referent'], data['configID'])

    @app.route('/api/nn', methods=["POST"])
    @validate_request_field('z1', required=True, field_type=List[float])
    @validate_request_field('z2', required=True, field_type=List[float])
    @validate_request_field('GestureType', required=True, field_type=str)
    def get_nn(data):
        return controller.get_nn(data['GestureType'], data['z1'], data['z2'])

    return app

if __name__ == "__main__":
    cli()
