import numpy as np

from typing import List, Dict
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D  # noqa: F401 unused import


class HandPlotter():
    """This class provides utility methdos to create the data matrix to plot a hand pose"""

    def __init__(self, skeleton: Dict[str, int] = None):
        """Initializes a new HandPlotter instance.

        Parameters
        ----------
        skeleton:
            A skeleton mapper. See :methods get_pose_matrix: for further details.
        """
        self.skeleton = skeleton or {
            'palm_center': 0,
            'thumb_metacarpal': 1,
            'thumb_proximal': 2,
            'thumb_middle': 3,
            'thumb_distal': 4,
            'index_metacarpal': 5,
            'index_proximal': 6,
            'index_middle': 7,
            'index_distal': 8,
            'middle_metacarpal': 9,
            'middle_proximal': 10,
            'middle_middle': 11,
            'middle_distal': 12,
            'ring_metacarpal': 13,
            'ring_proximal': 14,
            'ring_middle': 15,
            'ring_distal': 16,
            'pinky_metacarpal': 17,
            'pinky_proximal': 18,
            'pinky_middle': 19,
            'pinky_distal': 20,
        }

    def get_skeleton_paths(self, data: np.ndarray, skeleton: Dict[str, int] = None) -> List[np.ndarray]:
        """Computes a matrix that can be used to plot a whole body pose using any renderer.
        
        Parameters
        ----------
        data:
            A numpy array with shape [n_joints, 3] representing the 3 dimensional positions
            of the individual pose joints.
        skeleton:
            A dictionary mapping the position of various body pose joints in the data array.
            
            The default skeleton mapping is:
                palm_center: 0,
                thumb_metacarpal: 1,
                thumb_proximal: 2,
                thumb_middle: 3,
                thumb_distal: 4,
                index_metacarpal: 5,
                index_proximal: 6,
                index_middle: 7,
                index_distal: 8,
                middle_metacarpal: 9,
                middle_proximal: 10,
                middle_middle: 11,
                middle_distal: 12,
                ring_metacarpal: 13,
                ring_proximal: 14,
                ring_middle: 15,
                ring_distal: 16,
                pinky_metacarpal: 17,
                pinky_proximal: 18,
                pinky_middle: 19,
                pinky_distal: 20,
                
        Returns
        -------
            A list of arrays of shape [-1, 3] where each element in the array defines a separate
            line in the graph.
        """
        # Use the default skeleton mapping if not otherwise defined
        skeleton = skeleton or self.skeleton

        # initialize resulting path list
        paths = []

        # Path: palm -> thumb_metacarpal -> thumb_proximal -> thumb_middle -> thumb_distal
        paths.append(data[[
            skeleton['palm'], skeleton['thumb_metacarpal'], skeleton['thumb_proximal'], skeleton['thumb_middle'], skeleton['thumb_distal']
        ]])

        # Path: palm -> index_metacarpal -> index_proximal -> index_middle -> index_distal
        paths.append(data[[
            skeleton['palm'], skeleton['index_metacarpal'], skeleton['index_proximal'], skeleton['index_middle'], skeleton['index_distal']
        ]])

        # Path: palm -> middle_metacarpal -> middle_proximal -> middle_middle -> middle_distal
        paths.append(data[[
            skeleton['palm'], skeleton['middle_metacarpal'], skeleton['middle_proximal'], skeleton['middle_middle'], skeleton['middle_distal']
        ]])

        # Path: palm -> ring_metacarpal -> ring_proximal -> ring_middle -> ring_distal
        paths.append(data[[
            skeleton['palm'], skeleton['ring_metacarpal'], skeleton['ring_proximal'], skeleton['ring_middle'], skeleton['ring_distal']
        ]])

        # Path: palm -> pinky_metacarpal -> pinky_proximal -> ankle_right -> foot_right
        paths.append(data[[
            skeleton['palm'], skeleton['pinky_metacarpal'], skeleton['pinky_proximal'], skeleton['pinky_middle'], skeleton['pinky_distal']
        ]])

        return paths

    def plot(self, skeleton_data: np.ndarray, ax: plt.Axes, **kwargs) -> None:
        """Plots the skeleton data to a canvas.
        
        Parameters
        ----------
        skeleton_data:
            A numpy array representing the individual skeleton joints.
        ax:
            A matplotlib Axis to plot the data against.
        """

        skeleton_data = skeleton_data.reshape(-1, 3)
        palm = skeleton_data[self.skeleton['palm']]
        ax.scatter(palm[0], palm[1], palm[2], c="g", s=3)

        for p in self.get_skeleton_paths(skeleton_data):
            c = kwargs.get('color', 'b')
            ax.plot(xs=p[:, 0], ys=p[:, 1], zs=p[:, 2], c=c)

        ax.view_init(azim=-90.0, elev=-90.0)
        ax.set_xlim(0.0, 1.0)
        ax.set_ylim(0.0, 1.0)
        ax.set_zlim(0.0, 1.0)
        ax.axis('off')
        ax.grid(b=None)