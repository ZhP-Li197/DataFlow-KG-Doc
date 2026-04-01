---
title: Video Motion Score Filter (VideoMotionScoreFilter)
createTime: 2025/01/20 10:00:00
permalink: /en/mm_operators/video_understanding/filter/video_motion_score_filter/
---

## 📘 Overview

`VideoMotionScoreFilter` is a filter operator based on **video motion score**. It uses the Farneback optical flow algorithm to calculate video motion scores (mean optical flow magnitude), retaining samples with motion scores within the specified range. Supports frame size adjustment, relative normalization, configurable sampling frame rate, and other parameters.

---

## 🏗️ `__init__` Function

```python
def __init__(
    self,
    min_score: float = 0.25,
    max_score: float = sys.float_info.max,
    sampling_fps: float = 2.0,
    size: Union[int, Tuple[int], Tuple[int, int], None] = None,
    max_size: Optional[int] = None,
    divisible: int = 1,
    relative: bool = False,
    any_or_all: str = "any",
    **kwargs
):
    ...
```

## 🧾 `__init__` Parameters

| Parameter     | Type                                    | Default              | Description                                                      |
| :------------ | :-------------------------------------- | :------------------- | :--------------------------------------------------------------- |
| `min_score`   | `float`                                 | `0.25`               | Minimum motion score to retain samples                           |
| `max_score`   | `float`                                 | `sys.float_info.max` | Maximum motion score to retain samples                           |
| `sampling_fps`| `float`                                 | `2.0`                | Sampling frame rate for optical flow calculation (frames/sec)    |
| `size`        | `int` \| `Tuple[int]` \| `Tuple[int, int]` \| `None` | `None` | Frame size to resize before calculation (int for short edge or (height, width)) |
| `max_size`    | `Optional[int]`                         | `None`               | Maximum allowed value for longer edge after resizing             |
| `divisible`   | `int`                                   | `1`                  | Size must be divisible by this number                            |
| `relative`    | `bool`                                  | `False`              | Whether to normalize optical flow magnitude (relative to frame diagonal) |
| `any_or_all`  | `str`                                   | `"any"`              | Multi-video retention strategy: `"any"` or `"all"`              |
| `**kwargs`    | -                                       | -                    | Additional parameters for Farneback algorithm                    |

---

## ⚡ `run` Function

```python
def run(
    self,
    storage: DataFlowStorage,
    video_key: str = "video_path"
):
    ...
```

Executes the main logic: reads data from storage, calculates video motion scores for each row, retains only samples with motion scores within the specified range, and writes back to storage.

## 🧾 `run` Parameters

| Parameter   | Type              | Default         | Description                |
| :---------- | :---------------- | :-------------- | :------------------------- |
| `storage`   | `DataFlowStorage` | -               | DataFlow storage object     |
| `video_key` | `str`             | `"video_path"`  | Column name for video paths |

---

## 🧠 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import VideoMotionScoreFilter

# Step 1: Prepare FileStorage (at least contains video_path column)
storage = FileStorage(
    first_entry_file_name="data/video_motion_input.jsonl",
    cache_path="./cache_local",
    file_name_prefix="video_motion_filter",
    cache_type="jsonl"
)

# Step 2: Initialize operator
filter_op = VideoMotionScoreFilter(
    min_score=2.0,
    max_score=14.0,
    sampling_fps=2.0,
    size=None,  # Don't resize
    relative=False,  # Don't normalize
    any_or_all="any"
)

# Step 3: Execute filtering (will only retain samples with motion scores in specified range)
output_cols = filter_op.run(
    storage=storage.step(),
    video_key="video_path"
)
print(output_cols)  # ["video_motion_score", "passed_filter"]
```

---

### 🧾 Default Output Format

| Field                | Type     | Description                                    |
| :------------------- | :------- | :--------------------------------------------- |
| `video_motion_score` | `float`  | Video motion score (mean optical flow magnitude), -1.0 on failure |
| `passed_filter`      | `bool`   | Whether passed the filter (motion score in range) |

Example Input:

```jsonl
{"video_path": "./test/video1.mp4"}
{"video_path": "./test/video2.mp4"}
```

Example Output:

```jsonl
{"video_path": "./test/video1.mp4", "video_motion_score": 5.2, "passed_filter": true}
{"video_path": "./test/video2.mp4", "video_motion_score": 0.1, "passed_filter": false}
```

---

## 🔗 Related Links

- **Code:** [VideoMotionScoreFilter](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_vision/filter/video_motion_score_filter.py)
