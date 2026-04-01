---
title: Video Filtering Operators
createTime: 2025/10/14 14:03:48
permalink: /en/mm_operators/6shz5igy/
---
# Video Filtering Operators

## Overview

Video filtering operators are designed for dataset quality control and content screening in downstream tasks such as video understanding, video generation, and multimodal learning. The main components include: **VideoResolutionFilter** and **VideoMotionScoreFilter**. These operators enable precise filtering of video data from dimensions such as spatial resolution and motion intensity, ensuring high-quality video data for model training.

**Video Filtering Operators:**

| Name                   | Type            | Description                                                  | Official Repository or Paper |
| ---------------------- | --------------- | ------------------------------------------------------------ | ---------------------------- |
| VideoResolutionFilter  | Video Filtering | Filters samples based on video width and height, retaining videos with resolutions within specified ranges. Supports setting minimum/maximum width and height thresholds. | -                            |
| VideoMotionScoreFilter | Video Filtering | Computes video motion scores (optical flow magnitude mean) using the Farneback optical flow algorithm, retaining samples with motion scores within specified ranges. Supports frame size adjustment, relative normalization, and configurable sampling frame rate. | -                            |

## Operator Interface Usage

For operators that specify storage paths or call models, we provide encapsulated **model interfaces**, **storage object interfaces**, and **database management interfaces** that allow pre-definition of required configurations.

### Model Interface Configuration

You can pre-define model API parameters for operators using the following methods, including generative models and embedding models:

```python
from dataflow.llmserving import APILLMServing_request

api_llm_serving = APILLMServing_request(
    api_url="https://api.openai.com/v1/chat/completions",
    model_name="gpt-4o",
    max_workers=100
)
```

You can define a local LLM service interface as follows:

```python
from dataflow.llmserving import LocalModelLLMServing

local_llm_serving = LocalModelLLMServing_vllm(
    hf_model_name_or_path="/path/to/your/model",
    vllm_max_tokens=1024,
    vllm_tensor_parallel_size=4,
    vllm_gpu_memory_utilization=0.6,
    vllm_repetition_penalty=1.2
)
```

You can pre-define storage interfaces for operators as follows:

```python
from dataflow.utils.storage import FileStorage

self.storage = FileStorage(
    first_entry_file_name="your_file_path",
    cache_path="./cache",
    file_name_prefix="dataflow_cache_step",
    cache_type="jsonl", # jsonl, json, ...
)
```

For each operator, detailed usage and parameter lists are provided below.

## Detailed Operator Documentation

### 1. VideoResolutionFilter (Video Resolution Filtering Operator)

**Function Description:** VideoResolutionFilter is an efficient video spatial dimension filtering tool that supports precise quality control based on video resolution. The operator uses the OpenCV video processing engine to directly read video metadata, enabling fast detection and range determination of video width and height.

**Code:** [VideoResolutionFilter](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_vision/filter/video_resolution_filter.py)

**Input Parameters:**

- `__init__()`
  - `min_width`: Minimum width (default: 1)
  - `max_width`: Maximum width (default: sys.maxsize)
  - `min_height`: Minimum height (default: 1)
  - `max_height`: Maximum height (default: sys.maxsize)
  - `any_or_all`: Multi-video retention strategy (default: "any")
- `run()`
  - `storage`: DataFlow storage interface object (required)
  - `video_key`: Video path field name (default: "video_path")

**Key Features:**

- Precise resolution detection: Fast video width and height retrieval using OpenCV
- Flexible filtering strategy: Independent range settings for width and height
- Automatic error handling: Returns -1 marker for invalid videos

**Usage Example:**

```python
self.video_resolution_filter = VideoResolutionFilter(
    min_width=720,
    max_width=3840,
    min_height=480,
    max_height=2160,
)
self.video_resolution_filter.run(
    storage=self.storage.step(),
    video_key="video_path",
)
```

---

### 2. VideoMotionScoreFilter (Video Motion Score Filtering Operator)

**Function Description:** VideoMotionScoreFilter is an optical flow analysis-based video dynamic characteristic evaluation tool that supports filtering video samples by motion intensity. The operator employs the Farneback dense optical flow algorithm to compute pixel-level motion vectors between adjacent frames.

**Code:** [VideoMotionScoreFilter](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_vision/filter/video_motion_score_filter.py)

**Input Parameters:**

- `__init__()`
  - `min_score`: Minimum motion score (default: 0.25)
  - `max_score`: Maximum motion score (default: sys.float_info.max)
  - `sampling_fps`: Sampling frame rate (default: 2.0 frames/second)
  - `size`: Frame size adjustment before processing (optional)
  - `relative`: Whether to normalize (default: False)
- `run()`
  - `storage`: DataFlow storage interface object (required)
  - `video_key`: Video path field name (default: "video_path")

**Key Features:**

- Optical flow computation: Dense optical flow analysis using Farneback algorithm
- Flexible sampling: Configurable sampling frame rate
- Normalization option: Supports relative normalization

**Usage Example:**

```python
self.video_motion_filter = VideoMotionScoreFilter(
    min_score=2.0,
    max_score=14.0,
    sampling_fps=2.0,
)
self.video_motion_filter.run(
    storage=self.storage.step(),
    video_key="video_path",
)
```
