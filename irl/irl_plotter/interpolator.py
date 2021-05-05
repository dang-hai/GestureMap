import torch

class LinearInterpolator:
    def __init__(self, vector, norm, p1, p2):
        self.vector = vector
        self.norm = norm
        self.p1 = p1
        self.p2 = p2

    @staticmethod
    def create_from(p1, p2):
        line_vector = (p2 - p1)
        norm = torch.norm(line_vector)
        return LinearInterpolator(line_vector, norm, p1, p2)

    def interpolate(self, n_interploations):
        steps = torch.linspace(0, self.norm, steps=n_interploations)
        return torch.stack([self.p1 + (self.vector / self.norm) * s for s in steps])
