---
title: Video Resolution Filter (VideoResolutionFilter)
createTime: 2025/01/20 10:00:00
permalink: /en/mm_operators/video_understanding/filter/video_resolution_filter/
---

## 📘 Overview

`VideoResolutionFilter` is a filter operator based on **video resolution**. It calculates the width and height of each video sample, retaining samples whose resolution falls within the specified range and filtering out others. Supports setting minimum/maximum width and height thresholds.

---

## 🏗️ `__init__` Function

```python
def __init__(
    self,
    min_width: int = 1,
    max_width: int = sys.maxsize,
    min_height: int = 1,
    max_height: int = sys.maxsize,
    any_or_all: str = "any"
):
    ...
```

## 🧾 `__init__` Parameters

| Parameter     | Type   | Default          | Description                                                      |
| :------------ | :----- | :--------------- | :--------------------------------------------------------------- |
| `min_width`   | `int`  | `1`              | Minimum width (pixels)                                           |
| `max_width`   | `int`  | `sys.maxsize`    | Maximum width (pixels)                                           |
| `min_height`  | `int`  | `1`              | Minimum height (pixels)                                          |
| `max_height`  | `int`  | `sys.maxsize`    | Maximum height (pixels)                                          |
| `any_or_all`  | `str`  | `"any"`          | Multi-video retention strategy: `"any"` or `"all"`              |

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

Executes the main logic: reads data from storage, calculates video resolution for each row, retains only samples within the specified resolution range, and writes back to storage.

## 🧾 `run` Parameters

| Parameter   | Type              | Default         | Description                       |
| :---------- | :---------------- | :-------------- | :-------------------------------- |
| `storage`   | `DataFlowStorage` | -               | DataFlow storage object            |
| `video_key` | `str`             | `"video_path"`  | Column name for video paths        |

---

## 🧠 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import VideoResolutionFilter

# Step 1: Prepare FileStorage (at least contains video_path column)
storage = FileStorage(
    first_entry_file_name="data/video_resolution_input.jsonl",
    cache_path="./cache_local",
    file_name_prefix="video_resolution_filter",
    cache_type="jsonl"
)

# Step 2: Initialize operator
filter_op = VideoResolutionFilter(
    min_width=720,
    max_width=3840,
    min_height=480,
    max_height=2160,
    any_or_all="any"
)

# Step 3: Execute filtering (will only retain samples within specified resolution range)
output_cols = filter_op.run(
    storage=storage.step(),
    video_key="video_path"
)
print(output_cols)  # ["video_width", "video_height", "passed_filter"]
```

---

### 🧾 Default Output Format

| Field            | Type     | Description                                    |
| :--------------- | :------- | :--------------------------------------------- |
| `video_width`    | `int`    | Video width (pixels), -1 on failure           |
| `video_height`   | `int`    | Video height (pixels), -1 on failure          |
| `passed_filter`  | `bool`   | Whether passed the filter (resolution in range) |

Example Input:

```jsonl
{"video_path": "./test/video1.mp4"}
{"video_path": "./test/video2.mp4"}
```

Example Output:

```jsonl
{"video_path": "./test/video1.mp4", "video_width": 1920, "video_height": 1080, "passed_filter": true}
{"video_path": "./test/video2.mp4", "video_width": 640, "video_height": 480, "passed_filter": false}
```

---

## 🔗 Related Links

- **Code:** [VideoResolutionFilter](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_vision/filter/video_resolution_filter.py)
