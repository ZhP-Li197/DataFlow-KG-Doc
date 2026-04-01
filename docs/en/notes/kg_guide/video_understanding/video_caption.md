---
title: Video Caption Pipeline
createTime: 2025/07/16 14:50:59
permalink: /en/mm_guide/video_caption_pipeline/
icon: material-symbols-light:interpreter-mode
---

# Video Caption Generation Pipeline

## 1. Overview

The **Video Caption Generation Pipeline** leverages Vision-Language Models (VLM) to automatically generate high-quality descriptive text for videos, suitable for video annotation, multimodal dataset construction, and video understanding tasks.

We support the following use cases:

- Automatic video content annotation and caption generation
- Multimodal training dataset construction
- Video understanding and analysis tasks

The main stages of the pipeline include:

1. **Data Loading**: Read video files and conversation format data.
2. **Video Understanding**: Analyze video content using VLM models.
3. **Caption Generation**: Generate detailed text descriptions based on video content.

---

## 2. Quick Start

### Step 1: Create a new DataFlow workspace
```bash
mkdir run_dataflow_mm
cd run_dataflow_mm
```

### Step 2: Initialize DataFlow-MM
```bash
dataflow init
```
You will see:
```bash
run_dataflow_mm/pipelines/gpu_pipelines/video_caption_pipeline.py  
```

### Step 3: Configure model path

In `video_caption_pipeline.py`, configure the VLM model path:

```python
self.vlm_serving = LocalModelVLMServing_vllm(
    hf_model_name_or_path="Qwen/Qwen2.5-VL-7B-Instruct",  # Modify to your model path
    hf_cache_dir="./dataflow_cache",
    vllm_tensor_parallel_size=1,
    vllm_temperature=0.7,
    vllm_top_p=0.9,
    vllm_max_tokens=2048,
    vllm_max_model_len=51200,
    vllm_gpu_memory_utilization=0.9
)
```

### Step 4: One-click run
```bash
python pipelines/gpu_pipelines/video_caption_pipeline.py
```

You can also run any other pipeline script as needed; the process is similar. Below we introduce the operators used in the pipeline and how to configure them.

---

## 3. Data Flow and Pipeline Logic

### 1. **Input Data**

The pipeline input includes the following fields:

* **video**: List of video file paths, e.g., `["path/to/video.mp4"]`
* **conversation**: Conversation format data, e.g., `[{"from": "human", "value": ""}]`
* **image** (optional): List of image file paths for processing images simultaneously

Inputs can be stored in designated files (such as `json` or `jsonl`) and managed and read via the `FileStorage` object. In the provided example, the default data path is loaded; in practice, you can modify the path to load custom data and cache paths:

```python
self.storage = FileStorage(
    first_entry_file_name="./dataflow/example/video_caption/sample_data.json",
    cache_path="./cache",
    file_name_prefix="video_caption",
    cache_type="json",
)
```

**Input Data Example**:

```json
[
    {
        "video": ["./videos/sample1.mp4"],
        "conversation": [{"from": "human", "value": ""}]
    },
    {
        "video": ["./videos/sample2.mp4"],
        "conversation": [{"from": "human", "value": ""}]
    }
]
```

### 2. **Video Caption Generation (VideoToCaptionGenerator)**

The core step of the pipeline is to use the **Video Caption Generator** (`VideoToCaptionGenerator`) to generate detailed text descriptions for each video.

**Functionality:**

* Analyze video content using VLM models and generate descriptive text
* Support custom description styles and prompts
* Configurable generation parameters (temperature, top_p, etc.)

**Input:** Video file paths and conversation format data  
**Output:** Generated video caption text

**Model Service Configuration**:

```python
self.vlm_serving = LocalModelVLMServing_vllm(
    hf_model_name_or_path="Qwen/Qwen2.5-VL-7B-Instruct",
    hf_cache_dir="./dataflow_cache",
    vllm_tensor_parallel_size=1,          # Set to 1 for single GPU, or number of GPUs
    vllm_temperature=0.7,                 # Generation temperature, controls randomness
    vllm_top_p=0.9,                       # Top-p sampling parameter
    vllm_max_tokens=2048,                 # Maximum generation tokens
    vllm_max_model_len=51200,             # Maximum model context length
    vllm_gpu_memory_utilization=0.9       # GPU memory utilization
)
```

**Operator Initialization**:

```python
self.video_to_caption_generator = VideoToCaptionGenerator(
    vlm_serving=self.vlm_serving,
)
```

**Operator Run**:

```python
self.video_to_caption_generator.run(
    storage=self.storage.step(),
    input_image_key="image",              # Input image field (optional)
    input_video_key="video",              # Input video field
    input_conversation_key="conversation", # Input conversation field
    output_key="caption",                 # Output caption field
)
```

### 3. **Output Data**

The final output includes:

* **video**: Original video path
* **conversation**: Updated conversation data (including generated prompts)
* **caption**: Generated video caption text

**Output Data Example**:

```json
{
    "video": ["./videos/sample1.mp4"],
    "conversation": [{"from": "human", "value": "Please describe the video in detail."}],
    "caption": "This video shows a person walking in a park on a sunny day. The weather is clear and bright, with trees and benches visible in the background. The person is wearing casual clothes and walking at a leisurely pace, seemingly enjoying a peaceful outdoor moment."
}
```

---

## 4. Pipeline Example

An example pipeline demonstrating how to use VideoToCaptionGenerator for video caption generation:

```python
from dataflow.operators.core_vision import VideoToCaptionGenerator
from dataflow.serving import LocalModelVLMServing_vllm
from dataflow.utils.storage import FileStorage

class VideoCaptionGenerator():
    def __init__(self):
        # -------- Storage Configuration --------
        self.storage = FileStorage(
            first_entry_file_name="./dataflow/example/video_caption/sample_data.json",
            cache_path="./cache",
            file_name_prefix="video_caption",
            cache_type="json",
        )
        self.model_cache_dir = './dataflow_cache'

        # -------- VLM Model Service --------
        self.vlm_serving = LocalModelVLMServing_vllm(
            hf_model_name_or_path="Qwen/Qwen2.5-VL-7B-Instruct",
            hf_cache_dir=self.model_cache_dir,
            vllm_tensor_parallel_size=1,
            vllm_temperature=0.7,
            vllm_top_p=0.9, 
            vllm_max_tokens=2048,
            vllm_max_model_len=51200,  
            vllm_gpu_memory_utilization=0.9
        )

        # -------- Video Caption Generator Operator --------
        self.video_to_caption_generator = VideoToCaptionGenerator(
            vlm_serving = self.vlm_serving,
        )

    def forward(self):
        self.video_to_caption_generator.run(
            storage = self.storage.step(),
            input_image_key="image",
            input_video_key="video",
            input_conversation_key="conversation",
            output_key="caption",
        )

if __name__ == "__main__":
    # Pipeline entry point
    model = VideoCaptionGenerator()
    model.forward()
```
