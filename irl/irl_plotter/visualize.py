import torch
import numpy as np
import logging

from itertools import count
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D  # noqa: F401 unused import

from irl_plotter.interpolator import LinearInterpolator


class Visualizer:
    """This class defines methods to layout different graphs to visualize training progress.
    
    The logic to plot individual skeletons are implemented in separate plotter classes.
    """

    def __init__(self, plotter):
        self.plotter = plotter
        
    def get_random_samples(self, data, n_samples):
        N, feature_size = data.shape

        sample_indices = list(range(0, N, N // 50))[:n_samples]
        return data[sample_indices]

    def plot_reconstruction(self, state, data, nrows, ncols, device='cpu'):
        model = state['model']
        layout = (nrows, ncols)

        samples = self.get_random_samples(data, int(nrows * ncols * 0.5))

        fig = plt.figure()
        subplot_iterator = count(start=1)

        with torch.no_grad():
            model.eval()
            reconstruction, mean, logvar = model(torch.from_numpy(samples).double())

            for i in range(samples.shape[0]):
                orig_ax = fig.add_subplot(nrows, ncols, next(subplot_iterator), projection='3d')
                rec_ax = fig.add_subplot(nrows, ncols, next(subplot_iterator), projection='3d')

                self.plotter.plot(samples[i], orig_ax, color='b')
                self.plotter.plot(reconstruction[i], rec_ax, color='g')

        plt.tight_layout()
        return fig

    def plot_interpolation(self, state, data, nrows, ncols, device='cpu'):
        model = state['model']
        n_original_samples = nrows * 2
        n_interpolated_samples_per_row = ncols - 2

        samples = self.get_random_samples(data, n_original_samples)
        sample_iterator = count()
        subplot_iterator = count(start=1)

        fig = plt.figure()

        with torch.no_grad():
            model.eval()
            latent, logvar = model.encode(torch.from_numpy(samples).double())
            
            for row in range(nrows):
                start_sample_idx = next(sample_iterator)
                end_sample_idx = next(sample_iterator)
                encoded_pair = latent[[start_sample_idx, end_sample_idx]]

                interpolator = LinearInterpolator.create_from(encoded_pair[0], encoded_pair[1])
                interpolated_samples = interpolator.interpolate(n_interpolated_samples_per_row)
                reconstruction = model.decode(interpolated_samples)

                row_samples = np.vstack([samples[start_sample_idx], reconstruction, samples[end_sample_idx]])
                
                for rw in row_samples:
                    self.plotter.plot(rw, fig.add_subplot(nrows, ncols, next(subplot_iterator), projection='3d'))
        
        return fig

    def plot_embedding(self, state, data, device='cpu'):
        model = state['model']
        model.eval()

        samples = self.get_random_samples(data, 10)

        with torch.no_grad():
            model.eval()
            model.to(device=device)
            fig = plt.figure()

            latent, logvar = model.encode(torch.from_numpy(data).double())
            plt.scatter(latent[:, 0], latent[:, 1], s=1)
            plt.title('Latent Space')
            