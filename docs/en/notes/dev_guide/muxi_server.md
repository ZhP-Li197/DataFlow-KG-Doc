---
title: Muxi Machine Development
createTime: 2025/06/30 11:18:41
permalink: /en/dev_guide/4n8j4y2e/
---

# Muxi Development Background

All libraries related to `torch` and GPU calls on Muxi machines **must** use the runtime compiled and provided by the official Muxi team. If you overwrite and install standard CUDA packages, it may lead to issues such as "CUDA not found" and other related problems. **Please take this seriously.**

A sample of `pip list` output:

```
apex                              0.1+metax2.29.0.4
dropout_layer_norm                0.1+metax2.29.0.4torch2.4
flash_attn                        2.6.3+metax2.29.0.4torch2.4
flashinfer                        0.1.5+metax2.29.0.4torch2.4
fonttools                         4.56.0
frozenlist                        1.5.0
fsspec                            2024.6.1
func_timeout                      4.3.5
fused_dense_lib                   2.6.3+metax2.29.0.4torch2.4
mcspconv                          2.1.0+metax2.29.0.4torch2.4
ray                               2.9.3+maca2.29.0.5
referencing                       0.36.2
regex                             2024.11.6
requests                          2.32.3
rich                              14.0.0
rootpath                          0.1.1
rotary_emb                        0.1+metax2.29.0.4torch2.4
torch                             2.4.0+metax2.29.0.4
torchaudio                        2.4.1+metax2.29.0.4
torchdata                         0.11.0
torchvision                       0.15.1+metax2.29.0.4
triton                            3.0.0+metax20250216.312
vllm                              0.7.2+maca2.29.0.5torch2.4
xentropy_cuda_lib                 0.1+metax2.29.0.4torch2.4
xformers                          0.0.22+metax2.29.0.4torch2.4
```

Any package with the suffix `maca` or `metax` **must not** be overwritten. Doing so will lead to undefined behavior and errors.

> If such packages are overwritten, the only recovery method is to redeploy the image from the platform. Proceed with extreme caution.

## Developing DataFlow on the Wuwen Xinqiong Platform

First, you need to create a development machine, apply for a GPU, and create an image. The following image is recommended:

```
cr.infini-ai.com/*/llamafactory_vllm_xc:v0.1
```

As a developer, please clone or pull the latest version from the official repository:

```shell
git clone https://github.com/OpenDCAI/DataFlow
```

Then install it locally:

```shell
cd DataFlow
pip install -e .
```

By default, `vllm` should not be installed. Please ensure the `vllm` library has **not** been overwritten.

Then run `dataflow -v` and `dataflow env` to check if everything is working properly.

Then, refer to the [guide](../guide/quickstart/install.md) to use various operators and pipelines provided within the library.
