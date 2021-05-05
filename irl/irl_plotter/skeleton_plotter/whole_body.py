import numpy as np

from typing import List, Dict

import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D  # noqa: F401 unused import


class WholeBodyPlotter():
    """This class provides utility methdos to create the data matrix to plot a whole body gesture."""

    def __init__(self, skeleton: Dict[str, int]):
        """Initializes a new WholeBodyPlotter instance.

        Parameters
        ----------
        skeleton:
            A skeleton mapper. See :methods get_pose_matrix: for further details.
        """
        self.skeleton = skeleton or {
            'head': 0,
            'should_center': 1,
            'shoulder_left': 2,
            'elbow_left': 3,
            'wrist_left': 4,
            'hand_left': 5,
            'shoulder_right': 6,
            'elbow_right': 7,
            'wrist_right': 8,
            'hand_right': 9,
            'spine': 10,
            'hip_center': 11,
            'hip_left': 12,
            'knee_left': 13,
            'ankle_left': 14,
            'foot_left': 15,
            'hip_right': 16,
            'knee_right': 17,
            'ankle_right': 18,
            'foot_right': 19,
        }

    def get_skeleton_paths(self, data: np.ndarray, skeleton: Dict[str, int] = None) -> List[np.ndarray]:
        """Computes a matrix that can be used to plot a whole body pose using any renderer.
        
        Parameters
        ----------
        data:
            A numpy array with shape [n_joints, 3] representing the 3 dimensional positions
            of the individual pose joints.
        skeleton:
            A dictionary mapping the position of various body pose 3D joints in the data array.
            This mapper depends on how the columns of the initial data array are layed out.
            
            The default skeleton mapping is:
            
                head: 0

                shoulder_center: 1
                shoulder_left: 2
                elbow_left: 3
                wrist_left: 4
                hand_left: 5

                shoulder_right: 6
                elbow_right: 7
                wrist_right: 8
                hand_right: 9

                spine: 10
                hip_center: 11

                hip_left: 12
                knee_left: 13
                ankle_left: 14
                foot_left: 15

                hip_right: 16
                knee_right: 17
                ankle_right: 18
                foot_right: 19
                
        Returns
        -------
        :returns:
            A list of arrays of shape [-1, 3] where each element in the array defines a separate
            line in the graph.
        """
        # Use the default skeleton mapping if not otherwise defined
        skeleton = skeleton or self.skeleton

        # initialize resulting path list
        paths = []

        # Path: head -> shoulder_center -> spine -> hip_center
        paths.append(data[[
            skeleton['head'], skeleton['shoulder_center'], skeleton['spine'], skeleton['hip_center']
        ]])

        # Path: shoulder_center -> shoulder_left -> elbow_left -> wrist_left -> hand_left
        paths.append(data[[
            skeleton['shoulder_center'], skeleton['shoulder_left'], skeleton['elbow_left'], skeleton['wrist_left'], skeleton['hand_left']
        ]])

        # Path: shoulder_center -> shoulder_right -> elbow_right -> wrist_right -> hand_right
        paths.append(data[[
            skeleton['shoulder_center'], skeleton['shoulder_right'], skeleton['elbow_right'], skeleton['wrist_right'], skeleton['hand_right']
        ]])

        # Path: hip_center -> hip_left -> knee_left -> ankle_left -> foot_left
        paths.append(data[[
            skeleton['hip_center'], skeleton['hip_left'], skeleton['knee_left'], skeleton['ankle_left'], skeleton['foot_left']
        ]])

        # Path: hip_center -> hip_right -> knee_right -> ankle_right -> foot_right
        paths.append(data[[
            skeleton['hip_center'], skeleton['hip_right'], skeleton['knee_right'], skeleton['ankle_right'], skeleton['foot_right']
        ]])

        return paths

    def plot(self, skeleton_data: np.ndarray, ax: plt.Axes, *args, **kwargs) -> None:
        """Plots the skeleton data to a canvas.

        Parameters
        ----------
        skeleton_data:
            A numpy array representing the individual skeleton joints.
        ax:
            A matplotlib Axis to plot the data against.
        """

        skeleton_data = skeleton_data.reshape(-1, 3)
        skeleton_paths = self.get_skeleton_paths(data=skeleton_data)

        for p in skeleton_paths:
            ax.scatter(xs=p[:, 0], ys=p[:, 1], zs=p[:, 2], s=2, *args, **kwargs)
            ax.plot(xs=p[:, 0], ys=p[:, 1], zs=p[:, 2], *args, **kwargs)

        ax.view_init(azim=-90.0, elev=-90.0)
        ax.axis('off')
