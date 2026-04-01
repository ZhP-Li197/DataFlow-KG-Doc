---
title: Video Score Filter (VideoScoreFilter)
createTime: 2025/01/20 10:00:00
permalink: /en/mm_operators/video_understanding/filter/video_score_filter/
---

## 📘 Overview

`VideoScoreFilter` is a video clip filtering operator based on **multiple quality metrics**. It can filter video clips based on multi-dimensional metrics including frame count, frame rate, resolution, aesthetic score, OCR score, luminance, motion score, optical flow score, and blur score, adding a `filtered` flag to each clip.

---

## 🏗️ `__init__` Function

```python
def __init__(
    self,
    frames_min: int = None,
    frames_max: int = None,
    fps_min: float = None,
    fps_max: float = None,
    resolution_max: int = None,
    aes_min: float = 4,
    ocr_min: float = None,
    ocr_max: float = 0.3,
    lum_min: float = 20,
    lum_max: float = 140,
    motion_min: float = 2,
    motion_max: float = 14,
    flow_min: float = None,
    flow_max: float = None,
    blur_max: float = None,
    strict_mode: bool = False,
    seed: int = 42
):
    ...
```

## 🧾 `__init__` Parameters

| Parameter       | Type     | Default  | Description                                    |
| :-------------- | :------- | :------- | :--------------------------------------------- |
| `frames_min`    | `int`    | `None`   | Minimum number of frames                       |
| `frames_max`    | `int`    | `None`   | Maximum number of frames                       |
| `fps_min`       | `float`  | `None`   | Minimum frame rate                             |
| `fps_max`       | `float`  | `None`   | Maximum frame rate                             |
| `resolution_max`| `int`    | `None`   | Maximum resolution                             |
| `aes_min`       | `float`  | `4`      | Minimum aesthetic score                        |
| `ocr_min`       | `float`  | `None`   | Minimum OCR score                              |
| `ocr_max`       | `float`  | `0.3`    | Maximum OCR score                              |
| `lum_min`       | `float`  | `20`     | Minimum luminance score                        |
| `lum_max`       | `float`  | `140`    | Maximum luminance score                        |
| `motion_min`    | `float`  | `2`      | Minimum motion score                           |
| `motion_max`    | `float`  | `14`     | Maximum motion score                           |
| `flow_min`      | `float`  | `None`   | Minimum optical flow score                     |
| `flow_max`      | `float`  | `None`   | Maximum optical flow score                     |
| `blur_max`      | `float`  | `None`   | Maximum blur score                             |
| `strict_mode`   | `bool`   | `False`  | Strict mode: raises error when field missing, else skip condition |
| `seed`          | `int`    | `42`     | Random seed for reproducibility                |

---

## ⚡ `run` Function

```python
def run(
    self,
    storage: DataFlowStorage,
    input_video_key: str = "video",
    video_clips_key: str = "video_clip",
    output_key: str = "video_clips"
):
    ...
```

Executes the main logic: reads data from storage, applies multi-dimensional quality metric filtering to each video clip, adds `filtered` flag to each clip, and writes back to storage.

## 🧾 `run` Parameters

| Parameter         | Type              | Default          | Description                      |
| :---------------- | :---------------- | :--------------- | :------------------------------- |
| `storage`         | `DataFlowStorage` | -                | DataFlow storage object          |
| `input_video_key` | `str`             | `"video"`        | Field name for video in input    |
| `video_clips_key` | `str`             | `"video_clip"`   | Field name for video clips       |
| `output_key`      | `str`             | `"video_clips"`  | Output field name (updated clips)|

---

## 🧠 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import VideoScoreFilter

# Step 1: Prepare FileStorage (needs video_clip column with clips list)
storage = FileStorage(
    first_entry_file_name="data/video_score_input.jsonl",
    cache_path="./cache_local",
    file_name_prefix="video_score_filter",
    cache_type="jsonl"
)

# Step 2: Initialize operator
filter_op = VideoScoreFilter(
    frames_min=30,
    frames_max=3000,
    fps_min=15.0,
    fps_max=60.0,
    resolution_max=1920*1080,
    aes_min=4.0,
    ocr_max=0.3,
    lum_min=20.0,
    lum_max=140.0,
    motion_min=2.0,
    motion_max=14.0,
    strict_mode=False,
    seed=42
)

# Step 3: Execute filtering
filter_op.run(
    storage=storage.step(),
    input_video_key="video",
    video_clips_key="video_clip",
    output_key="video_clips"
)
```

---

### 🧾 Default Output Format

**Modified Field:**
- `video_clip` (dict): Updated video clip dictionary, adds `filtered` field to each clip

**New Field in Each Clip:**

| Field      | Type   | Description                             |
| :--------- | :----- | :-------------------------------------- |
| `filtered` | `bool` | Whether passed all quality metric filters, True means retain |

Example Input:

```jsonl
{
  "video": ["./test/video1.mp4"],
  "video_clip": {
    "clips": [
      {
        "id": "clip_0",
        "num_frames": 150,
        "fps": 30.0,
        "resolution": 2073600,
        "aesthetic_score": 5.2,
        "ocr_score": 0.1,
        "luminance_mean": 80.0,
        "motion_score": 5.0
      },
      {
        "id": "clip_1",
        "num_frames": 10,
        "fps": 30.0,
        "aesthetic_score": 3.0
      }
    ]
  }
}
```

Example Output:

```jsonl
{
  "video": ["./test/video1.mp4"],
  "video_clip": {
    "clips": [
      {
        "id": "clip_0",
        "num_frames": 150,
        "fps": 30.0,
        "resolution": 2073600,
        "aesthetic_score": 5.2,
        "ocr_score": 0.1,
        "luminance_mean": 80.0,
        "motion_score": 5.0,
        "filtered": true
      },
      {
        "id": "clip_1",
        "num_frames": 10,
        "fps": 30.0,
        "aesthetic_score": 3.0,
        "filtered": false
      }
    ]
  }
}
```

---

## 🔗 Related Links

- **Code:** [VideoScoreFilter](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_vision/filter/video_score_filter.py)

