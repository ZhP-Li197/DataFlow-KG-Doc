---
title: Video Aesthetic Evaluator (VideoAestheticEvaluator)
createTime: 2025/01/20 11:00:00
permalink: /en/mm_operators/video_understanding/eval/video_aesthetic_evaluator/
---

## 📘 Overview

`VideoAestheticEvaluator` is a **video aesthetic evaluation operator** that uses CLIP encoder + MLP regression head to score video clips. It reads upstream extracted video frames, calculates aesthetic scores for each clip, and writes the scores back into the `video_clips` field.

---

## 🏗️ `__init__` Function

```python
def __init__(
    self,
    figure_root: str = "extract_frames",
    input_video_key: str = "video",
    video_clips_key: str = "video_clips",
    clip_model: str = "ViT-L/14",
    mlp_checkpoint: Optional[str] = None,
    load_num: int = 3,
    batch_size: int = 64,
    num_workers: int = 4,
    init_distributed: bool = False,
    output_key: str = "video_clips"
):
    ...
```

## 🧾 `__init__` Parameters

| Parameter          | Type            | Default              | Description                           |
| :----------------- | :-------------- | :------------------- | :------------------------------------ |
| `figure_root`      | `str`           | `"extract_frames"`   | Root directory for extracted frames   |
| `input_video_key`  | `str`           | `"video"`            | Field name for video path             |
| `video_clips_key`  | `str`           | `"video_clips"`      | Field name for video clips            |
| `clip_model`       | `str`           | `"ViT-L/14"`         | CLIP model name or path               |
| `mlp_checkpoint`   | `Optional[str]` | `None`               | MLP regression head weights path      |
| `load_num`         | `int`           | `3`                  | Number of frames per clip to load     |
| `batch_size`       | `int`           | `64`                 | Batch size for processing             |
| `num_workers`      | `int`           | `4`                  | Number of data loading workers        |
| `init_distributed` | `bool`          | `False`              | Whether to initialize distributed training |
| `output_key`       | `str`           | `"video_clips"`      | Output field name (updated clips)     |

---

## ⚡ `run` Function

All parameters are optional and override initialization parameters.

---

## 🧠 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import VideoAestheticEvaluator

storage = FileStorage(
    first_entry_file_name="data/video_aesthetic_input.jsonl",
    cache_path="./cache_local",
    file_name_prefix="video_aesthetic",
    cache_type="jsonl"
)

evaluator = VideoAestheticEvaluator(
    figure_root="./cache/extract_frames",
    clip_model="/path/to/ViT-L-14.pt",
    mlp_checkpoint="/path/to/sac+logos+ava1-l14-linearMSE.pth",
    load_num=3,
    batch_size=64
)

evaluator.run(storage=storage.step())
```

---

### 🧾 Default Output Format

**Modified Field:**
- `video_clips` (dict): Updated video clips dictionary, adds `aesthetic_score` to each clip

**New Field in Each Clip:**

| Field              | Type    | Description                             |
| :----------------- | :------ | :-------------------------------------- |
| `aesthetic_score`  | `float` | Aesthetic score (higher means better quality) |

---

## 🔗 Related Links

- **Code:** [VideoAestheticEvaluator](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_vision/eval/video_aesthetic_evaluator.py)
