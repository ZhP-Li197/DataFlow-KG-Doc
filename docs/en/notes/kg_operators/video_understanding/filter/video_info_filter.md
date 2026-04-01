---
title: Video Info Filter (VideoInfoFilter)
createTime: 2025/01/20 10:00:00
permalink: /en/mm_operators/video_understanding/filter/video_info_filter/
---

## 📘 Overview

`VideoInfoFilter` is an operator for **extracting video metadata information**. It can extract basic information from video files, including number of frames, resolution, aspect ratio, frame rate, duration, etc. Supports multiple backends (OpenCV, TorchVision, PyAV) and parallel processing for improved efficiency.

---

## 🏗️ `__init__` Function

```python
def __init__(
    self,
    backend: str = "opencv",
    disable_parallel: bool = False,
    num_workers: int = 16,
    seed: int = 42,
    ext: bool = False
):
    ...
```

## 🧾 `__init__` Parameters

| Parameter         | Type              | Default            | Description                                    |
| :---------------- | :---------------- | :----------------- | :--------------------------------------------- |
| `backend`        | `str`             | `"opencv"`         | Backend selection: `"opencv"`, `"torchvision"`, or `"av"` |
| `disable_parallel` | `bool`            | `False`            | Whether to disable parallel processing          |
| `num_workers`    | `int`   | `16`             | Number of workers for parallel processing |
| `seed`           | `int`             | `42`               | Random seed                                    |
| `ext`            | `bool`            | `False`            | Whether to filter out non-existent video file paths |

---

## ⚡ `run` Function

```python
def run(
    self,
    storage: DataFlowStorage,
    input_video_key: str = "video",
    output_key: str = "video_info"
):
    ...
```

Executes the main logic: reads data from storage, extracts metadata information for each video, and writes back to storage.

## 🧾 `run` Parameters

| Parameter         | Type                | Default    | Description                                    |
| :---------------- | :------------------ | :--------- | :--------------------------------------------- |
| `storage`         | `DataFlowStorage`   | -          | DataFlow storage object                        |
| `input_video_key` | `str`     | `"video"`     | Field name for video paths in input data |
| `output_key`      | `str`     | `"video_info"`     | Field name for output video information   |

---

## 🧠 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import VideoInfoFilter

# Step 1: Prepare FileStorage (at least contains video column)
storage = FileStorage(
    first_entry_file_name="data/video_info_input.jsonl",
    cache_path="./cache_local",
    file_name_prefix="video_info_filter",
    cache_type="jsonl"
)

# Step 2: Initialize operator
filter_op = VideoInfoFilter(
    backend="opencv",
    disable_parallel=False,
    num_workers=16,
    seed=42,
    ext=False
)

# Step 3: Execute information extraction
filter_op.run(
    storage=storage.step(),
    input_video_key="video",
    output_key="video_info"
)
```

---

### 🧾 Default Output Format

**Added Field:**
- `video_info` (dict): Video information dictionary

**Dictionary Fields:**

| Field          | Type              | Description                      |
| :------------- | :---------------- | :------------------------------- |
| `success`      | `bool`            | Whether successfully extracted information |
| `num_frames`   | `Optional[int]`   | Total number of frames           |
| `height`       | `Optional[int]`   | Height (pixels)                  |
| `width`        | `Optional[int]`   | Width (pixels)                   |
| `aspect_ratio` | `Optional[float]` | Aspect ratio (width/height)      |
| `resolution`   | `Optional[int]`   | Resolution (width * height)      |
| `fps`          | `Optional[float]` | Frame rate (frames/sec)          |
| `duration_sec` | `Optional[float]` | Duration (seconds)               |

Example Input:

```jsonl
{"video": "./test/video1.mp4"}
{"video": "./test/video2.mp4"}
```

Example Output:

```jsonl
{
  "video": "./test/video1.mp4",
  "video_info": {
    "success": true,
    "num_frames": 3000,
    "height": 1080,
    "width": 1920,
    "aspect_ratio": 1.7777777777777777,
    "resolution": 2073600,
    "fps": 30.0,
    "duration_sec": 100.0
  }
}
{
  "video": "./test/video2.mp4",
  "video_info": {
    "success": false,
    "num_frames": null,
    "height": null,
    "width": null,
    "aspect_ratio": null,
    "resolution": null,
    "fps": null,
    "duration_sec": null
  }
}
```

---

## 🔗 Related Links

- **Code:** [VideoInfoFilter](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_vision/filter/video_info_filter.py)
