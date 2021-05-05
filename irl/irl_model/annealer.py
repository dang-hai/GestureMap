import torch
import math

class MonotonicAnnealer(torch.nn.Module):
    def __init__(self, warmup_duration, cold_duration=0):
        super(MonotonicAnnealer, self).__init__()
        self.warmup_duration = warmup_duration
        self.cold_duration = cold_duration

    def forward(self, epoch):
        if epoch - 1 < self.cold_duration:
            return 0.0
        elif epoch - 1 < self.cold_duration + self.warmup_duration:
            return (epoch - self.cold_duration - 1) / self.warmup_duration
        else:
            return 1.0

class CyclicalAnnealer(torch.nn.Module):
    def __init__(self, total_iterations, num_cycles=4, annealing_fraction_per_cycle=0.5, beta=0.1):
        super(CyclicalAnnealer, self).__init__()
        self.total_iterations = total_iterations
        self.num_cycles = num_cycles
        self.annealing_fraction_per_cycle = annealing_fraction_per_cycle
        self.beta = beta

    def forward(self, epoch):
        cycle_duration = math.ceil(self.total_iterations / self.num_cycles)
        annealing_duration = cycle_duration * self.annealing_fraction_per_cycle

        cycle_epoch = (epoch - 1) % cycle_duration

        return min(1, self.beta + cycle_epoch / annealing_duration)