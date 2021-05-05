#!/usr/bin/env python

import warnings
import torch
import click
import sys

from irl_data import LeapHandData, STBDataset, WholeBodyDataset
from irl_plotter import Visualizer, HandPlotter, WholeBodyPlotter
from irl_trainer.trainer import VAETrainer
from irl_model.model import VAEFully512R4
from irl_model.loss import VAELoss
from irl_model.annealer import MonotonicAnnealer, CyclicalAnnealer

from pathlib import Path
import numpy as np
import pandas as pd

import matplotlib.pyplot as plt

@click.command()
@click.option(
    '-n', '--experiment_name', type=str
)
@click.option(
    '--epochs', type=int, default=5000
)
@click.option(
    '--dataset_type', type=click.Choice(['stb', 'wholebody']), 
)
@click.option(
    '--data', type=click.Path(exists=True)
)
@click.option(
    '--annealing', type=str, default=None
)
@click.option(
    '--lr', type=float, default=1e-4
)
@click.option(
    '--batch_size', type=int, default=128
)
@click.option(
    '--base_path', type=str, default=Path.home() / 'var/'
)
@click.option(
    '--zdim', type=int, help='The dimension of the latent dimension', default=2
)
@click.option(
    '--device', type=click.Choice(['cpu', 'cuda']), default='cpu'
)
@click.option(
    '--validation_freq', type=int, default=10
)
@click.option(
    '--cold_duration', type=int, default=None
)
@click.option(
    '--warmup', type=int, default=None
)
@click.option(
    '--cycles', type=int, default=4
)
@click.option(
    '--annealing_fraction_per_cycle', type=float, default=0.5
)
def run(**kwargs):
    # Define base paths
    kwargs['datetime'] = pd.Timestamp.now().strftime(format='%Y%m%d-%H%M%S')
    experiment = kwargs['experiment_name']
    base_path = Path(kwargs['base_path'])

    experiment_path = base_path / experiment

    if kwargs['device'] == 'cpu' and torch.cuda.is_available():
        click.echo(f'Cuda device available, but running on cpu! Consider passing the --device cuda option')

    if experiment_path.exists() and \
        not click.prompt("""The experiment path already exists!\n"""
                         f"""Are you sure you want to overwrite {experiment_path}?""", type=bool, show_choices=True):
            click.echo('Program cancelled.')
            sys.exit(0)
    else:
        experiment_path.mkdir(exist_ok=True)
    
    # Read in dataset files
    if kwargs['dataset_type'] == 'stb':
        dataset = STBDataset(kwargs['data'])
        data_values = dataset.load().values
        plotter = HandPlotter(skeleton=dict(
            palm=0,
            thumb_metacarpal=1, thumb_proximal=2, thumb_middle=3, thumb_distal=4,
            index_metacarpal=5, index_proximal=6, index_middle=7, index_distal=8,
            middle_metacarpal=9, middle_proximal=10, middle_middle=11, middle_distal=12,
            ring_metacarpal=13, ring_proximal=14, ring_middle=15, ring_distal=16,
            pinky_metacarpal=17, pinky_proximal=18, pinky_middle=19, pinky_distal=20
        ))
    elif kwargs['dataset_type'] == 'wholebody':
        dataset = WholeBodyDataset(kwargs['data'])
        data_values = dataset.load().values
        plotter = WholeBodyPlotter(skeleton=dict(
            head=3, shoulder_center=2, spine=1, hip_center=0, 
            shoulder_left=4, elbow_left=5, wrist_left=6, hand_left=7,
            shoulder_right=8, elbow_right=9, wrist_right=10, hand_right=11,
            hip_left=12, knee_left=13, ankle_left=14, foot_left=15,
            hip_right=16, knee_right=17, ankle_right=18, foot_right=19
        ))
    else:
        raise Exception(f"Unkown dataset {kwargs['dataset_type']} - {kwargs['data']}")

    N_samples, inp_dim = data_values.shape

    kwargs['num_samples'] = data_values.shape[0]

    dataset = torch.utils.data.TensorDataset(torch.from_numpy(data_values).double())
    data_loader = torch.utils.data.DataLoader(dataset, shuffle=True, batch_size=kwargs['batch_size'])

    model = VAEFully512R4(inp_dim=inp_dim, z_dim=kwargs['zdim']).double()
    optimizer = torch.optim.Adam(model.parameters(), lr=kwargs['lr'])

    pd.DataFrame([kwargs]).to_csv(experiment_path / 'experiment_info.csv')

    click.echo(f"Number of samples: {N_samples}")
    click.echo(model)

    batch_loss_hist = []
    criterion = VAELoss()
    criterion.register_forward_hook(collect_batch_loss_hist(batch_loss_hist))

    if kwargs['annealing'] == 'monotonic':
        annealer = MonotonicAnnealer(cold_duration=kwargs['cold_duration'], warmup_duration=kwargs['warmup'])
    elif kwargs['annealing'] == 'cyclical':
        annealer = CyclicalAnnealer(total_iterations=kwargs['epochs'], num_cycles=kwargs['cycles'], annealing_fraction_per_cycle=kwargs['annealing_fraction_per_cycle'])
    else:
        click.echo(f'No or unknown annealer specified')
        annealer = None

    # Config validation procedure
    batches_per_epoch = np.ceil(N_samples / kwargs['batch_size'])

    val_config = dict()
    val_config['freq'] = kwargs['validation_freq']
    val_config['validation_data'] = data_loader
    val_config['callback'] = validation_callback(
                                visualizer=Visualizer(plotter),
                                experiment_path=experiment_path,
                                batch_loss_hist=batch_loss_hist,
                                batches_per_epoch=batches_per_epoch,
                                num_samples=kwargs['num_samples'])

    trainer = VAETrainer()
    trainer.register_train_epoch_hook(lambda trainer, inp, out: print(f'\rEpoch {inp[0]}: {out[0]:.8f}', end=None))
    trainer.fit(model=model, optimizer=optimizer, criterion=criterion,
                annealer=annealer, data_loader=data_loader, epochs=kwargs['epochs'], validation_config=val_config,
                device=kwargs['device'])


def collect_batch_loss_hist(hist):
    def on_forward_called(module, inp, out):
        hist.append([item.item() for item in out])
        hist[-1].append(inp[-1])
    return on_forward_called


def validation_callback(visualizer, experiment_path, batch_loss_hist, batches_per_epoch, num_samples):
    def reduce_group(group):
        losses = group[['REC_LOSS', 'KL_LOSS']].sum() / num_samples
        losses['WEIGHT'] = group['WEIGHT'].median()
        return losses

    def validate(epoch, state):
        if epoch <= 1:
            return

        df = pd.DataFrame(batch_loss_hist, columns=['REC_LOSS', 'KL_LOSS', 'WEIGHT'])
        df.reset_index(inplace=True)
        df['index'] = df['index'] // batches_per_epoch
        df = df.groupby(['index', 'WEIGHT']).apply(reduce_group)

        axes = df.plot(subplots=True, logy=True)
        axes[-1].set_yscale('linear')
        plt.savefig(experiment_path / 'loss.png')
        plt.close()

        df.to_csv(experiment_path / 'loss.csv', mode='w')

        data_values = state['validation_data'].dataset.tensors[0].numpy()
        fig1 = visualizer.plot_embedding(state, data=data_values)
        plt.savefig(experiment_path / f'embedding_{epoch:04d}.png')
        plt.close()

        fig2 = visualizer.plot_interpolation(state, nrows=10, ncols=10, data=data_values)
        plt.savefig(experiment_path / f'interpolation_{epoch:04d}.png')
        plt.close()

        fig3 = visualizer.plot_reconstruction(state, nrows=10, ncols=10, data=data_values)
        plt.savefig(experiment_path / f'reconstruction_{epoch:04d}.png')
        plt.close()

        ckpt = dict()
        ckpt['model_state_dict'] = state['model'].state_dict()
        ckpt['optimizer_state_dict'] = state['optimizer'].state_dict()
        ckpt['epoch'] = epoch
        torch.save(ckpt, experiment_path / f'checkpoint_{epoch:04d}.pth')
    
    return validate


if __name__ == "__main__":
    run()
        