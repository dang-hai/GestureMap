from pathlib import Path
from setuptools import setup, find_packages

requirements = Path('requirements.txt').read_text().split('\n')

setup(
    name="irl",
    version="0.4",
    description="This library defines different functionalities to interact with latent space representations.",
    packages=[
        "irl_model",
        "irl_plotter",
        "irl_plotter.skeleton_plotter",
        "irl_data",
        "irl_trainer",
        "cli"
    ],
    scripts=[
        "cli/train_vae.py"
    ],
    install_requires=requirements
)