---
title: 视频分辨率过滤（VideoResolutionFilter）
createTime: 2025/01/20 10:00:00
permalink: /zh/mm_operators/video_understanding/filter/video_resolution_filter/
---

## 📘 概述

`VideoResolutionFilter` 是一个基于**视频分辨率**的过滤算子。对每条样本计算视频的宽度和高度，当分辨率在指定范围内时保留该样本，否则过滤掉。支持设置最小/最大宽度和高度阈值。

---

## 🏗️ `__init__` 函数

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

## 🧾 `__init__` 参数说明

| 参数名         | 类型     | 默认值            | 说明                                 |
| :---------- | :----- | :------------- | :--------------------------------- |
| `min_width` | `int`  | `1`            | 最小宽度（像素）                            |
| `max_width` | `int`  | `sys.maxsize`  | 最大宽度（像素）                            |
| `min_height` | `int`  | `1`            | 最小高度（像素）                            |
| `max_height` | `int`  | `sys.maxsize`  | 最大高度（像素）                            |
| `any_or_all` | `str`  | `"any"`        | 多视频保留策略：`"any"` 表示任一视频满足即可，`"all"` 表示所有视频都需满足 |

---

## ⚡ `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage,
    video_key: str = "video_path"
):
    ...
```

执行算子主逻辑：从 storage 读取数据表，按行计算视频分辨率，仅保留分辨率在指定范围内的样本行，并写回存储。

## 🧾 `run` 参数说明

| 参数名         | 类型                | 默认值           | 说明              |
| :---------- | :---------------- | :------------ | :-------------- |
| `storage`   | `DataFlowStorage` | -             | Dataflow 数据存储对象 |
| `video_key` | `str`             | `"video_path"` | 视频路径列名          |

---

## 🧠 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import VideoResolutionFilter

# Step 1: 准备 FileStorage（至少包含 video_path 列）
storage = FileStorage(
    first_entry_file_name="data/video_resolution_input.jsonl",
    cache_path="./cache_local",
    file_name_prefix="video_resolution_filter",
    cache_type="jsonl"
)

# Step 2: 初始化算子
filter_op = VideoResolutionFilter(
    min_width=720,
    max_width=3840,
    min_height=480,
    max_height=2160,
    any_or_all="any"
)

# Step 3: 执行过滤（将只保留分辨率在指定范围内的样本）
output_cols = filter_op.run(
    storage=storage.step(),
    video_key="video_path"
)
print(output_cols)  # ["video_width", "video_height", "passed_filter"]
```

---

### 🧾 默认输出格式（Output Format）

| 字段              | 类型      | 说明                    |
| :------------- | :------ | :-------------------- |
| `video_width` | `int`   | 视频宽度（像素），失败时为 -1      |
| `video_height` | `int`   | 视频高度（像素），失败时为 -1      |
| `passed_filter` | `bool`  | 是否通过过滤（分辨率在指定范围内）    |

示例输入：

```jsonl
{"video_path": "./test/video1.mp4"}
{"video_path": "./test/video2.mp4"}
```

示例输出：

```jsonl
{"video_path": "./test/video1.mp4", "video_width": 1920, "video_height": 1080, "passed_filter": true}
{"video_path": "./test/video2.mp4", "video_width": 640, "video_height": 480, "passed_filter": false}
```

---

## 🔗 相关链接

- **代码:** [VideoResolutionFilter](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_vision/filter/video_resolution_filter.py)

