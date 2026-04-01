---
title: FixPromptedVQAGenerator
createTime: 2026/01/11 21:31:49
permalink: /zh/mm_operators/fix_prompted_vqa_generator/
---
## 📘 概述

`FixPromptedVQAGenerator` 是一个 **固定提示词的多模态问答算子**。

它用于对批量图像或视频执行 **相同** 的指令任务。与动态模板不同，该算子在初始化时接受一个固定的 `user_prompt`（例如 "Please caption this image"），并将其应用于输入 DataFrame 中的每一个媒体样本。

适用场景：

* 批量图像/视频描述生成 (Captioning)。
* 对整个数据集进行统一的 VQA 提问（例如 "图中是否有暴力内容？"）。

## 🏗️ `__init__` 函数

```python
def __init__(
    self, 
    serving: LLMServingABC, 
    system_prompt: str = "You are a helpful assistant.",
    user_prompt: str = "Please caption the media in detail."
):

```

### 🧾 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `serving` | `LLMServingABC` | 无 | 负责执行推理的模型服务实例（需支持多模态推理）。 |
| `system_prompt` | `str` | `"You are..."` | 发送给模型的系统提示词。 |
| `user_prompt` | `str` | `"Please caption..."` | **核心参数**。对所有输入样本统一使用的用户指令（Prompt）。 |

## ⚡ `run` 函数

```python
def run(
    self, 
    storage: DataFlowStorage,
    input_image_key: str = "image", 
    input_video_key: str = "video",
    output_answer_key: str = "answer",
):
    ...

```

执行算子主逻辑：

1. **数据读取**
从 `storage` 中读取 DataFrame。
2. **输入构建**
* 检查并读取 `input_image_key` 或 `input_video_key` 列。
* 为每一个媒体文件构建输入消息：包含固定的 `system_prompt`、媒体文件本身以及固定的 `user_prompt`。


3. **批量推理**
* 将构建好的 Prompt 和媒体数据打包成 Batch。
* 调用 `serving.generate_from_input` 执行并行推理。


4. **结果保存**
* 将模型生成的文本结果写入 `output_answer_key` 列。
* 更新并保存 DataFrame。



### 🧾 `run` 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `storage` | `DataFlowStorage` | 无 | DataFlow 数据存储对象。 |
| `input_image_key` | `str` | `"image"` | 图像路径所在的列名（与 video_key 二选一）。 |
| `input_video_key` | `str` | `"video"` | 视频路径所在的列名（与 image_key 二选一）。 |
| `output_answer_key` | `str` | `"answer"` | 生成结果的输出列名。 |

## 🧩 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.core import LLMServing
from dataflow.operators.generate import FixPromptedVQAGenerator

# 1) 初始化模型
serving = LLMServing(model_path="Qwen/Qwen2.5-VL-3B-Instruct")

# 2) 初始化算子：设置固定的 Prompt
# 例如：我们要对一批图片生成详细的中文描述
generator = FixPromptedVQAGenerator(
    serving=serving,
    system_prompt="你是一个乐于助人的视觉助手。",
    user_prompt="请详细描述这张图片中的内容，包括物体、颜色和空间关系。"
)

# 3) 准备数据
storage = FileStorage(
    file_name_prefix="image_captioning_task",
    cache_path="./cache_data"
)
storage.step()

# 4) 执行生成
generator.run(
    storage=storage,
    input_image_key="image_path",
    output_answer_key="detailed_caption"
)

```

### 🧾 输入输出示例

**输入 DataFrame 行：**
| image_path |
| :--- |
| `"/data/cat.jpg"` |
| `"/data/dog.png"` |

**输出 DataFrame 行：**
| image_path | detailed_caption |
| :--- | :--- |
| `"/data/cat.jpg"` | `"一只黑白相间的猫坐在沙发上..."` |
| `"/data/dog.png"` | `"一只金毛犬在草地上奔跑..."` |
