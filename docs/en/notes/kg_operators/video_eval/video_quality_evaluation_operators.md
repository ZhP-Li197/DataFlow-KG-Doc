---
title: Video Quality Evaluation Operators
createTime: 2025/10/14 14:03:04
permalink: /en/mm_operators/dj8ckq0x/
---
# Video Quality Evaluation Operators

## Overview

Video quality evaluation operators are designed for content quality assessment and alignment analysis in downstream tasks such as video understanding, video generation, and multimodal learning. The main components include: **EMScoreEval** and **VideoAudioSimilarity**. These operators enable precise evaluation of video data from multiple dimensions including text alignment and audio-visual consistency, quantifying quality metrics into an interpretable, configurable, and extensible evaluation system to provide comprehensive support for building high-quality video datasets.

**Video Quality Evaluation Operators:**

| Name                 | Type                        | Description                                                  | Official Repository or Paper                  |
| -------------------- | --------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| EMScoreEval          | Video Quality Assessment    | Frame-level EMScore evaluation operator. Extracts frames from videos using specified strategies (every N seconds or every N frames), and uses CLIP models to compute multi-dimensional similarity scores between candidate text, reference text, and video frames, including metrics such as fine-grained precision/recall and global consistency. | [EMScore](https://github.com/ShiYaya/emscore) |
| VideoAudioSimilarity | Video Assessment            | Video-audio similarity evaluation operator. Uses CLIP models to compute cosine similarity between video frame images and audio description text, supporting multiple frame sampling methods (keyframes/uniform sampling) and image flip augmentation. | -                                             |

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

### 1. EMScoreEval (EM Score Evaluation Operator)

**Function Description:** EMScoreEval is a professional multimodal evaluation tool that supports extracting frame-level features from video content and performing precise alignment scoring with text. Based on the CLIP vision-language model, this operator implements multi-dimensional similarity computation between candidate text, reference text, and video frames.

**Code:** [EMScoreEval](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_vision/eval/emscore_evaluator.py)

**Input Parameters:**

- `__init__()`
  - `every_n_seconds`: Extract one frame every N seconds (mutually exclusive with every_n_frames)
  - `every_n_frames`: Extract one frame every N frames (mutually exclusive with every_n_seconds)
  - `return_all_frames`: Whether to return detailed scores for each frame (default: False)
  - `clip_model_path`: CLIP model path (optional)
  - `score_types`: List of score types (optional, default: all)
  - `metrics`: List of output metrics (optional, default: all)
- `run()`
  - `storage`: DataFlow storage interface object (required)
  - `video_key`: Video path field name (default: "video_path")
  - `candidate_key`: Candidate text field name (default: "candidate")
  - `reference_key`: Reference text field name (default: "reference")

**Key Features:**

- Multi-dimensional scoring: Supports three modes - text vs text, text vs video, and comprehensive scoring
- Seven metric types: Precision/recall/F1/global consistency, etc.
- Flexible sampling: Supports time-based or frame-based sampling strategies

**Usage Example:**

```python
self.emscore_evaluator = EMScoreEval(
    every_n_seconds=2.0,
    return_all_frames=False,
)
self.emscore_evaluator.run(
    storage=self.storage.step(),
    video_key="video_path",
    candidate_key="generated_caption",
    reference_key="ground_truth",
)
```

---

### 2. VideoAudioSimilarity (Video-Audio Similarity Evaluation Operator)

**Function Description:** VideoAudioSimilarity is a cross-modal matching analysis tool that supports semantic consistency evaluation between video frames and audio content. The operator integrates CLIP multimodal encoders to perform video keyframe extraction, audio feature encoding, and cross-modal similarity computation.

**Code:** [VideoAudioSimilarity](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_audio/eval/video_audio_similarity_evaluator.py)

**Input Parameters:**

- `__init__()`
  - `hf_clip`: CLIP model name (default: "openai/clip-vit-base-patch32")
  - `min_score`: Minimum similarity score (default: 0.0)
  - `max_score`: Maximum similarity score (default: 1.0)
  - `frame_sampling_method`: Frame sampling method (default: "uniform")
  - `frame_num`: Number of uniformly sampled frames (default: 3)
  - `reduce_mode`: Aggregation method (default: "avg")
- `run()`
  - `storage`: DataFlow storage interface object (required)
  - `video_key`: Video path field name (default: "video_path")
  - `audio_key`: Audio path field name (default: "audio_path")

**Key Features:**

- Multiple frame sampling: Keyframe detection or uniform sampling
- Cross-modal evaluation: Semantic matching computation between video and audio
- Flexible aggregation: Supports average/maximum/minimum values

**Usage Example:**

```python
self.video_audio_similarity = VideoAudioSimilarity(
    frame_sampling_method="uniform",
    frame_num=5,
    reduce_mode="avg",
)
self.video_audio_similarity.run(
    storage=self.storage.step(),
    video_key="video_path",
    audio_key="audio_path",
)
```
