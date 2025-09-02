import numpy as np
import torch
from tqdm import tqdm

def ode_single_step(scheduler, vec_J_xt, vec_J_z, dL_dxt, dL_dzt, s, t):
    """
    Assumes eps prediction
    """
    lambda_t, lambda_s = scheduler.lambda_t[t], scheduler.lambda_t[s]
    alpha_t, alpha_s = scheduler.alpha_t[t], scheduler.alpha_t[s]
    sigma_t, sigma_s = scheduler.sigma_t[t], scheduler.sigma_t[s]

    h = lambda_s - lambda_t

    dL_dxt = (alpha_t / alpha_s) * dL_dxt + (alpha_t**2 / alpha_s**2) * sigma_s * torch.expm1(h) * vec_J_xt

    dL_dzt = dL_dzt + (alpha_t/alpha_s) * sigma_s * torch.expm1(h) * vec_J_z

    return dL_dxt, dL_dzt

def sde_single_step(scheduler, vec_J_xt, vec_J_z, dL_dxt, dL_dzt, s, t):
    """
    Assumes eps prediction
    """

    lambda_t, lambda_s = scheduler.lambda_t[t], scheduler.lambda_t[s]
    alpha_t, alpha_s = scheduler.alpha_t[t], scheduler.alpha_t[s]
    sigma_t, sigma_s = scheduler.sigma_t[t], scheduler.sigma_t[s]

    h = lambda_s - lambda_t

    dL_dxt = (alpha_t / alpha_s) * dL_dxt + 2 * (alpha_t**2 / alpha_s**2) * sigma_s * torch.expm1(h) * vec_J_xt

    dL_dzt = dL_dzt + 2 * (alpha_t/alpha_s) * sigma_s * torch.expm1(h) * vec_J_z

    return dL_dxt, dL_dzt


def adjointDEIS(model, scheduler, xT, z, loss_fn, ws=None, is_sde=False, n_opt_steps=50, lr=1e-2, noise_level=1.0, seed=None, device=None):
    """
    Uses cached solution trajectory (much better than backwards solve) see https://arxiv.org/pdf/2405.15020 Appendix F.1

    Parameters
    ----------
    model : nn.Module
        The core diffusion model which performs noise prediction. Backbone could be a UNet/ViT.
        Model is assumed to take three arguments:

        t : Tensor
            Current timestep, has shape (b,)

        x : Tensor
            Current sample, has shape (b, 3, h, w)

        z : Tensor
            Conditional information, has shape (b, d)
                
    scheduler : class
        Scheduler, expected to be the DPM Solver `https://huggingface.co/docs/diffusers/api/schedulers/multistep_dpm_solver`

    xT : Tensor
        Initial noise, has shape (b, 3, h, w)

    z : Tensor
        Initial conditional information, has shape (b, d)

    loss_fn : function
        Loss function with signature `f: R^(b x 3 x h x w) -> R`

    ws : dict[Tensor], optional
        List of encoded noises with cycle sde

    is_sde : bool, optional
        Use sde solver or not

    n_opt_steps : int, optional
        Number of optimization steps, default is 50

    lr : float, optional
        Learning rate, default is 1e-2

    noise_level : float, optional
        What timestep to start sampling from, default = 1.0

    seed : int, optional
        Random seed.

    device :
        Device for inference, by default it assumes the device of `model`

    Returns
    -------
    x0 : Tensor
        Optimized image
    """
    device = device if device is not None else model.device

    b = xT.shape[0]

    timesteps = scheduler.timesteps

    if noise_level < 1.0:
        timesteps = timesteps[int((1. - noise_level) * len(timesteps)):]

    if is_sde:
        assert ws is not None

    for n in tqdm(range(n_opt_steps)):
        xs = []
        xt = xT

        scheduler.reset_sampler()

        # forward pass
        with torch.no_grad():
            for i, t in enumerate(tqdm(timesteps, desc='Forward pass...', total=len(timesteps))):
                t_batch = torch.ones(b, device=device) * t
                xs.append(xt)

                model_out = model.ema_model.forward(x=xt, t=t_batch, cond=z_cond).pred

                noise = None
                if is_sde:
                    noise =  ws[int(t)]

                xt = scheduler.step(model_out, t, xt, noise=noise)

        # Peform backprop
        if n < n_opt_steps - 1:
            z.requires_grad_(True)
            xt.requires_grad_(True)
            loss = loss_fn(xt)
            dL_dxt = torch.autograd.grad(loss.mean(), xt)[0]
            dL_dzt = torch.zeros_like(z)

            print(f'Loss at step {n:02d} is {loss.mean().item():.2f}')

            for i in tqdm(range(len(timesteps)-1, 0, -1), desc='Backwards pass...', total=len(timesteps)-1):
                t_curr = torch.ones(b, device=device) * timesteps[i]

                xt = xs.pop()

                xt = xt.clone().requires_grad_(True)

                model_out = model(t, x, z)

                # Solve using DDIM update equations
                vec_J_xt = torch.autograd.grad(model_out, xt, dL_dxt, retain_graph=True)[0]
                vec_J_z = torch.autograd.grad(model_out, z dL_dxt)[0]

                # Call step function
                if not is_sde:
                    dL_dxt, dL_dzt = ode_single_step(scheduler, vec_J_xt, vec_J_z, dL_dxt, dL_dzt, timesteps[i-1], timesteps[i])
                else:
                    dL_dxt, dL_dzt = sde_single_step(scheduler, vec_J_xt, vec_J_z, dL_dxt, dL_dzt, timesteps[i-1], timesteps[i])

            # Gradient descent
            xT = xT - lr * dL_dxt
            z = z - lr * dL_dzt

    return xt


def encode_cycle_sde(model, scheduler, x0, z, noise_level=1.0, generator=None, device=None):
    """
    Assumes eps prediction.

    CycleDiffusion: https://arxiv.org/pdf/2210.05559

    Parameters
    ----------
    model : nn.Module
        The core diffusion model which performs noise prediction. Backbone could be a UNet/ViT.
        Model is assumed to take three arguments:

        t : Tensor
            Current timestep, has shape (b,)

        x : Tensor
            Current sample, has shape (b, 3, h, w)

        z : Tensor
            Conditional information, has shape (b, d)
                
    scheduler : class
        Scheduler, expected to be the DPM Solver `https://huggingface.co/docs/diffusers/api/schedulers/multistep_dpm_solver`

    x0 : Tensor
        Initial image, has shape (b, 3, h, w)

    z : Tensor
        Initial conditional information, has shape (b, d)

    noise_level : float, optional
        What timestep to encode to, default = 1.0

    generator :
        The generator for random values

    device :
        Device for inference, by default it assumes the device of `model`

    Returns
    -------
    xT : Tensor
        Encoded noisy image

    ws : dict[Tensor]
        Encoded noises for CycleDiffusion

    """
    device = device if device is not None else model.device

    b = x0.shape[0]

    timesteps = scheduler.timesteps

    if noise_level < 1.0:
        timesteps = timesteps[int((1. - noise_level) * len(timesteps)):]

    ws = dict()
    x_t = x0

    with torch.no_grad():
        for i in tqdm(range(len(timesteps), 0, -1), desc='Encoding SDE...', total=len(timesteps)-1):
            if i == len(timesteps):
                t, s = 0, timesteps[i-1]
            else:
                t, s = timesteps[i], timesteps[i-1]

            s_batch = torch.ones(b, device=device, dtype=torch.long) * int(s)

            lambda_t, lambda_s = scheduler.lambda_t[t], scheduler.lambda_t[s]
            alpha_t, alpha_s = scheduler.alpha_t[t], scheduler.alpha_t[s]
            sigma_t, sigma_s = scheduler.sigma_t[t], scheduler.sigma_t[s]

            h = lambda_t - lambda_s

            noise = torch.randn_like(x_t)
            x_s = scheduler.add_noise(x0, noise, s_batch)

            model_out = model(s_batch, x_s, z)
            w_s = (x_t - ((alpha_t/alpha_s) * x_s - 2 * sigma_t * (torch.exp(h) - 1.) * model_out)) / (sigma_t * torch.sqrt(torch.exp(2*h) - 1.))

            # Awful hacky fix, change later
            ws[int(s)] = w_s

            x_t = x_s

        xT = x_t

    return xT, ws
