---
title: VisualReasoningGenerator
createTime: 2026/01/11 21:42:10
permalink: /zh/mm_operators/generate/visual_reasoning_generator/
---
## 📘 概述

`VisualReasoningGenerator` 是一个 **视觉推理生成算子**，用于调用 VLM 生成详细的推理过程（例如包含 `<think>` 和 `<answer>` 标签的文本）。

该算子内置了 **Fallback（回退）机制**：在执行生成前，会先检查指定的 `input_existing_chains_key` 列。如果该列中已存在有效的推理链数据，算子将直接复用该数据，跳过模型推理。这一特性使其非常适合用于断点续跑或数据补全场景。

## 🏗️ `__init__` 函数

```python
def __init__(
    self, 
    serving: LLMServingABC, 
    prompt_type: str = "web_grounding"
):

```

### 🧾 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `serving` | `LLMServingABC` | 无 | 负责执行推理的模型服务实例。 |
| `prompt_type` | `str` | `"web_grounding"` | **Prompt 类型键值**。用于从 `MCTReasoningPrompt` 库中检索对应的 System Prompt（例如针对网页定位、数学推理等不同场景的预设 prompt）。 |

## ⚡ `run` 函数

```python
def run(
    self, 
    storage: DataFlowStorage, 
    input_question_key: str, 
    input_image_key: str, 
    output_key: str,
    input_existing_chains_key: Optional[str] = None
):
    ...

```

执行算子主逻辑：

1. **Fallback 检查**
* 若提供了 `input_existing_chains_key`，检查 DataFrame 中该列的数据。
* 若某行数据已存在非空的列表（List），则直接将其作为结果，**不进行模型调用**。


2. **输入构造**
* 对于需要生成的样本，读取 `input_question_key`（问题）和 `input_image_key`（图像路径）。
* 结合初始化时选定的 `System Prompt`，构造包含 `[Image, Text]` 的多模态输入。


3. **批量生成**
* 将待生成的请求打包成 Batch。
* 调用 `serving.generate_from_input` 执行推理。


4. **结果整合**
* 将复用的旧数据与新生成的数据（包装为 List 格式）合并。
* 写入 `output_key` 并保存。



### 🧾 `run` 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `storage` | `DataFlowStorage` | 无 | DataFlow 数据存储对象。 |
| `input_question_key` | `str` | 无 | 问题文本所在的列名。 |
| `input_image_key` | `str` | 无 | 图像路径所在的列名。 |
| `output_key` | `str` | 无 | 输出结果的列名（存储为 `List[str]`）。 |
| `input_existing_chains_key` | `str` | `None` | **(可选) 现有推理链列名**。若该列有值，则跳过生成直接复用。 |

## 🧩 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.core import LLMServing
from dataflow.operators.generate import VisualReasoningGenerator

# 1) 初始化模型
serving = LLMServing(model_path="Qwen/Qwen2.5-VL-7B-Instruct")

# 2) 初始化算子
# prompt_type="web_grounding" 会自动加载对应的 System Prompt
generator = VisualReasoningGenerator(
    serving=serving,
    prompt_type="web_grounding"
)

# 3) 准备数据 (jsonl)
# 假设我们有一份部分跑过的数据，'history_reasoning' 列有的有值，有的为空
storage = FileStorage(file_name_prefix="reasoning_task")
storage.step()

# 4) 执行生成 (带断点续跑功能)
generator.run(
    storage=storage,
    input_question_key="question",
    input_image_key="image",
    output_key="reasoning_result",
    input_existing_chains_key="history_reasoning" # 优先使用此列数据
)

```

### 🧾 输入输出示例

**输入 DataFrame：**
| image | question | history_reasoning |
| :--- | :--- | :--- |
| `"1.jpg"` | `"Find the button."` | `["<think>The button is red...</think>..."]` |
| `"2.jpg"` | `"Where is the logo?"` | `[]` (或 `None`) |

**输出 DataFrame (`reasoning_result`)：**
| image | question | reasoning_result | 说明 |
| :--- | :--- | :--- | :--- |
| `"1.jpg"` | `"Find the button."` | `["<think>The button is red...</think>..."]` | **复用**：直接拷贝 `history_reasoning` |
| `"2.jpg"` | `"Where is the logo?"` | `["<think>Scanning image...</think> Top left."]` | **生成**：调用模型生成 |
