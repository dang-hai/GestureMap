import pandas as pd
import numpy as np
import sys
import matplotlib.pyplot as plt
import mpl_toolkits.mplot3d.axes3d as p3
import matplotlib.animation as animation
from irl_plotter import WholeBodyPlotter

def update_animation(num, skeletons, plots):
    for path, plot in zip(skeletons[num], plots):
        plot.set_data(path.transpose()[[0, 2], :])
        plot.set_3d_properties(path[:, 1])
    return plots

# Attaching 3D axis to the figure
fig = plt.figure()
ax = p3.Axes3D(fig)

plotter = WholeBodyPlotter(skeleton=dict(
            head=3, shoulder_center=2, spine=1, hip_center=0, 
            shoulder_left=4, elbow_left=5, wrist_left=6, hand_left=7,
            shoulder_right=8, elbow_right=9, wrist_right=10, hand_right=11,
            hip_left=12, knee_left=13, ankle_left=14, foot_left=15,
            hip_right=16, knee_right=17, ankle_right=18, foot_right=19
        ))


data = pd.read_csv(sys.argv[1], index_col=['GestureType', 'ParticipantID', 'TrialID', 'Timestamp', 'NumJoints'])
skeletons = [plotter.get_skeleton_paths(dat.reshape(20, 3)) for dat in data.values]
plots = [ax.plot(p[:, 0], p[:, 2], p[:, 1], 'b-o', markersize=10, linewidth=3)[0] for i, p in enumerate(skeletons[0])]

# Setting the axes properties
ax.set_xlabel('X')
ax.set_ylabel('Y')
ax.set_zlabel('Z')

ax.set_xlim((-1, 1))
ax.set_ylim((-1, 1))
ax.set_title('3D Test')

# Creating the Animation object
play_sequence = animation.FuncAnimation(fig, update_animation, len(skeletons) - 1, fargs=(skeletons, plots),
                                   interval=40, blit=False)

plt.show()