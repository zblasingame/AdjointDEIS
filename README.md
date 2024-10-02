<div align="center">
<h1> AdjointDEIS (NeurIPS 2024) </h1>
<h3> AdjointDEIS: Efficient Gradients for Diffusion Models </h3>

[Zander W. Blasingame](https://zblasingame.github.io/) &emsp; <b>&middot;</b> &emsp; [Chen Liu](https://camel.clarkson.edu/members.html)

Clarkson University

[![arXiv](https://img.shields.io/badge/arXiv-<2405.15020>-<COLOR>.svg)](https://arxiv.org/abs/2405.15020)
[![Webpage](https://img.shields.io/badge/webpage-Project%20Page-blue.svg)](https://zblasingame.github.io/AdjointDEIS/)
</div>

## News

- **2024.09.25**: Congratulations on AdjointDEIS being accepted by NeurIPS 2024! Our open-source project is under development, stay tuned for updates!

## Todo
- [ ] release the camera-ready version of the paper
- [ ] release the code for solving the adjoint *Probability Flow* ODE
- [ ] release the code for solving the adjoint diffusion SDE

## Introduction
AdjointDEIS is a **training-free** method for guided generation of diffusion models which uses the method of adjoint sensitivty.
AdjointDEIS consists bespoke ODE/SDE solvers which compute the gradients of the *Probability Flow* ODE and diffusion SDE w.r.t. the model parameters, solution trajectories, and conditional information.

*Please refer to the paper and project page for detailed methods and results.*

## Code
Under construction. Visit soon!


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
