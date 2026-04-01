---
title: Video Clip Filter (VideoClipFilter)
createTime: 2025/01/20 10:00:00
permalink: /en/mm_operators/video_understanding/filter/video_clip_filter/
---

## 📘 Overview

`VideoClipFilter` is an operator for **generating video clip metadata from upstream DataFrame**. It reads video paths, video information, and scene information, generating corresponding video clip metadata for each scene, including clip ID, timestamps, frame ranges, and other information. Supports parallel processing and error handling.

---

## 🏗️ `__init__` Function

```python
def __init__(
    self,
    input_video_key: str = "video",
    video_info_key: str = "video_info",
    video_scene_key: str = "video_scene",
    output_key: str = "video_clips",
    drop_invalid_timestamps: bool = False,
    disable_parallel: bool = False,
    num_workers: int = 16
):
    ...
```

## 🧾 `__init__` Parameters

| Parameter                | Type     | Default            | Description                                    |
| :----------------------- | :------- | :----------------- | :--------------------------------------------- |
| `input_video_key`        | `str`    | `"video"`          | Field name for video paths in input data       |
| `video_info_key`         | `str`    | `"video_info"`     | Field name for video information (contains height, width, fps) |
| `video_scene_key`        | `str`    | `"video_scene"`    | Field name for video scenes (contains scenes list) |
| `output_key`             | `str`    | `"video_clips"`    | Field name for output video clip metadata      |
| `drop_invalid_timestamps`| `bool`   | `False`            | Whether to drop samples with invalid timestamps |
| `disable_parallel`       | `bool`   | `False`            | Whether to disable parallel processing          |
| `num_workers`            | `int`    | `16`               | Number of workers for parallel processing      |

---

## ⚡ `run` Function

```python
def run(
    self,
    storage: DataFlowStorage,
    input_video_key: Optional[str] = None,
    video_info_key: Optional[str] = None,
    video_scene_key: Optional[str] = None,
    output_key: Optional[str] = None
):
    ...
```

Executes the main logic: reads data from storage, generates clip metadata for each video scene, and writes back to storage.

## 🧾 `run` Parameters

| Parameter         | Type                | Default    | Description                                    |
| :---------------- | :------------------ | :--------- | :--------------------------------------------- |
| `storage`         | `DataFlowStorage`   | -          | DataFlow storage object                        |
| `input_video_key` | `Optional[str]`     | `None`     | Field name for video paths (overrides init param) |
| `video_info_key`  | `Optional[str]`     | `None`     | Field name for video information (overrides init param) |
| `video_scene_key` | `Optional[str]`     | `None`     | Field name for video scenes (overrides init param) |
| `output_key`      | `Optional[str]`     | `None`     | Field name for output (overrides init param)   |

---

## 🧠 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import VideoClipFilter

# Step 1: Prepare FileStorage (needs video, video_info, video_scene columns)
storage = FileStorage(
    first_entry_file_name="data/video_clip_input.jsonl",
    cache_path="./cache_local",
    file_name_prefix="video_clip_filter",
    cache_type="jsonl"
)

# Step 2: Initialize operator
filter_op = VideoClipFilter(
    input_video_key="video",
    video_info_key="video_info",
    video_scene_key="video_scene",
    output_key="video_clips",
    drop_invalid_timestamps=False,
    disable_parallel=False,
    num_workers=16
)

# Step 3: Execute filtering
filter_op.run(
    storage=storage.step()
)
```

---

### 🧾 Default Output Format

**Added Field:**
- `video_clips` (dict): Video clip metadata dictionary

**Dictionary Fields:**

| Field     | Type              | Description                        |
| :-------- | :---------------- | :--------------------------------- |
| `success` | `bool`            | Whether successfully generated clips |
| `error`   | `Optional[str]`   | Error message (if any)             |
| `clips`   | `List[Dict]`      | Clip list, each clip contains the following fields |

**Fields in Each Clip:**

| Field             | Type     | Description          |
| :---------------- | :------- | :------------------- |
| `id`              | `str`    | Clip ID              |
| `video_path`      | `str`    | Video path           |
| `num_frames`      | `int`    | Number of frames     |
| `height`          | `int`    | Height (pixels)      |
| `width`           | `int`    | Width (pixels)       |
| `fps`             | `float`  | Frame rate           |
| `timestamp_start` | `str`    | Start timestamp      |
| `timestamp_end`   | `str`    | End timestamp        |
| `frame_start`     | `int`    | Start frame index    |
| `frame_end`       | `int`    | End frame index      |
| `duration_sec`    | `float`  | Duration (seconds)   |

Example Input:

```jsonl
{
  "video": ["./test/video1.mp4"],
  "video_info": {"height": 1080, "width": 1920, "fps": 30.0},
  "video_scene": {
    "scenes": [
      {"start": "00:00:00.000", "end": "00:00:05.000"},
      {"start": "00:00:10.000", "end": "00:00:15.000"}
    ]
  }
}
```

Example Output:

```jsonl
{
  "video": ["./test/video1.mp4"],
  "video_info": {"height": 1080, "width": 1920, "fps": 30.0},
  "video_scene": {...},
  "video_clips": {
    "success": true,
    "error": null,
    "clips": [
      {
        "id": "video1_0",
        "video_path": "./test/video1.mp4",
        "num_frames": 150,
        "height": 1080,
        "width": 1920,
        "fps": 30.0,
        "timestamp_start": "00:00:00.000",
        "timestamp_end": "00:00:05.000",
        "frame_start": 0,
        "frame_end": 150,
        "duration_sec": 5.0
      },
      {
        "id": "video1_1",
        "video_path": "./test/video1.mp4",
        "num_frames": 150,
        "height": 1080,
        "width": 1920,
        "fps": 30.0,
        "timestamp_start": "00:00:10.000",
        "timestamp_end": "00:00:15.000",
        "frame_start": 300,
        "frame_end": 450,
        "duration_sec": 5.0
      }
    ]
  }
}
```

---

## 🔗 Related Links

- **Code:** [VideoClipFilter](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_vision/filter/video_clip_filter.py)

