---
title: 快速开始
icon: mdi:bullseye-arrow
createTime: 2026/04/02 15:53:26
permalink: /zh/kg_guide/kg_quickstart/quickstart/
---
# 快速上手-dfkg init

DataFlow-KG 采用代码生成 + 自定义修改 + 运行脚本的使用方式，即通过命令行调用，自动生成默认的运行脚本和入口 Python 文件，经过用户定制化修改后（比如更换数据集，使用不同的大模型 API，重新排列算子，增加自己的个性化pipeline），运行该 Python 文件以执行相应功能。

你只需要三步即可跑起我们提供的Pipeline。

## 1. 初始化项目

在一个空目录中执行：

```shell
dfkg init
```

即会在当前工作路径生成这些文件夹：

```shell
$ tree -L 1
.
|-- api_pipelines
|-- core_text
|-- cpu_pipelines
|-- example_data
|-- gpu_pipelines
|-- playground
`-- simple_text_pipelines
```

**各目录用途：**
* `cpu_pipelines`：仅使用 CPU 的 Pipeline
* `core_text`：DataFlow-KG 最基础的几个算子的样例
* `api_pipelines`：使用在线大模型 API（推荐新手）
* `gpu_pipelines`：使用本地 GPU 模型
* `example_data`：所有示例 Pipeline 的默认输入数据
* `playground`：轻量示例，不构成完整 Pipeline
* `simple_text_pipelines`：基础文本处理相关示例

## 2. Pipeline 分类说明（选一个就好）

同名 Pipeline 在不同目录下是包含关系：

| 目录 | 依赖资源 |
| :--- | :--- |
| `cpu_pipelines` | 仅 CPU |
| `api_pipelines` | CPU + 大模型 API |
| `gpu_pipelines` | CPU + API + 本地 GPU |

> **注：** 新手推荐直接从 `api_pipelines` 开始！后续如果你有 GPU，只需要把 `LLMServing` 换成本地模型即可。

## 3. 运行你的第一个Pipeline

进入任意 Pipeline 目录，例如：

```shell
cd api_pipelines
```

打开其中的 Python 文件，你通常只需要关注两处配置：

### （1）输入数据路径

```python
self.storage = FileStorage(
    first_entry_file_name="<path_to_dataset>"
)
```

这里默认指向了我们提供的样例数据集，可以直接运行。你可以把它改成你自己的数据集路径来推理自己的数据。

### （2）大模型 Serving

如果使用 API，需要先设置环境变量：

**Linux / macOS**
```shell
export DF_API_KEY=sk-xxxxx
```

**Windows CMD**
```cmd
set DF_API_KEY=sk-xxxxx
```

**PowerShell**
```powershell
$env:DF_API_KEY="sk-xxxxx"
```

然后直接运行脚本即可：

```shell
python xxx_pipeline.py
```

## 4. 多 API Serving（可选）

如果你需要同时使用多个大模型 API，可以为每个 Serving 指定不同的环境变量名：

```python
llm_serving_openai = APILLMServing_request(
    api_url="[https://api.openai.com/v1/chat/completions](https://api.openai.com/v1/chat/completions)",
    key_name_of_api_key="OPENAI_API_KEY",
    model_name="gpt-4o"
)

llm_serving_deepseek = APILLMServing_request(
    api_url="[https://api.deepseek.com/v1/chat/completions](https://api.deepseek.com/v1/chat/completions)",
    key_name_of_api_key="DEEPSEEK_API_KEY",
    model_name="deepseek-chat"
)
```

然后在环境变量里输出对应的字段名（比如 `OPENAI_API_KEY=sk-xxxxx`）即可实现多 API Serving 共存。

## 5. 添加自定义 Pipeline 模板（可选）

如果你希望将自己编写的 Pipeline 固化为标准模板，并在每次执行初始化操作时自动生成，可以通过修改源码的静态文件夹来实现：

1. **进入模板目录**：在 DataFlow-KG 源码仓库中，找到并进入 `dataflow/statics/pipelines/api_pipelines` 文件夹。
2. **放入自定义脚本**：将你自己编写的 `your_custom_pipeline.py` 文件放置于该目录下。
3. **更新本地安装**：回到 DataFlow-KG 仓库根目录，执行以下命令使修改在本地环境中生效：
   ```shell
   pip install -e .
   ```
4. **重新初始化**：在你需要工作的新目录中再次运行 `dfkg init`，你编写的自定义 Pipeline 脚本就会像预制菜一样，自动生成在相应的初始化文件夹中了。