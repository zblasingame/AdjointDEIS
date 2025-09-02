<div align="center">
<h1> AdjointDEIS (NeurIPS 2024) </h1>
<h3> AdjointDEIS: Efficient Gradients for Diffusion Models </h3>

[Zander W. Blasingame](https://zblasingame.github.io/) &emsp; <b>&middot;</b> &emsp; [Chen Liu](https://camel.clarkson.edu/members.html)

Clarkson University

[![arXiv](https://img.shields.io/badge/arXiv-b31b1b?style=for-the-badge&logo=arxiv)](https://arxiv.org/abs/2405.15020)
[![Webpage](https://img.shields.io/badge/Webpage-222222?style=for-the-badge&logo=githubpages)](https://zblasingame.github.io/AdjointDEIS/)
</div>

## Introduction
**Update. The use of the adjoint method is generally discouraged see ([Kidger](https://arxiv.org/pdf/2202.02435) 2022, Section 5.1.2.3; [Blasingame et al.](https://arxiv.org/pdf/2502.08006v2) 2025, Appendix E).**
As such we would generally recommend using *discretize-then-optimize* with recursive checkpointing with Diffrax [Diffrax](https://docs.kidger.site/diffrax/api/adjoints/).
We include the old code for legacy reasons but strongly recommend using this DTO strategy for most problems.
One can achieve similar results to these bespoke solvers via a change-of-variables in combination with pre-exising libraries like diffrax, see ([Blasingame et al.](https://arxiv.org/pdf/2502.08006v2) 2025, Proposition D.2) for more details.

---

AdjointDEIS is a **training-free** method for guided generation of diffusion models which uses the method of adjoint sensitivty.
AdjointDEIS consists bespoke ODE/SDE solvers which compute the gradients of the *Probability Flow* ODE and diffusion SDE w.r.t. the model parameters, solution trajectories, and conditional information.

*Please refer to the paper and project page for detailed methods and results.*

## Usage
The provided `adjointdeis.py` file contains the code for the core algorithm with cached solution trajectory (improved stability see Appendix F.1 in the paper).
The main function is described as
```python
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
```

### SDE
To use with SDEs we make use of *Cycle-SDE* ([Wu and la Torre](https://openaccess.thecvf.com/content/ICCV2023/papers/Wu_A_Latent_Space_of_Stochastic_Diffusion_Models_for_Zero-Shot_Image_ICCV_2023_paper.pdf) 2023) to encode the clean image into a list of enocded "noises" and noisy latent.
The function signature for this is
```python
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
```

To illustrate with some pseudocode we have

```python

# Assume x0 is the image tensor,
# z is the conditional information, and
# loss is the loss function we are trying to minimize

xT, ws = encode_cycle_sde(model, scheduler, x0, z)
x0_opt = adjointDEIS(model, scheduler, xT, z, loss, ws=ws, is_sde=True)

```

## Citation
If this work was helpful for your research, please consider citing the following paper:

```bibtex
@inproceedings{blasingame2024adjointdeis,
  title = {Adjoint{DEIS}: Efficient Gradients for Diffusion Models},
  author = {Blasingame, Zander W. and Liu, Chen},
  booktitle = {The Thirty-eighth Annual Conference on Neural Information Processing Systems},
  year = {2024},
  url = {https://openreview.net/forum?id=fAlcxvrOEX},
}
```
