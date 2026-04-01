---
title: BatchVQAGenerator
createTime: 2026/01/11 21:54:10
permalink: /zh/mm_operators/generate/batch_vqa_generator/
---
## 📘 概述

`BatchVQAGenerator` 是一个 **批量视觉问答生成算子**。

它专为 **"One Image, Many Questions"（一图多问）** 场景设计。输入是一张图片和一个问题列表（例如 ["颜色是什么?", "有多少人?", "他们在做什么?"]）。该算子会自动将这张图片与列表中的每一个问题配对，构造 Batch 请求并并行生成答案。

这种机制非常适合由粗到细（Coarse-to-Fine）的密集描述生成、多角度图像分析或基于属性的详细问答任务。

## 🏗️ `__init__` 函数

```python
def __init__(
    self, 
    serving: LLMServingABC, 
    system_prompt: str = "You are a helpful assistant."
):

```

### 🧾 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `serving` | `LLMServingABC` | 无 | 负责执行推理的模型服务实例（需支持 VLM 多模态输入）。 |
| `system_prompt` | `str` | `"You are..."` | 发送给模型的系统提示词。 |

## ⚡ `run` 函数

```python
def run(
    self, 
    storage: DataFlowStorage, 
    input_prompts_key: str, 
    input_image_key: str, 
    output_key: str
):
    ...

```

执行算子主逻辑：

1. **数据读取**
从 DataFrame 中读取图像路径 (`input_image_key`) 和问题列表 (`input_prompts_key`)。
2. **广播与 Batch 构建 (Broadcasting)**
对于每一行数据：
* 获取单张图片的路径。
* 遍历问题列表中的每一个问题 `q`。
* 为每个问题构造标准的多模态消息：`[Image, Text(q)]`。
* 将该图片的所有问答请求打包为一个 Batch。


3. **并行推理**
调用 `serving.generate_from_input`，利用 GPU 并行能力一次性生成该图片所有问题的答案。
4. **结果保存**
将生成的答案列表（顺序与问题列表一致）写入 `output_key` 列。

### 🧾 `run` 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `storage` | `DataFlowStorage` | 无 | DataFlow 数据存储对象。 |
| `input_prompts_key` | `str` | 无 | **输入问题列表**所在的列名（`List[str]`）。 |
| `input_image_key` | `str` | 无 | **单张图像**路径所在的列名。 |
| `output_key` | `str` | 无 | 输出答案列表的列名（`List[str]`）。 |

## 🧩 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.core import LLMServing
from dataflow.operators.generate import BatchVQAGenerator

# 1) 初始化模型
serving = LLMServing(model_path="Qwen/Qwen2.5-VL-7B-Instruct")

# 2) 初始化算子
generator = BatchVQAGenerator(
    serving=serving,
    system_prompt="Answer briefly."
)

# 3) 准备数据 (jsonl)
# 数据格式: {"image": "scene.jpg", "questions": ["Weather?", "Object count?", "Action?"]}
storage = FileStorage(file_name_prefix="dense_captioning")
storage.step()

# 4) 执行批量问答
generator.run(
    storage=storage,
    input_prompts_key="questions",
    input_image_key="image",
    output_key="answers"
)

```

### 🧾 默认输出格式

`output_key` 列为字符串列表，长度与输入的问题列表一致。

**示例输入 DataFrame：**
| image | questions |
| :--- | :--- |
| `"park.jpg"` | `["Weather?", "Count?", "Action?"]` |

**示例输出 DataFrame：**
| image | questions | answers |
| :--- | :--- | :--- |
| `"park.jpg"` | `["Weather?", "Count?", "Action?"]` | `["Sunny", "3 people", "Running"]` |
