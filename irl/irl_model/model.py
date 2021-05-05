import torch

class VAEFully512R4(torch.nn.Module):
    def __init__(self, inp_dim, z_dim):
        super(VAEFully512R4, self).__init__()
        self.z_dim = z_dim
        self.encoder = self.init_encoder(no_layers=4, inp_size=inp_dim, out_size=self.z_dim)
        self.decoder = self.init_decoder(no_layers=4, inp_size=self.z_dim, out_size=inp_dim)

    def init_encoder(self, no_layers, inp_size, out_size):
        module_list = torch.nn.ModuleList()

        module_list.append(torch.nn.Linear(inp_size, 512))
        module_list.append(torch.nn.ReLU())

        for i in range(no_layers):
            module_list.append(torch.nn.Linear(512, 512))
            module_list.append(torch.nn.ReLU())
        
        module_list.append(torch.nn.Linear(512, 2 * out_size))

        return module_list
        
    def init_decoder(self, no_layers, inp_size, out_size):
        module_list = torch.nn.ModuleList()

        module_list.append(torch.nn.Linear(inp_size, 512))
        module_list.append(torch.nn.ReLU())
        
        for i in range(no_layers):
            module_list.append(torch.nn.Linear(512, 512))
            module_list.append(torch.nn.ReLU())
        
        module_list.append(torch.nn.Linear(512, out_size))

        return module_list
    
    def reparameterize(self, mean, logvar):
        std = (0.5 * logvar).exp()
        eps = torch.rand_like(std)
        return mean + eps * std
    
    def encode(self, x):
        hidden = x
        for module in self.encoder:
            hidden = module(hidden)

        mean = hidden[:, :self.z_dim]
        logvar = hidden[:, self.z_dim:]
        return mean, logvar

    def decode(self, z):
        hidden = z
        for module in self.decoder:
            hidden = module(hidden)

        # if not self.training:
        #     return torch.sigmoid(hidden)

        return hidden

    def forward(self, x):
        mean, logvar = self.encode(x)

        if self.training:
            z = self.reparameterize(mean, logvar)
        else:
            z = mean

        return self.decode(z), mean, logvar
