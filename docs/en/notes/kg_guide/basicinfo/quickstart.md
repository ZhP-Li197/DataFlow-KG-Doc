---
title: 快速开始
createTime: 2025/06/30 19:19:16
permalink: /en/kg_guide/quickstart/
icon: solar:flag-2-broken
---

# 快速开始
DataFlow使用了类似[`create-react-app`](https://github.com/facebook/create-react-app)或者[`vue-cli`](https://cli.vuejs.org/)的“**代码生成**”的使用范式。即通过命令行调用，自动生成运行脚本和入口Python文件，经过用户定制化修改后（比如更换数据集，使用不同的大模型API，重新微调算子），运行该Python文件以执行相应功能。

具体来说，当参考上一节成功安装DataFLow后，请找一个空的工作路径准备体验DataFLow。切换到该路径下后执行：
```shell
dataflow init
```

即会在当前工作路径生成三个文件夹`cpu`, `api`, `gpu`，以及一个用于存放默认样例数据的`example_data`文件夹。

我们每一条预设好的Pipeline都提供了三种模式，分别放置在这三个文件夹下。根据运行Pipeline所需的算子的资源类型进行分类，参考下表：

| 用户类别   | 仅需CPU的算子 | 需要大模型API的算子 | 需要本地部署GPU的算子 |
|:------------:|:---------:|:-------------:|:-----------:|
|`cpu`| √       |             |           |
|`api`| √       | √           |           |
|`gpu`| √       | √           | √         |

不同文件夹下的**同名**pipeline是包含关系。即`gpu`文件夹下的pipeline最长，包含全部功能。去掉了需要本地部署GPU模型的算子就变成了`api`文件夹下的pipeline。再进一步去掉了需要大模型后端的算子就变成了`cpu`下的pipeline。

特别的，这里的`api`pipeline是可以通过修改其中的`LLMServing`为本地GPU模型（比如Qwen-3, llama等模型）来将其部署在本地的。相比于`gpu`pipeline，`api`pipeline中被去掉的算子主要是因为`gpu`中调用了一些`vllm`后端无法部署的，非常规LLM的模型。

随后，切换到对应路径下即可看到各种我们预设好的Pipeline所对应的Python文件。

对于这些文件，默认的入口数据集是存放在`exapmle_data`文件夹下的`json`文件。你可以通过修改`storage`类中的`first_entry_file_name`字段来将其指向你要处理的原始数据集。
```python
self.storage = FileStorage(
    first_entry_file_name="../example_data/AgenticRAGPipeline/pipeline_small_chunk.json",
    cache_path="./cache_local", # 缓存路径
    file_name_prefix="dataflow_cache_step", # 缓存文件的文件名
    cache_type="json",  # 中间缓存文件的文件类型
)
```

此外，你可能还需要根据你的设备或你拥有的api_url修改`LLMServing`类来使用你本地下载好的模型或者在线大模型API。


特别的，如果你使用 API 方式调用，则需要向环境变量输出 `api_key` 字段，在 Linux 下是：

```bash
export api_key=sh-xxxxx
```

在 Windows 下，可以使用以下命令设置环境变量：

```cmd
set api_key=sh-xxxxx
```

或者在 PowerShell 中使用：

```powershell
$env:api_key = "sh-xxxxx"
```

设置完成后，程序就可以从环境中读取该 API 密钥进行调用。确保不要将密钥暴露在公开代码中。

当修改好Python脚本后，即可运行脚本，体验DataFlow舒适的数据治理功能：
```shell
python reasoning_pipeline.py
```


