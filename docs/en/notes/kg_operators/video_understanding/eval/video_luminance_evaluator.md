---
title: Video Luminance Evaluator (VideoLuminanceEvaluator)
createTime: 2025/01/20 11:00:00
permalink: /en/mm_operators/video_understanding/eval/video_luminance_evaluator/
---

## 📘 Overview

`VideoLuminanceEvaluator` is a **video luminance evaluation operator** that analyzes luminance statistics of video clips. It reads upstream extracted video frames, calculates mean, min, and max luminance for each clip, and writes the statistics back into the `video_clips` field.

---

## 🏗️ `__init__` Function

```python
def __init__(
    self,
    figure_root: str = "extract_frames",
    input_video_key: str = "video",
    video_clips_key: str = "video_clips",
    load_num: int = 3,
    batch_size: int = 64,
    num_workers: int = 4,
    init_distributed: bool = False,
    output_key: str = "video_clips"
):
    ...
```

## 🧾 `__init__` Parameters

| Parameter          | Type   | Default            | Description                           |
| :----------------- | :----- | :----------------- | :------------------------------------ |
| `figure_root`      | `str`  | `"extract_frames"` | Root directory for extracted frames   |
| `input_video_key`  | `str`  | `"video"`          | Field name for video path             |
| `video_clips_key`  | `str`  | `"video_clips"`    | Field name for video clips            |
| `load_num`         | `int`  | `3`                | Number of frames per clip to load     |
| `batch_size`       | `int`  | `64`               | Batch size for processing             |
| `num_workers`      | `int`  | `4`                | Number of data loading workers        |
| `init_distributed` | `bool` | `False`            | Whether to initialize distributed training |
| `output_key`       | `str`  | `"video_clips"`    | Output field name (updated clips)     |

---

## 🧠 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import VideoLuminanceEvaluator

storage = FileStorage(
    first_entry_file_name="data/video_luminance_input.jsonl",
    cache_path="./cache_local",
    file_name_prefix="video_luminance",
    cache_type="jsonl"
)

evaluator = VideoLuminanceEvaluator(
    figure_root="./cache/extract_frames",
    load_num=3,
    batch_size=64
)

evaluator.run(storage=storage.step())
```

---

### 🧾 Default Output Format

**Modified Field:**
- `video_clips` (dict): Updated video clips dictionary, adds luminance statistics to each clip

**New Fields in Each Clip:**

| Field             | Type    | Description                             |
| :---------------- | :------ | :-------------------------------------- |
| `luminance_mean`  | `float` | Mean luminance (0-255, ITU-R BT.709)    |
| `luminance_min`   | `float` | Minimum luminance (frame average min)   |
| `luminance_max`   | `float` | Maximum luminance (frame average max)   |

---

## 🔗 Related Links

- **Code:** [VideoLuminanceEvaluator](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_vision/eval/video_luminance_evaluator.py)
