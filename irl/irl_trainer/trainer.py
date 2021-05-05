import torch

class VAETrainer:
    def __init__(self):
        self.train_epoch_hooks = []
        self.train_epoch_pre_hooks = []

    def fit(self, model, optimizer, criterion, annealer, data_loader, epochs, start_epoch=1, validation_config=None, device='cpu'):
        loss_hist = []
        for epoch in range(start_epoch, epochs + 2):

            for pre_hook in self.train_epoch_pre_hooks:
                pre_hook(self, [epoch, model, optimizer, criterion, annealer, dataloader])

            loss = self.train_epoch(epoch, model, optimizer, criterion, annealer, data_loader, device)
            loss_hist.append(loss)

            for hook in self.train_epoch_hooks:
                hook(self, [epoch, model, optimizer, criterion, annealer, data_loader], [loss])

            if validation_config and (epoch - 1) % validation_config['freq'] == 0:
                self._validate(epoch, model, optimizer, criterion, annealer, validation_config)
        
        return {'model': model, 'optimizer': optimizer, 'loss_hist': loss_hist}
        
    def evaluate(self, model, data_loader, metrics):
        model.eval()
        with torch.no_grad():
            return dict( m(model, optimizer, data_loader) for m in metrics)

    def _validate(self, epoch, model, optimizer, criterion, annealer, config):
        model.eval()
        with torch.no_grad():
            validation_cb = config['callback']
            validation_cb(epoch, {'model': model, 
                                  'optimizer': optimizer,
                                  'criterion': criterion,
                                  'validation_data': config['validation_data']})

    def train_epoch(self, epoch, model, optimizer, criterion, annealer, data_loader, device):
        model.train()
        model.to(device=device)
        criterion.to(device=device)

        epoch_loss = 0
        no_samples = 0

        weight = 1.0

        if annealer:
            weight = annealer(epoch)

        for bid, batch in enumerate(data_loader):
            X = batch[0].to(device=device)
            no_samples += X.shape[0]

            optimizer.zero_grad()
            reconstructed, mean, logvar = model(X)
            rec_loss, kl_loss = criterion(reconstructed, X, mean, logvar, weight)
                
            loss = rec_loss + kl_loss
            epoch_loss += loss.item()
            
            loss.backward()
            optimizer.step()

        return epoch_loss / no_samples
    
    def register_train_epoch_hook(self, cb):
        hook = RemovableHook(cb, self.train_epoch_hooks)
        self.train_epoch_hooks.append(cb)
        return hook
        
    def register_train_epoch_pre_hook(self, cb):
        hook = RemovableHook(cb, self.train_epoch_pre_hooks)
        self.train_epoch_pre_hooks.append(cb)
        return hook


class RemovableHook:
    def __init__(self, cb, hooks):
        self.hooks = hooks
        self.cb = cb

    def unregister(self):
        self.hooks = list(filter(lambda h: h != self.cb, hooks))