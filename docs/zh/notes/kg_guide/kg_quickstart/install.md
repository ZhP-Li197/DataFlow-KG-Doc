---
title: 安装
icon: material-symbols:auto-transmission-sharp
createTime: 2025/06/09 10:29:31
permalink: /zh/kg_guide/kg_quickstart/install/
---
# 安装

本节介绍如何安装 DataFlow-KG。如果你仅想快速使用 DataFlow-KG 中提供的 Pipeline 和算子，请参考[普通用户安装](#普通用户安装)安装稳定正式版；如果你想作为开发者向 DataFlow 仓库贡献代码，提出 Pull Request，请参考[开发者安装](#开发者安装)安装仓库中的 dev 版。

> **注：** 针对 Knowledge Graph (KG) 任务，目前的依赖库已经过大幅精简优化。核心的图结构处理和可视化依赖于 `networkx` 与 `pyvis`，这使得整体安装过程更加轻量和迅速。为了提升安装速度，我们强烈推荐使用 `uv` 进行安装。

## 1. 普通用户安装

如果你没有 GPU 做本地推理环境，仅需使用 API 和 CPU 功能，则配置 Python 环境并安装 DataFlow-KG 正式版👇

```shell
conda create -n dfkg python=3.10 
conda activate dfkg

pip install uv
uv pip install dataflow-kg
```

如果想用本地GPU实现推理则需要使用如下命令：
```shell
conda create -n dfkg python=3.10 
conda activate dfkg

pip install uv
uv pip install dataflow-kg[vllm]
```

> DataFlow-KG 支持Python>=3.10的环境。

你可以用如下指令检查安装是否正确：
```shell
dfkg -v
```

如果安装正常，且DataFlow是最新的Release版，则会看到:
```log
open-dataflow-kg codebase version: 0.0.2
        Checking for updates...
        Local version:  0.0.2
        PyPI newest version:  0.0.2
You are using the latest version: 0.0.2.
```

此外还有`dfkg env`指令用于查看当前硬件软件环境，用于报告Bug使用。

## 2. 开发者安装

DataFlow-KG开发者可以通过以下指令安装:

如果不需要本地GPU推理
```shell
conda create -n dfkg python=3.10
conda activate dfkg

git clone https://github.com/OpenDCAI/DataFlow-KG.git
cd DataFlow-KG
pip install -e .
```

如果需要本地GPU推理：
```shell
conda create -n dfkg python=3.10
conda activate dfkg

git clone https://github.com/OpenDCAI/DataFlow-KG.git
cd DataFlow-KG
pip install -e .[vllm]
```

你可以用如下指令检查安装是否正确：
```shell
dfkg -v
```

如果安装正常，且DataFlow-KG是最新的Release版，则会看到:
```log
open-dataflow-kg codebase version: 0.0.2
        Checking for updates...
        Local version:  0.0.2
        PyPI newest version:  0.0.2
You are using the latest version: 0.0.2.
```

此外还有`dfkg env`指令用于查看当前硬件软件环境，用于报告Bug使用。

这样，你在本地对DataFlow-KG包进行的修改都可以实时更新到你的python环境中，方便开发。当开发完成后，也可以提PR向主仓库贡献你的新算子和新流水线。
