---
title: 安装
icon: material-symbols-light:download-rounded
createTime: 2025/06/09 10:29:31
permalink: /en/kg_guide/install/
---
# 安装
本节介绍如何安装DataFlow，如果你仅想快速使用DataFlow中提供的Pipeline和算子，请参考[普通用户安装](#普通用户安装)安装稳定正式版，如果你想作为开发者向DataFlow仓库贡献代码，提出Pull Request，请参考[开发者安装](#开发者安装)安装仓库中的dev版。

## 普通用户安装

如果你没有GPU做本地推理环境，仅需使用API和CPU功能，则配置Python环境并安装DataFlow正式版👇

```shell
conda create -n dataflow python=3.10 
conda activate dataflow

pip install open-dataflow
```


如果想用本地GPU实现推理则需要使用如下命令：
```shell
conda create -n dataflow python=3.10 
conda activate dataflow

pip install open-dataflow[vllm]
```

> Dataflow 支持Python>=3.10的环境。

你可以用如下指令检查安装是否正确：
```shell
dataflow -v
```

如果安装正常，且DataFlow是最新的Release版，则会看到:
```log
open-dataflow codebase version: 0.0.2
        Checking for updates...
        Local version:  0.0.2
        PyPI newest version:  0.0.2
You are using the latest version: 0.0.2.
```

此外还有`dataflow env`指令用于查看当前硬件软件环境，用于报告Bug使用。

## 开发者安装

DataFlow开发者可以通过以下指令安装:

如果不需要本地GPU推理
```shell
conda create -n dataflow python=3.10
conda activate dataflow

git clone https://github.com/OpenDCAI/DataFlow
cd DataFlow
pip install -e .
```

如果需要本地GPU推理：
```shell
conda create -n dataflow python=3.10
conda activate dataflow

git clone https://github.com/OpenDCAI/DataFlow
cd DataFlow
pip install -e .[vllm]
```

你可以用如下指令检查安装是否正确：
```shell
dataflow -v
```

如果安装正常，且DataFlow是最新的Release版，则会看到:
```log
open-dataflow codebase version: 0.0.2
        Checking for updates...
        Local version:  0.0.2
        PyPI newest version:  0.0.2
You are using the latest version: 0.0.2.
```

此外还有`dataflow env`指令用于查看当前硬件软件环境，用于报告Bug使用。

这样，你在本地对DataFlow包进行的修改都可以实时更新到你的python环境中，方便开发。当开发完成后，也可以提PR向主仓库贡献你的新算子和新流水线。

