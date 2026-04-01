---
title: 沐曦机器开发
createTime: 2025/06/30 11:18:41
permalink: /zh/dev_guide/4n8jhy2e/
---
# 沐曦开发背景
沐曦机器所有的跟`torch`，显卡调用相关的库都必须使用沐曦官方提供编译的运行时。如果覆盖安装普通的CUDA包，会导致cuda not found等一些列问题。请务必注意。

`pip list`的部分样例：
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
所有带`maca`, `metax`后缀的包都不能覆盖安装，否则会有有未定义问题。

> 如果覆盖安装，则只能从平台重新部署镜像恢复。务必小心。


## 无问芯穹平台开发Dataflow
首先需要创建开发机，申请显卡，并创建镜像，推荐使用该镜像
```
cr.infini-ai.com/*/llamafactory_vllm_xc:v0.1
```

作为开发者，请从官方仓库clone/pull最新版
```shell
git clone https://github.com/OpenDCAI/DataFlow
```

然后使用本地安装

```shell
cd DataFlow
pip install -e .
```

默认应该不会安装`vllm`，请务必检查`vllm`库是否被覆盖。

然后执行`dataflow -v`和`dataflow env`来查看是否运行正常。

随后参考[指南](../guide/quickstart/install.md)使用库内各种算子和Pipeline即可。