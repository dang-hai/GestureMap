import logging

import torch

class VAELoss(torch.nn.Module):
    def __init__(self):
        super(VAELoss, self).__init__()
        self.rec_criterion = torch.nn.MSELoss(reduction='sum')
    
    def forward(self, inp, target, mean, logvar, weight=None):
        rec_loss = self.rec_criterion(inp, target)
        kl_loss = -0.5 * (1 + logvar - mean.pow(2) - logvar.exp()).sum()
        if weight is not None:
            kl_loss = weight * kl_loss
        return rec_loss, kl_loss
