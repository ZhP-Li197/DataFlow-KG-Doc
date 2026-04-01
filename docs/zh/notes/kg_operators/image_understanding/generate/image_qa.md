---
title: ImageQAGenerator
createTime: 2025/10/15 16:00:00
# icon: material-symbols-light:quiz
permalink: /zh/mm_operators/generate/image_qa/
---

## 📘 概述

`ImageQAGenerator` 是一个用于**根据图像内容自动生成问答对（Visual QA）**的算子。  
它会基于图像场景智能提出合理问题，并生成参考答案。

**功能特点：**
* 支持批量处理多张图像。
* 基于视觉语言模型自动生成相关问答。
* 可应用于视觉问答数据集构建和模型训练。
* 自动处理图像输入和问答提示词构建。

---

## 🏗️ `__init__` 函数

```python
def __init__(
    self,
    llm_serving: LLMServingABC
):
    ...
```

## 🧾 `__init__` 参数说明

| 参数名           | 类型              | 默认值 | 说明                        |
| :------------ | :-------------- | :-- | :------------------------ |
| `llm_serving` | `LLMServingABC` | -   | **模型服务对象**，用于调用视觉语言模型进行 QA 生成 |

-----

## ⚡ `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage,
    input_modal_key: str = "image",
    output_key: str = "output"
):
    ...
```

执行算子主逻辑，读取图片路径 → **验证数据框** → 构建提示词 → 调用模型 → 生成问答对（VQA）并写入输出文件。

## 🧾 `run` 参数说明

| 参数名              | 类型                | 默认值          | 说明              |
| :---------------- | :---------------- | :----------- | :-------------- |
| `storage`         | `DataFlowStorage` | -            | Dataflow 数据存储对象 |
| `input_modal_key` | `str`             | `"image"`    | **多模态输入字段名**（如图像路径） |
| `output_key`      | `str`             | `"output"`   | **输出问答对字段名**（默认为 `output`，可自定义） |

-----

## 🧠 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.serving.local_model_vlm_serving import LocalModelVLMServing_vllm
from dataflow.operators.core_vision import ImageQAGenerator

# Step 1: 启动本地模型服务
serving = LocalModelVLMServing_vllm(
    hf_model_name_or_path="Qwen/Qwen2.5-VL-3B-Instruct",
    vllm_tensor_parallel_size=1,
    vllm_temperature=0.7,
    vllm_top_p=0.9,
    vllm_max_tokens=1024
)

# Step 2: 准备输入数据
storage = FileStorage(
    first_entry_file_name="dataflow/example/Image2TextPipeline/test_image2qa.jsonl",
    cache_path="./cache_local",
    file_name_prefix="imageqa",
    cache_type="jsonl",
)
storage.step() # 加载数据

# Step 3: 初始化并运行算子
qa_generator = ImageQAGenerator(serving)
qa_generator.run(
    storage=storage,
    input_modal_key="image",
    output_key="qa_pairs" # 在示例中指定输出字段为 "qa_pairs"
)
```

-----

## 🧾 默认输出格式（Output Format）

| 字段         | 类型                     | 说明                                 |
| :--------- | :--------------------- | :--------------------------------- |
| `image`    | `List[str]`            | 输入图像路径                             |
| `qa_pairs` | `List[Dict[str, str]]` | 生成的问答对，包含 `question` 与 `answer` 字段 |

> **注意：** 模型的原始输出 (`output_key`) 通常是一个包含所有问答对的字符串，需要后续的算子（如 `JsonParser`）进行结构化处理才能得到 `List[Dict[str, str]]` 结构。这里展示的是**理想的结构化后的输出格式**。

-----

### 📥 示例输入

```jsonl
{"image": ["./test/street_scene.jpg"]}
```

### 📤 示例输出 (结构化后)

```jsonl
{
  "image": ["./test/street_scene.jpg"],
  "qa_pairs": [
    {"question": "图中有几辆车？", "answer": "两辆"},
    {"question": "这张照片拍摄于什么场景？", "answer": "城市街道"},
    {"question": "图中主要的交通工具是什么？", "answer": "汽车"}
  ]
}
```