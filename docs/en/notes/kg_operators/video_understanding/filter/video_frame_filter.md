---
title: Video Frame Filter (VideoFrameFilter)
createTime: 2025/01/20 10:00:00
permalink: /en/mm_operators/video_understanding/filter/video_frame_filter/
---

## 📘 Overview

`VideoFrameFilter` is an operator for **extracting frames from video clips and saving them to disk**. It reads upstream video clip metadata, extracts key frames according to specified sampling intervals or strategies, and saves them as image files. Supports frame resizing, parallel processing, and more.

---

## 🏗️ `__init__` Function

```python
def __init__(
    self,
    input_video_key: str = "video",
    video_info_key: str = "video_info",
    video_clips_key: str = "video_clips",
    output_key: str = "video_frame_export",
    output_dir: str = "./cache/extract_frames",
    interval_sec: Optional[float] = None,
    target_size: Optional[str] = "640*360",
    disable_parallel: bool = False,
    num_workers: int = 16
):
    ...
```

## 🧾 `__init__` Parameters

| Parameter          | Type              | Default                    | Description                                    |
| :----------------- | :---------------- | :------------------------- | :--------------------------------------------- |
| `input_video_key`  | `str`             | `"video"`                  | Field name for video path in input data        |
| `video_info_key`   | `str`             | `"video_info"`             | Field name for video info (to get fps)         |
| `video_clips_key`  | `str`             | `"video_clips"`            | Field name for video clips in input data       |
| `output_key`       | `str`             | `"video_frame_export"`     | Output field name for frame extraction results |
| `output_dir`       | `str`             | `"./cache/extract_frames"` | Root directory to save extracted frames        |
| `interval_sec`     | `Optional[float]` | `None`                     | Sampling interval (seconds), None means extract 3 frames per clip (start, middle, end) |
| `target_size`      | `Optional[str]`   | `"640*360"`                | Target frame size, format "W*H" or "WxH", None keeps original size |
| `disable_parallel` | `bool`            | `False`                    | Whether to disable parallel processing         |
| `num_workers`      | `int`             | `16`                       | Number of workers for parallel processing      |

---

## ⚡ `run` Function

```python
def run(
    self,
    storage: DataFlowStorage,
    input_video_key: Optional[str] = None,
    video_info_key: Optional[str] = None,
    video_clips_key: Optional[str] = None,
    output_key: Optional[str] = None,
    output_dir: Optional[str] = None
):
    ...
```

Executes the main logic: reads data from storage, extracts frames for each video clip and saves to disk, writes extraction results back to storage.

## 🧾 `run` Parameters

| Parameter          | Type                | Default  | Description                      |
| :----------------- | :---------------- | :------- | :------------------------------- |
| `storage`          | `DataFlowStorage` | -        | DataFlow storage object          |
| `input_video_key`  | `Optional[str]`   | `None`   | Video path field (overrides init)|
| `video_info_key`   | `Optional[str]`   | `None`   | Video info field (overrides init)|
| `video_clips_key`  | `Optional[str]`   | `None`   | Video clips field (overrides init)|
| `output_key`       | `Optional[str]`   | `None`   | Output field (overrides init)    |
| `output_dir`       | `Optional[str]`   | `None`   | Output directory (overrides init)|

---

## 🧠 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import VideoFrameFilter

# Step 1: Prepare FileStorage (needs video, video_info, video_clips columns)
storage = FileStorage(
    first_entry_file_name="data/video_frame_input.jsonl",
    cache_path="./cache_local",
    file_name_prefix="video_frame_filter",
    cache_type="jsonl"
)

# Step 2: Initialize operator
filter_op = VideoFrameFilter(
    input_video_key="video",
    video_info_key="video_info",
    video_clips_key="video_clips",
    output_key="video_frame_export",
    output_dir="./cache/extract_frames",
    interval_sec=None,  # Extract 3 frames per clip
    target_size="640*360",  # Resize to 640x360
    disable_parallel=False,
    num_workers=16
)

# Step 3: Execute frame extraction
filter_op.run(
    storage=storage.step()
)
```

---

### 🧾 Default Output Format

**Added Field:**
- `video_frame_export` (dict): Video frame extraction result dictionary

**Dictionary Fields:**

| Field                | Type            | Description                      |
| :------------------- | :-------------- | :------------------------------- |
| `success`            | `bool`          | Whether successfully extracted frames |
| `error`              | `Optional[str]` | Error message (if any)           |
| `output_dir`         | `str`           | Output root directory            |
| `total_clips`        | `int`           | Total number of clips            |
| `total_saved_frames` | `int`           | Total number of saved frames     |
| `clips`              | `List[Dict]`    | Clip list, each clip contains the following fields |

**Fields in Each Clip:**

| Field           | Type        | Description                      |
| :-------------- | :---------- | :------------------------------- |
| `clip_id`       | `str`       | Clip ID                          |
| `dir`           | `str`       | Directory where frames were saved|
| `saved`         | `int`       | Number of frames saved           |
| `frame_indices` | `List[int]` | List of extracted frame indices (relative to clip) |

Example Input:

```jsonl
{
  "video": ["./test/video1.mp4"],
  "video_info": {"fps": 30.0},
  "video_clips": {
    "clips": [
      {
        "id": "video1_0",
        "frame_start": 0,
        "frame_end": 150,
        "num_frames": 150,
        "fps": 30.0
      }
    ]
  }
}
```

Example Output:

```jsonl
{
  "video": ["./test/video1.mp4"],
  "video_info": {"fps": 30.0},
  "video_clips": {...},
  "video_frame_export": {
    "success": true,
    "error": null,
    "output_dir": "./cache/extract_frames",
    "total_clips": 1,
    "total_saved_frames": 3,
    "clips": [
      {
        "clip_id": "video1_0",
        "dir": "./cache/extract_frames/video1/video1_0/img",
        "saved": 3,
        "frame_indices": [0, 75, 149]
      }
    ]
  }
}
```

---

## 🔗 Related Links

- **Code:** [VideoFrameFilter](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_vision/filter/video_frame_filter.py)

