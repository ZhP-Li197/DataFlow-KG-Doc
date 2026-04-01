---
title: PromptedVQAGenerator
createTime: 2026/01/11 21:37:37
permalink: /zh/mm_operators/generate/prompted_vqa_generator/
---
## 📘 概述

`PromptedVQAGenerator` 是一个 **通用的多模态问答生成算子**。

它直接从 DataFrame 中读取 **提示词 (Prompt)** 和 **可选的媒体路径 (Image/Video)**，并调用模型生成答案。该算子具有高度的灵活性：

* **支持多模态**：同时输入文本与图像/视频进行 VQA。
* **支持纯文本**：若未提供图像或视频列，自动切换为纯文本对话模式 (Chat)。
* **支持多种输入格式**：既可以直接读取文本 Prompt 列，也可以解析 Conversation 格式列表。
* **兼容性**：内部自动处理本地模型 (Local VLLM) 的 Chat Template 封装与 API 模型的直接调用。

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
| `serving` | `LLMServingABC` | 无 | 负责执行推理的模型服务实例（支持本地或 API 模型）。 |
| `system_prompt` | `str` | `"You are..."` | 发送给模型的系统提示词。 |

## ⚡ `run` 函数

```python
def run(
    self, 
    storage: DataFlowStorage,
    input_prompt_key: str = None,
    input_conversation_key: str = None,
    input_image_key: str = None,
    input_video_key: str = None,
    output_answer_key: str = "answer",
):
    ...

```

执行算子主逻辑：

1. **数据读取与 Prompt 提取**
* 读取 `storage` 中的 DataFrame。
* **Prompt 来源（二选一）**：
* 若指定 `input_prompt_key`：直接读取该列的文本字符串作为 User Prompt。
* 若指定 `input_conversation_key`：读取该列的对话列表（List[Dict]），自动提取第一条 User Message 的内容。




2. **媒体数据处理**
* 尝试读取 `input_image_key` 和 `input_video_key`。
* **纯文本模式判定**：如果未提供媒体列，或某行数据的媒体路径为空，算子将自动以 **纯文本模式** 构造请求，不包含 `<image>` 或 `<video>` 占位符。


3. **输入构造与推理**
* **Local 模式**：使用 `process_vision_info` 处理图像/视频，应用 Chat Template 构造最终 prompt。
* **API 模式**：直接传递原始 prompt 和媒体路径列表。
* 调用 `serving.generate_from_input` 执行批量推理。


4. **结果保存**
* 将生成结果写入 `output_answer_key` 列并保存。



### 🧾 `run` 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `storage` | `DataFlowStorage` | 无 | DataFlow 数据存储对象。 |
| `input_prompt_key` | `str` | `None` | **文本 Prompt 列名**。与 conversation_key 二选一。 |
| `input_conversation_key` | `str` | `None` | **对话列表列名**。与 prompt_key 二选一。若使用，将提取第一个用户的输入。 |
| `input_image_key` | `str` | `None` | **(可选)** 图像路径列名。若为空，则视为纯文本任务。 |
| `input_video_key` | `str` | `None` | **(可选)** 视频路径列名。 |
| `output_answer_key` | `str` | `"answer"` | 生成结果的输出列名。 |

## 🧩 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.core import LLMServing
from dataflow.operators.generate import PromptedVQAGenerator

# 1) 初始化模型
serving = LLMServing(model_path="Qwen/Qwen2.5-VL-3B-Instruct")

# 2) 初始化算子
generator = PromptedVQAGenerator(
    serving=serving,
    system_prompt="You are a helpful assistant."
)

# 3) 准备数据 (jsonl)
# 示例数据 A: {"image": "1.jpg", "question": "Describe this image."}
# 示例数据 B: {"question": "What is AI?"} (无图，纯文本)
storage = FileStorage(file_name_prefix="mixed_tasks")
storage.step()

# 4) 执行生成
generator.run(
    storage=storage,
    input_prompt_key="question",  # 读取 question 列作为 prompt
    input_image_key="image",      # 读取 image 列 (可选)
    output_answer_key="answer"
)

```

### 🧾 输入输出示例

**输入 DataFrame：**
| image | question |
| :--- | :--- |
| `"/data/cat.jpg"` | `"What animal is this?"` |
| `None` | `"Explain quantum physics briefly."` |

**输出 DataFrame：**
| image | question | answer |
| :--- | :--- | :--- |
| `"/data/cat.jpg"` | `"What animal is this?"` | `"It is a cat."` |
| `None` | `"Explain quantum physics briefly."` | `"Quantum physics is the study of..."` |
