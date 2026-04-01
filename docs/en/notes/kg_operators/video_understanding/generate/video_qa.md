---
title: Video QA Generation (VideoCaptionToQAGenerator)
createTime: 2025/12/20 11:30:00
permalink: /en/mm_operators/video_understanding/generate/video_qa/
---

## 📘 Overview

`VideoCaptionToQAGenerator` is an operator for **automatically generating question-answer pairs (Video QA) based on video captions** .  
It automatically constructs prompts based on input video captions and guides the model to generate questions and answers related to the video content. Suitable for video QA dataset construction, video understanding evaluation, multimodal dialogue systems, and more.

---

## 🏗️ `__init__` Function

```python
def __init__(
    self,
    vlm_serving: VLMServingABC,
    prompt_template: Optional[VideoQAGeneratorPrompt | DiyVideoPrompt | str] = None,
    use_video_input: bool = True,
):
    ...
```

## 🧾 `__init__` Parameters

| Parameter         | Type                                                              | Default | Description                                                         |
| :---------------- | :--------------------------------------------------------------- | :------ | :------------------------------------------------------------------ |
| `vlm_serving`     | `VLMServingABC`                                                  | -       | VLM model serving for generating QA                                 |
| `prompt_template` | `VideoQAGeneratorPrompt` \| `DiyVideoPrompt` \| `str` \| `None` | `None`  | Prompt template, defaults to `VideoQAGeneratorPrompt`               |
| `use_video_input` | `bool`                                                           | `True`  | Whether to use video as input (False for text-only QA without video to model) |

---

## ⚡ `run` Function

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

`run` is the main logic for video QA generation:
Read caption text → Build QA generation prompt → Call VLM model → Generate QA pairs → Write to output.

## 🧾 `run` Parameters

| Parameter                | Type              | Default          | Description                          |
| :----------------------- | :---------------- | :--------------- | :----------------------------------- |
| `storage`                | `DataFlowStorage` | -                | DataFlow storage object              |
| `input_image_key`        | `str`             | `None`           | Field name for images in input (optional) |
| `input_video_key`        | `str`             | `None`           | Field name for videos in input (optional) |
| `input_conversation_key` | `str`             | `"conversation"` | Field name for conversations in input |
| `output_key`             | `str`             | `"answer"`       | Field name for generated QA output   |

---

## 🧠 Example Usage

```python
from dataflow.operators.core_vision import VideoCaptionToQAGenerator
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

# Step 2: Prepare input data (must contain caption field)
storage = FileStorage(
    first_entry_file_name="./video_captions.json",
    cache_path="./cache",
    file_name_prefix="video_qa",
    cache_type="json",
)
storage.step()

# Step 3: Initialize and run operator
qa_generator = VideoCaptionToQAGenerator(
    vlm_serving=vlm_serving,
    use_video_input=True,  # Use video input
)
qa_generator.run(
    storage=storage,
    input_video_key="video",
    input_conversation_key="conversation",
    output_key="answer"
)
```

---

## 🧾 Input Format Requirements

| Field          | Type         | Description                                  |
| :------------- | :----------- | :------------------------------------------- |
| `caption`      | `str`        | Video caption text (required)                |
| `video`        | `List[str]`  | Video file path list (when using video input) |
| `image`        | `List[str]`  | Image file path list (optional)              |
| `conversation` | `List[Dict]` | Conversation history (optional, auto-created/updated) |

---

### 📥 Example Input

```json
{
  "caption": "A person is walking in a park on a sunny day. They are wearing casual clothes and appear to be enjoying the outdoor scenery.",
  "video": ["./test/example_video.mp4"],
  "conversation": [{"from": "human", "value": ""}]
}
```

### 📤 Example Output

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

## 🎨 Custom Prompts

Default prompt format:
```
Based on this caption: '{caption}', please generate relevant questions and answers about the video.
```

### Method 1: Using a String

```python
qa_generator = VideoCaptionToQAGenerator(
    vlm_serving=vlm_serving,
    prompt_template="Based on the following caption: '{caption}', please generate 3 QA pairs related to the video."
)
```

### Method 2: Using a Custom Prompt Class

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

## 🔄 Typical Workflow

```python
from dataflow.operators.core_vision import (
    VideoToCaptionGenerator,     # Step 1: Generate video caption
    VideoCaptionToQAGenerator    # Step 2: Generate QA based on caption
)

# Step 1: Generate caption for video
caption_generator = VideoToCaptionGenerator(vlm_serving=vlm_serving)
caption_generator.run(storage.step())

# Step 2: Generate QA based on caption
qa_generator = VideoCaptionToQAGenerator(
    vlm_serving=vlm_serving,
    use_video_input=True,  # True: use video and caption; False: caption only
)
qa_generator.run(storage.step())
```

---

## 🧾 Default Output Format

| Field          | Type         | Description                |
| :------------- | :----------- | :------------------------- |
| `caption`      | `str`        | Input video caption        |
| `video`        | `List[str]`  | Video file path            |
| `conversation` | `List[Dict]` | Updated conversation history |
| `answer`       | `str`        | Generated QA pairs text    |

---

## 🔗 Related Links

- **Code:** [VideoCaptionToQAGenerator](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_vision/generate/video_qa_generator.py)
- **Related Operators:**
  - [VideoToCaptionGenerator](./video_caption.md) - Video Caption Generation
  - [VideoMergedCaptionGenerator](./video_merged_caption.md) - Video Merged Caption Generation
  - [VideoCOTQAGenerator](./video_cotqa.md) - Video Chain-of-Thought QA Generation

