---
title: PromptTemplatedVQAGenerator
createTime: 2026/01/11 21:25:34
permalink: /zh/mm_operators/generate/prompt_templated_vqa_generator/
---
## 📘 概述

`PromptTemplatedVQAGenerator` 是一个 **基于模板的多模态问答算子**。它允许用户将 DataFrame 中的多个字段动态注入到预定义的 Prompt 模板中，生成定制化的文本指令，并结合图像或视频输入进行批量推理。

与标准的 VQA 算子不同，该算子支持更复杂的 Prompt 逻辑（例如动态填入类别、上下文描述等），非常适合需要 **结构化 Prompt 构建** 的场景，如基于特定属性的图像描述、受控多轮对话模拟等。

## 🏗️ `__init__` 函数

```python
def __init__(
    self,
    serving: LLMServingABC,
    prompt_template: NamedPlaceholderPromptTemplate,
    system_prompt: str = "You are a helpful assistant.",
):

```

### 🧾 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `serving` | `LLMServingABC` | 无 | 负责执行推理的模型服务实例（需支持多模态推理）。 |
| `prompt_template` | `NamedPlaceholderPromptTemplate` | 无 | 实现了 `build_prompt` 方法的模板对象，用于将字典数据转换为字符串 Prompt。 |
| `system_prompt` | `str` | `"You are..."` | 发送给模型的系统提示词。 |

## ⚡ `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage,
    input_image_key: str = "image",
    input_video_key: str = "video",
    output_answer_key: str = "answer",
    **input_keys,
):
    ...

```

执行算子主逻辑：

1. **数据读取**
从 `storage` 中读取 DataFrame。
2. **Prompt 动态构建**
遍历 DataFrame 的每一行：
* 提取 `input_keys` 映射中指定的列数据（例如 `descriptions` 列, `type` 列）。
* 调用 `prompt_template.build_prompt()` 将这些数据填入模板，生成该样本专属的 `prompt_text`。


3. **多模态输入组装**
* 读取 `input_image_key` 或 `input_video_key` 指定的媒体路径。
* 将生成的文本 Prompt 与对应的图像/视频数据打包成符合模型要求的输入格式。


4. **模型推理与输出**
* 调用模型服务进行批量生成。
* 将结果写入 `output_answer_key` 指定的列，并保存更新后的 DataFrame。



### 🧾 `run` 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `storage` | `DataFlowStorage` | 无 | DataFlow 数据存储对象。 |
| `input_image_key` | `str` | `"image"` | 图像路径所在的列名（与 video_key 二选一）。 |
| `input_video_key` | `str` | `"video"` | 视频路径所在的列名（与 image_key 二选一）。 |
| `output_answer_key` | `str` | `"answer"` | 生成结果的输出列名。 |
| `**input_keys` | `kwargs` | 无 | **关键参数**。定义模板占位符与 DataFrame 列名的映射关系。<br>

<br>格式：`模板变量名="DataFrame列名"`。 |

## 🧩 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.core import LLMServing
from dataflow.prompts.prompt_template import NamedPlaceholderPromptTemplate
from dataflow.operators.generate import PromptTemplatedVQAGenerator

# 1) 定义带占位符的模板
# 假设我们要让模型检查图像中是否包含特定类型的物体，并参考已有的描述
TEMPLATE = (
    "Context: {descriptions}\n\n"
    "Task: Describe the appearance of {type} in the image based on the context above."
)
prompt_template = NamedPlaceholderPromptTemplate(template=TEMPLATE)

# 2) 初始化算子
op = PromptTemplatedVQAGenerator(
    serving=LLMServing(model_path="Qwen/Qwen2.5-VL-3B-Instruct"),
    prompt_template=prompt_template
)

# 3) 准备数据 (假设 jsonl 中包含 image, meta_desc, obj_type 三列)
storage = FileStorage(file_name_prefix="vqa_task")
storage.step()

# 4) 运行算子：将 meta_desc 列填入 {descriptions}，将 obj_type 列填入 {type}
op.run(
    storage=storage,
    input_image_key="image",
    output_answer_key="generated_caption",
    # 动态映射：
    descriptions="meta_desc", 
    type="obj_type"
)

```

### 🧾 输入输出示例

**输入 DataFrame 行：**
| image | meta_desc | obj_type |
| :--- | :--- | :--- |
| `"/path/to/car.jpg"` | `"A photo taken on a sunny day."` | `"vintage car"` |

**构建的 Prompt：**

> "Context: A photo taken on a sunny day.\n\nTask: Describe the appearance of **vintage car** in the image based on the context above."

**输出 DataFrame 行：**
| image | meta_desc | obj_type | generated_caption |
| :--- | :--- | :--- | :--- |
| `"/path/to/car.jpg"` | `...` | `...` | `"The vintage car is red with..."` |
