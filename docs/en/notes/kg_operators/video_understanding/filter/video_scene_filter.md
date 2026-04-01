---
title: Video Scene Filter (VideoSceneFilter)
createTime: 2025/01/20 10:00:00
permalink: /en/mm_operators/video_understanding/filter/video_scene_filter/
---

## 📘 Overview

`VideoSceneFilter` is a video scene splitting operator based on **PySceneDetect**. It can automatically detect scene transition points in videos, split videos into multiple scene segments, and output start time, end time, frame ranges, and other information for each scene. Supports content detector and adaptive detector, and parallel processing.

---

## 🏗️ `__init__` Function

```python
def __init__(
    self,
    frame_skip: int = 0,
    start_remove_sec: float = 0.0,
    end_remove_sec: float = 0.0,
    min_seconds: float = 2.0,
    max_seconds: float = 15.0,
    disable_parallel: bool = False,
    num_workers: int = 16,
    input_video_key: str = "video",
    video_info_key: str = "video_info",
    output_key: str = "video_scene",
    use_adaptive_detector: bool = True,
    overlap: bool = False,
    use_fixed_interval: bool = False
):
    ...
```

## 🧾 `__init__` Parameters

| Parameter              | Type     | Default            | Description                                    |
| :--------------------- | :------- | :----------------- | :--------------------------------------------- |
| `frame_skip`           | `int`    | `0`                | Number of frames to skip for faster detection (0 means no skip) |
| `start_remove_sec`     | `float`  | `0.0`              | Seconds to remove from video start            |
| `end_remove_sec`       | `float`  | `0.0`              | Seconds to remove from video end               |
| `min_seconds`          | `float`  | `2.0`              | Minimum scene duration (seconds)               |
| `max_seconds`          | `float`  | `15.0`             | Maximum scene duration (seconds)               |
| `disable_parallel`     | `bool`   | `False`            | Whether to disable parallel processing         |
| `num_workers`          | `int`    | `16`               | Number of workers for parallel processing      |
| `input_video_key`      | `str`    | `"video"`          | Field name for video paths in input data       |
| `video_info_key`       | `str`    | `"video_info"`     | Field name for video information (optional, for fps) |
| `output_key`           | `str`    | `"video_scene"`    | Field name for output video scene information   |
| `use_adaptive_detector` | `bool`   | `True`             | Whether to use adaptive detector (AdaptiveDetector) |
| `overlap`              | `bool`   | `False`            | Whether to use overlap splitting strategy. When scene duration exceeds `max_seconds`:<br>- `True`: Split from start time with `max_seconds` step size, creating multiple segments<br>- `False`: Split long scenes evenly without overlap between segments      |
| `use_fixed_interval`   | `bool`   | `False`            | Whether to use fixed interval splitting (instead of scene detection) |

---

## ⚡ `run` Function

```python
def run(
    self,
    storage: DataFlowStorage,
    input_video_key: Optional[str] = None,
    video_info_key: Optional[str] = None,
    output_key: Optional[str] = None,
    overlap: Optional[bool] = None,
    use_fixed_interval: Optional[bool] = None
):
    ...
```

Executes the main logic: reads data from storage, detects scene transition points for each video, and writes back to storage.

## 🧾 `run` Parameters

| Parameter         | Type                | Default    | Description                                    |
| :---------------- | :------------------ | :--------- | :--------------------------------------------- |
| `storage`         | `DataFlowStorage`   | -          | DataFlow storage object                        |
| `input_video_key` | `Optional[str]`     | `None`     | Field name for video paths (overrides init param) |
| `video_info_key`  | `Optional[str]`     | `None`     | Field name for video information (overrides init param) |
| `output_key`      | `Optional[str]`     | `None`     | Field name for output (overrides init param)   |
| `overlap`         | `Optional[bool]`    | `None`     | Whether to use overlap splitting strategy (overrides init param). When scene duration exceeds `max_seconds`:<br>- `True`: Split from start time with `max_seconds` step size, creating multiple segments<br>- `False`: Split long scenes evenly without overlap between segments |
| `use_fixed_interval` | `Optional[bool]` | `None`     | Whether to use fixed interval splitting (overrides init param) |

---

## 🧠 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import VideoSceneFilter

# Step 1: Prepare FileStorage (at least contains video column, optionally video_info)
storage = FileStorage(
    first_entry_file_name="data/video_scene_input.jsonl",
    cache_path="./cache_local",
    file_name_prefix="video_scene_filter",
    cache_type="jsonl"
)

# Step 2: Initialize operator
filter_op = VideoSceneFilter(
    frame_skip=0,
    start_remove_sec=0.0,
    end_remove_sec=0.0,
    min_seconds=2.0,
    max_seconds=15.0,
    disable_parallel=False,
    num_workers=16,
    input_video_key="video",
    video_info_key="video_info",
    output_key="video_scene",
    use_adaptive_detector=True,
    overlap=False,
    use_fixed_interval=False
)

# Step 3: Execute scene detection
filter_op.run(
    storage=storage.step()
)
```

---

### 🧾 Default Output Format

**Added Field:**
- `video_scene` (dict): Video scene information dictionary

**Dictionary Fields:**

| Field     | Type              | Description                        |
| :-------- | :---------------- | :--------------------------------- |
| `success` | `bool`            | Whether successfully detected scenes |
| `error`   | `Optional[str]`   | Error message (if any)             |
| `fps`     | `Optional[float]` | Video frame rate                   |
| `scenes`  | `List[Dict]`      | Scene list, each scene contains the following fields |

**Fields in Each Scene:**

| Field          | Type     | Description                      |
| :------------- | :------- | :------------------------------- |
| `start`        | `str`    | Start timestamp (HH:MM:SS.mmm)   |
| `end`          | `str`    | End timestamp (HH:MM:SS.mmm)     |
| `start_frame`  | `int`    | Start frame index                |
| `end_frame`    | `int`    | End frame index                  |
| `duration_sec` | `float`  | Scene duration (seconds)         |

Example Input:

```jsonl
{"video": "./test/video1.mp4"}
{"video": "./test/video2.mp4", "video_info": {"fps": 30.0}}
```

Example Output:

```jsonl
{
  "video": "./test/video1.mp4",
  "video_scene": {
    "success": true,
    "error": null,
    "fps": 30.0,
    "scenes": [
      {
        "start": "00:00:00.000",
        "end": "00:00:05.123",
        "start_frame": 0,
        "end_frame": 153,
        "duration_sec": 5.123
      },
      {
        "start": "00:00:05.123",
        "end": "00:00:12.456",
        "start_frame": 153,
        "end_frame": 373,
        "duration_sec": 7.333
      }
    ]
  }
}
```

---

## 🔗 Related Links

- **Code:** [VideoSceneFilter](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_vision/filter/video_scene_filter.py)
- **PySceneDetect:** [PySceneDetect Documentation](https://pyscenedetect.readthedocs.io/)
