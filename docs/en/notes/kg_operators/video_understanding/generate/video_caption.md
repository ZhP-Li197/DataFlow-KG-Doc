---
title: Video Caption Generation (VideoToCaptionGenerator)
createTime: 2025/07/16 14:50:59
permalink: /en/mm_operators/video_understanding/generate/video_caption/
---

## 📘 Overview

`VideoToCaptionGenerator` is an operator for **automatically generating video captions using Vision-Language Models (VLM)** .  
It analyzes input videos and generates high-quality descriptive text through prompt-based guidance, suitable for video annotation, multimodal dataset construction, and video understanding tasks.

---

## 🏗️ `__init__` Function

```python
def __init__(
    self,
    vlm_serving: VLMServingABC,
    prompt_template: Optional[VideoCaptionGeneratorPrompt | DiyVideoPrompt | str] = None
):
    ...
```

## 🧾 `__init__` Parameters

| Parameter         | Type                                                              | Default | Description                                                  |
| :---------------- | :-------------------------------------------------------------- | :------ | :----------------------------------------------------------- |
| `vlm_serving`     | `VLMServingABC`                                                 | -       | VLM model serving instance for generating video captions     |
| `prompt_template` | `VideoCaptionGeneratorPrompt` \| `DiyVideoPrompt` \| `str` \| `None` | `None`  | Prompt template, defaults to "Please describe the video in detail." |

---

## ⚡ `run` Function

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

`run` is the main logic for executing video caption generation:
Read video paths → Build prompts → Call VLM model → Generate text descriptions → Write to output.

## 🧾 `run` Parameters

| Parameter                | Type              | Default          | Description                       |
| :----------------------- | :---------------- | :--------------- | :-------------------------------- |
| `storage`                | `DataFlowStorage` | -                | DataFlow storage object           |
| `input_image_key`        | `str`             | `"image"`        | Field name for images in input    |
| `input_video_key`        | `str`             | `"video"`        | Field name for videos in input    |
| `input_conversation_key` | `str`             | `"conversation"` | Field name for conversations      |
| `output_key`             | `str`             | `"caption"`      | Field name for model output       |

---

## 🧠 Example Usage

```python
from dataflow.operators.core_vision import VideoToCaptionGenerator
from dataflow.serving import LocalModelVLMServing_vllm
from dataflow.utils.storage import FileStorage

# Step 1: Initialize VLM service
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

# Step 2: Prepare input data
storage = FileStorage(
    first_entry_file_name="./sample_data.json",
    cache_path="./cache",
    file_name_prefix="video_caption",
    cache_type="json",
)
storage.step()

# Step 3: Initialize and run operator
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

## 🧾 Default Output Format

| Field          | Type         | Description                |
| :------------- | :----------- | :------------------------- |
| `video`        | `List[str]`  | Input video path           |
| `conversation` | `List[Dict]` | Conversation history       |
| `caption`      | `str`        | Generated video caption    |

---

### 📥 Example Input

```json
{"video": ["./test/example_video.mp4"], "conversation": [{"from": "human", "value": ""}]}
```

### 📤 Example Output

```json
{
  "video": ["./test/example_video.mp4"],
  "conversation": [{"from": "human", "value": "Please describe the video in detail."}],
  "caption": "This video shows a person walking in a park on a sunny day. The person is wearing casual clothes and appears to be enjoying the outdoor scenery."
}
```

---

## 🎯 Custom Prompts

Default prompt: "Please describe the video in detail."

To customize, use one of the following approaches:

### Method 1: Using a String

```python
video_caption_generator = VideoToCaptionGenerator(
    vlm_serving=vlm_serving,
    prompt_template="Describe the video content, scenes and main activities in detail."
)
```

### Method 2: Using a Custom Prompt Class

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


## 🔗 Related Links

- **Code:** [VideoToCaptionGenerator](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_vision/generate/video_caption_generator.py)
- **Test Script:** [test_video_caption.py](https://github.com/OpenDCAI/DataFlow-MM/blob/main/test/test_video_caption.py)
