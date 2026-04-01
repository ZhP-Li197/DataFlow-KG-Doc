---
title: 视频信息提取（VideoInfoFilter）
createTime: 2025/01/20 10:00:00
permalink: /zh/mm_operators/video_understanding/filter/video_info_filter/
---

## 📘 概述

`VideoInfoFilter` 是一个用于**提取视频元数据信息**的算子。它可以从视频文件中提取基本信息，包括帧数、分辨率、宽高比、帧率、时长等。支持多种后端（OpenCV、TorchVision、PyAV），支持并行处理以提高效率。

---

## 🏗️ `__init__` 函数

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

## 🧾 `__init__` 参数说明

| 参数名               | 类型                | 默认值            | 说明                                    |
| :---------------- | :---------------- | :------------- | :------------------------------------ |
| `backend`         | `str`             | `"opencv"`     | 后端选择：`"opencv"`、`"torchvision"` 或 `"av"`      |
| `disable_parallel` | `bool`            | `False`        | 是否禁用并行处理                                |
| `num_workers`     | `int`   | `16`         | 并行处理的 worker 数量              |
| `seed`            | `int`             | `42`           | 随机种子                                  |
| `ext`             | `bool`            | `False`        | 是否过滤掉不存在的视频文件路径                          |

---

## ⚡ `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage,
    input_video_key: str = "video",
    output_key: str = "video_info"
):
    ...
```

执行算子主逻辑：从 storage 读取数据表，为每个视频提取元数据信息，并写回存储。

## 🧾 `run` 参数说明

| 参数名               | 类型                | 默认值    | 说明                                    |
| :---------------- | :---------------- | :----- | :------------------------------------ |
| `storage`         | `DataFlowStorage` | -      | Dataflow 数据存储对象                          |
| `input_video_key` | `str`   | `"video"` | 输入数据中视频路径字段名                        |
| `output_key`      | `str`   | `"video_info"` | 输出视频信息字段名                           |

---

## 🧠 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import VideoInfoFilter

# Step 1: 准备 FileStorage（至少包含 video 列）
storage = FileStorage(
    first_entry_file_name="data/video_info_input.jsonl",
    cache_path="./cache_local",
    file_name_prefix="video_info_filter",
    cache_type="jsonl"
)

# Step 2: 初始化算子
filter_op = VideoInfoFilter(
    backend="opencv",
    disable_parallel=False,
    num_workers=16,
    seed=42,
    ext=False
)

# Step 3: 执行信息提取
filter_op.run(
    storage=storage.step(),
    input_video_key="video",
    output_key="video_info"
)
```

---

### 🧾 默认输出格式（Output Format）

**新增字段：**
- `video_info` (dict): 视频信息字典

**字典字段说明：**

| 字段              | 类型                | 说明                      |
| :------------- | :---------------- | :---------------------- |
| `success`      | `bool`            | 是否成功提取信息                |
| `num_frames`   | `Optional[int]`   | 总帧数                     |
| `height`       | `Optional[int]`   | 高度（像素）                  |
| `width`        | `Optional[int]`   | 宽度（像素）                  |
| `aspect_ratio` | `Optional[float]` | 宽高比（width/height）       |
| `resolution`   | `Optional[int]`   | 分辨率（width * height）     |
| `fps`          | `Optional[float]` | 帧率（帧/秒）                 |
| `duration_sec` | `Optional[float]` | 时长（秒）                   |

示例输入：

```jsonl
{"video": "./test/video1.mp4"}
{"video": "./test/video2.mp4"}
```

示例输出：

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

## 🔗 相关链接

- **代码:** [VideoInfoFilter](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_vision/filter/video_info_filter.py)
