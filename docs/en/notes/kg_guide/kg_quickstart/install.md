---
title: Installation
icon: material-symbols:auto-transmission-sharp
createTime: 2025/06/09 10:29:31
permalink: /en/kg_guide/kg_quickstart/install/
---
# Installation

This section introduces how to install DataFlow-KG. If you simply want to quickly use the pipelines and operators provided in DataFlow-KG, please refer to [General User Installation](#general-user-installation) to install the stable release version. If you want to contribute code to the DataFlow repository as a developer and submit Pull Requests, please refer to [Developer Installation](#developer-installation) to install the dev version from the repository.

> **Note:** For Knowledge Graph (KG) tasks, the current dependencies have been significantly streamlined and optimized. Core graph structure processing and visualization rely on `networkx` and `pyvis`, making the overall installation process more lightweight and faster. To speed up the installation, we highly recommend using `uv`.

## 1. General User Installation

If you don't have a GPU for a local inference environment and only need to use APIs and CPU functions, configure your Python environment and install the DataFlow-KG official release👇

```shell
conda create -n dfkg python=3.10 
conda activate dfkg

pip install uv
uv pip install dataflow-kg
```


If you want to use a local GPU for inference, you need to use the following command:
```shell
conda create -n dfkg python=3.10 
conda activate dfkg

pip install uv
uv pip install dataflow-kg[vllm]
```

> DataFlow-KG supports Python >= 3.10 environments.

You can use the following command to verify if the installation is correct:
```shell
dfkg -v
```

If the installation is successful, you will see:
```log
open-dataflow-kg codebase version: ***
        Checking for updates...
        Local version:  ***
        PyPI newest version:  ***
You are using the latest version: ***.
```

Additionally, there is the `dfkg env` command to view the current hardware and software environment, which is useful for bug reporting.

## 2. Developer Installation

DataFlow-KG developers can install via the following commands:

If local GPU inference is not required:
```shell
conda create -n dfkg python=3.10
conda activate dfkg

git clone https://github.com/OpenDCAI/DataFlow-KG.git
cd DataFlow-KG
pip install -e .
```

If local GPU inference is required:
```shell
conda create -n dfkg python=3.10
conda activate dfkg

git clone https://github.com/OpenDCAI/DataFlow-KG.git
cd DataFlow-KG
pip install -e .[vllm]
```

You can use the following command to verify if the installation is correct:
```shell
dfkg -v
```

If the installation is successful, you will see:
```log
open-dataflow-kg codebase version: ***
        Checking for updates...
        Local version:  ***
        PyPI newest version:  ***
You are using the latest version: ***.
```

Additionally, there is the `dfkg env` command to view the current hardware and software environment, which is useful for bug reporting.

This way, any modifications you make locally to the DataFlow-KG package will be updated in your Python environment in real-time, making development easier. Once development is complete, you can also submit a PR to contribute your new operators and pipelines to the main repository.
