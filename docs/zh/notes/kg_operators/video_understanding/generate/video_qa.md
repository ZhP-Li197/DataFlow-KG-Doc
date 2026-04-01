---
title: 视频问答生成（VideoCaptionToQAGenerator）
createTime: 2025/12/20 11:30:00
permalink: /zh/mm_operators/video_understanding/generate/video_qa/
---

## 📘 概述

`VideoCaptionToQAGenerator` 是一个用于 **基于视频字幕自动生成问答对（Video QA）** 的算子。  
它会根据输入的视频字幕（caption），自动构建提示词，引导模型生成与视频内容相关的问题和答案，适用于视频问答数据集构建、视频理解评测、多模态对话系统等场景。

---

## 🏗️ `__init__` 函数

```python
def __init__(
    self,
    vlm_serving: VLMServingABC,
    prompt_template: Optional[VideoQAGeneratorPrompt | DiyVideoPrompt | str] = None,
    use_video_input: bool = True,
):
    ...
```

## 🧾 `__init__` 参数说明

| 参数名              | 类型                                                              | 默认值    | 说明                                            |
| :--------------- | :-------------------------------------------------------------- | :----- | :-------------------------------------------- |
| `vlm_serving`    | `VLMServingABC`                                                 | -      | VLM模型服务对象，用于调用视觉语言模型生成问答                      |
| `prompt_template` | `VideoQAGeneratorPrompt` \| `DiyVideoPrompt` \| `str` \| `None` | `None` | Prompt模板，默认使用 `VideoQAGeneratorPrompt`       |
| `use_video_input` | `bool`                                                          | `True` | 是否使用视频作为输入（False时仅使用字幕文本，不输入视频到模型，适用于纯文本QA） |

---

## ⚡ `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage,
    input_image_key: str = None,
    input_video_key: str = None,
    input_conversation_key: str = "conversation",
    output_key: str = "answer",
):
    ...
```

`run` 是算子主逻辑，执行视频问答生成任务：
读取字幕文本 → 构建QA生成提示词 → 调用VLM模型 → 生成问答对 → 写入输出文件。

## 🧾 `run` 参数说明

| 参数名                      | 类型                | 默认值              | 说明                              |
| :----------------------- | :---------------- | :--------------- | :------------------------------ |
| `storage`                | `DataFlowStorage` | -                | Dataflow 数据存储对象                 |
| `input_image_key`        | `str`             | `None`           | 输入数据中图像字段名（可选）                  |
| `input_video_key`        | `str`             | `None`           | 输入数据中视频字段名（可选）                  |
| `input_conversation_key` | `str`             | `"conversation"` | 输入数据中对话字段名                      |
| `output_key`             | `str`             | `"answer"`       | 模型生成的问答结果字段名                    |

---

## 🧠 示例用法

```python
from dataflow.operators.core_vision import VideoCaptionToQAGenerator
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

# Step 2: 准备输入数据（必须包含caption字段）
storage = FileStorage(
    first_entry_file_name="./video_captions.json",
    cache_path="./cache",
    file_name_prefix="video_qa",
    cache_type="json",
)
storage.step()

# Step 3: 初始化并运行算子
qa_generator = VideoCaptionToQAGenerator(
    vlm_serving=vlm_serving,
    use_video_input=True,  # 使用视频输入
)
qa_generator.run(
    storage=storage,
    input_video_key="video",
    input_conversation_key="conversation",
    output_key="answer"
)
```

---

## 🧾 输入格式要求（Input Format）

| 字段             | 类型           | 说明                    |
| :------------- | :----------- | :-------------------- |
| `caption`      | `str`        | 视频字幕文本（必需）            |
| `video`        | `List[str]`  | 视频文件路径列表（当使用视频输入时）    |
| `image`        | `List[str]`  | 图像文件路径列表（可选）          |
| `conversation` | `List[Dict]` | 对话历史（可选，会被自动创建或更新）    |

---

### 📥 示例输入

```json
{
  "caption": "A person is walking in a park on a sunny day. They are wearing casual clothes and appear to be enjoying the outdoor scenery.",
  "video": ["./test/example_video.mp4"],
  "conversation": [{"from": "human", "value": ""}]
}
```

### 📤 示例输出

```json
{
  "caption": "A person is walking in a park on a sunny day. They are wearing casual clothes and appear to be enjoying the outdoor scenery.",
  "video": ["./test/example_video.mp4"],
  "conversation": [
    {
      "from": "human",
      "value": "Based on this caption: 'A person is walking in a park on a sunny day. They are wearing casual clothes and appear to be enjoying the outdoor scenery.', please generate relevant questions and answers about the video."
    }
  ],
  "answer": "Q1: What is the person doing in the video?\nA1: The person is walking in a park.\n\nQ2: What is the weather like in the video?\nA2: It is a sunny day.\n\nQ3: What is the person wearing?\nA3: The person is wearing casual clothes."
}
```

---

## 🎨 自定义 Prompt

默认 prompt 格式为：
```
Based on this caption: '{caption}', please generate relevant questions and answers about the video.
```

### 方式1：使用字符串

```python
qa_generator = VideoCaptionToQAGenerator(
    vlm_serving=vlm_serving,
    prompt_template="根据以下字幕内容：'{caption}'，请生成3个与视频相关的问答对。"
)
```

### 方式2：使用自定义Prompt类

```python
from dataflow.prompts.video import DiyVideoPrompt

custom_prompt = DiyVideoPrompt(
    "Caption: {caption}\n\nGenerate 5 QA pairs in the format:\nQ: ...\nA: ..."
)

qa_generator = VideoCaptionToQAGenerator(
    vlm_serving=vlm_serving,
    prompt_template=custom_prompt
)
```

---

## 🔄 典型工作流

```python
from dataflow.operators.core_vision import (
    VideoToCaptionGenerator,     # Step 1: 生成视频字幕
    VideoCaptionToQAGenerator    # Step 2: 基于字幕生成QA
)

# Step 1: 为视频生成字幕
caption_generator = VideoToCaptionGenerator(vlm_serving=vlm_serving)
caption_generator.run(storage.step())

# Step 2: 基于字幕生成QA
qa_generator = VideoCaptionToQAGenerator(
    vlm_serving=vlm_serving,
    use_video_input=True,  # True: 使用视频和字幕；False: 仅使用字幕
)
qa_generator.run(storage.step())
```

---

## 🧾 默认输出格式（Output Format）

| 字段             | 类型           | 说明           |
| :------------- | :----------- | :----------- |
| `caption`      | `str`        | 输入的视频字幕      |
| `video`        | `List[str]`  | 视频文件路径       |
| `conversation` | `List[Dict]` | 更新后的对话历史     |
| `answer`       | `str`        | 模型生成的问答对文本   |

---

## 🔗 相关链接

- **代码:** [VideoCaptionToQAGenerator](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_vision/generate/video_qa_generator.py)
- **相关算子:**
  - [VideoToCaptionGenerator](./video_caption.md) - 视频描述生成
  - [VideoMergedCaptionGenerator](./video_merged_caption.md) - 视频合并字幕生成
  - [VideoCOTQAGenerator](./video_cotqa.md) - 视频链式思考问答生成

