---
title: 视频描述生成（VideoToCaptionGenerator）
createTime: 2025/07/16 14:50:59
permalink: /zh/mm_operators/video_understanding/generate/video_caption/
---

## 📘 概述

`VideoToCaptionGenerator` 是一个用于 **调用视觉语言大模型自动生成视频描述（Video Caption）** 的算子。  
它会根据输入视频，自动构建提示词，引导模型输出高质量的视频内容描述，适用于视频标注、多模态数据集构建、视频理解等场景。

---

## 🏗️ `__init__` 函数

```python
def __init__(
    self,
    vlm_serving: VLMServingABC,
    prompt_template: Optional[VideoCaptionGeneratorPrompt | DiyVideoPrompt | str] = None
):
    ...
```

## 🧾 `__init__` 参数说明

| 参数名              | 类型                                                              | 默认值    | 说明                                |
| :--------------- | :-------------------------------------------------------------- | :----- | :-------------------------------- |
| `vlm_serving`    | `VLMServingABC`                                                 | -      | VLM模型服务对象，用于调用视觉语言模型生成视频描述       |
| `prompt_template` | `VideoCaptionGeneratorPrompt` \| `DiyVideoPrompt` \| `str` \| `None` | `None` | Prompt模板，默认为"Please describe the video in detail." |

---

## ⚡ `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage,
    input_image_key: str = "image",
    input_video_key: str = "video",
    input_conversation_key: str = "conversation",
    output_key: str = "caption"
):
    ...
```

`run` 是算子主逻辑，执行视频描述生成任务：
读取视频路径 → 构建提示词 → 调用VLM模型 → 生成文本描述 → 写入输出文件。

## 🧾 `run` 参数说明

| 参数名                      | 类型                | 默认值              | 说明              |
| :----------------------- | :---------------- | :--------------- | :-------------- |
| `storage`                | `DataFlowStorage` | -                | Dataflow 数据存储对象 |
| `input_image_key`        | `str`             | `"image"`        | 输入数据中图像字段名      |
| `input_video_key`        | `str`             | `"video"`        | 输入数据中视频字段名      |
| `input_conversation_key` | `str`             | `"conversation"` | 输入数据中对话字段名      |
| `output_key`             | `str`             | `"caption"`      | 模型输出字段名         |

---

## 🧠 示例用法

```python
from dataflow.operators.core_vision import VideoToCaptionGenerator
from dataflow.serving import LocalModelVLMServing_vllm
from dataflow.utils.storage import FileStorage

# Step 1: 启动本地模型服务
vlm_serving = LocalModelVLMServing_vllm(
    hf_model_name_or_path="Qwen/Qwen2.5-VL-7B-Instruct",
    hf_cache_dir="./model_cache",
    vllm_tensor_parallel_size=1,
    vllm_temperature=0.7,
    vllm_top_p=0.9,
    vllm_max_tokens=2048,
    vllm_max_model_len=51200,
    vllm_gpu_memory_utilization=0.9
)

# Step 2: 准备输入数据
storage = FileStorage(
    first_entry_file_name="./sample_data.json",
    cache_path="./cache",
    file_name_prefix="video_caption",
    cache_type="json",
)
storage.step()

# Step 3: 初始化并运行算子
video_caption_generator = VideoToCaptionGenerator(
    vlm_serving=vlm_serving,
)
video_caption_generator.run(
    storage=storage,
    input_video_key="video",
    input_conversation_key="conversation",
    output_key="caption"
)
```

---

## 🧾 默认输出格式（Output Format）

| 字段             | 类型           | 说明          |
| :------------- | :----------- | :---------- |
| `video`        | `List[str]`  | 输入视频路径      |
| `conversation` | `List[Dict]` | 对话历史        |
| `caption`      | `str`        | 模型生成的视频描述文本 |

---

### 📥 示例输入

```json
{"video": ["./test/example_video.mp4"], "conversation": [{"from": "human", "value": ""}]}
```

### 📤 示例输出

```json
{
  "video": ["./test/example_video.mp4"],
  "conversation": [{"from": "human", "value": "Please describe the video in detail."}],
  "caption": "This video shows a person walking in a park on a sunny day. The person is wearing casual clothes and appears to be enjoying the outdoor scenery."
}
```

---

## 🎯 自定义 Prompt

默认prompt为："Please describe the video in detail."

如需自定义，可以使用以下方式：

### 方式1：使用字符串

```python
video_caption_generator = VideoToCaptionGenerator(
    vlm_serving=vlm_serving,
    prompt_template="请详细描述这个视频的内容、场景和主要活动。"
)
```

### 方式2：使用自定义Prompt类

```python
from dataflow.prompts.video import DiyVideoPrompt

custom_prompt = DiyVideoPrompt(
    "Describe the video focusing on: {aspect}"
)

video_caption_generator = VideoToCaptionGenerator(
    vlm_serving=vlm_serving,
    prompt_template=custom_prompt
)
```

---


## 🔗 相关链接

- **代码:** [VideoToCaptionGenerator](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_vision/generate/video_caption_generator.py)
- **测试脚本:** [test_video_caption.py](https://github.com/OpenDCAI/DataFlow-MM/blob/main/test/test_video_caption.py)
