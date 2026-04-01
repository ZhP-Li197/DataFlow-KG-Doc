---
title: 视频片段过滤（VideoClipFilter）
createTime: 2025/01/20 10:00:00
permalink: /zh/mm_operators/video_understanding/filter/video_clip_filter/
---

## 📘 概述

`VideoClipFilter` 是一个用于**从上游 DataFrame 生成视频片段元数据**的算子。它读取视频路径、视频信息和场景信息，为每个场景生成对应的视频片段元数据，包括片段ID、时间戳、帧范围等信息。支持并行处理和错误处理。

---

## 🏗️ `__init__` 函数

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

## 🧾 `__init__` 参数说明

| 参数名                        | 类型      | 默认值            | 说明                                    |
| :------------------------- | :------ | :------------- | :------------------------------------ |
| `input_video_key`          | `str`   | `"video"`      | 输入数据中视频路径字段名                            |
| `video_info_key`           | `str`   | `"video_info"` | 输入数据中视频信息字段名（包含 height, width, fps）      |
| `video_scene_key`          | `str`   | `"video_scene"` | 输入数据中视频场景字段名（包含 scenes 列表）              |
| `output_key`               | `str`   | `"video_clips"` | 输出视频片段元数据字段名                            |
| `drop_invalid_timestamps`  | `bool`  | `False`        | 是否丢弃无效时间戳的样本                              |
| `disable_parallel`          | `bool`  | `False`        | 是否禁用并行处理                                |
| `num_workers`               | `int`   | `16`           | 并行处理的 worker 数量                           |

---

## ⚡ `run` 函数

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

执行算子主逻辑：从 storage 读取数据表，为每个视频场景生成片段元数据，并写回存储。

## 🧾 `run` 参数说明

| 参数名               | 类型                | 默认值            | 说明                                    |
| :---------------- | :---------------- | :------------- | :------------------------------------ |
| `storage`         | `DataFlowStorage` | -              | Dataflow 数据存储对象                          |
| `input_video_key` | `Optional[str]`   | `None`         | 视频路径字段名（覆盖初始化参数）                        |
| `video_info_key`  | `Optional[str]`    | `None`         | 视频信息字段名（覆盖初始化参数）                         |
| `video_scene_key` | `Optional[str]`    | `None`         | 视频场景字段名（覆盖初始化参数）                         |
| `output_key`      | `Optional[str]`    | `None`         | 输出字段名（覆盖初始化参数）                           |

---

## 🧠 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import VideoClipFilter

# Step 1: 准备 FileStorage（需要包含 video, video_info, video_scene 列）
storage = FileStorage(
    first_entry_file_name="data/video_clip_input.jsonl",
    cache_path="./cache_local",
    file_name_prefix="video_clip_filter",
    cache_type="jsonl"
)

# Step 2: 初始化算子
filter_op = VideoClipFilter(
    input_video_key="video",
    video_info_key="video_info",
    video_scene_key="video_scene",
    output_key="video_clips",
    drop_invalid_timestamps=False,
    disable_parallel=False,
    num_workers=16
)

# Step 3: 执行过滤
filter_op.run(
    storage=storage.step()
)
```

---

### 🧾 默认输出格式（Output Format）

**新增字段：**
- `video_clips` (dict): 视频片段元数据字典

**字典字段说明：**

| 字段        | 类型                | 说明               |
| :-------- | :---------------- | :--------------- |
| `success` | `bool`            | 是否成功生成片段         |
| `error`   | `Optional[str]`   | 错误信息（如有）         |
| `clips`   | `List[Dict]`      | 片段列表，每个片段包含以下字段 |

**每个片段（clip）的字段：**

| 字段                | 类型            | 说明          |
| :---------------- | :------------ | :---------- |
| `id`              | `str`         | 片段ID        |
| `video_path`      | `str`         | 视频路径        |
| `num_frames`      | `int`         | 帧数          |
| `height`          | `int`         | 高度（像素）      |
| `width`           | `int`         | 宽度（像素）      |
| `fps`             | `float`       | 帧率          |
| `timestamp_start` | `str`         | 开始时间戳       |
| `timestamp_end`   | `str`         | 结束时间戳       |
| `frame_start`     | `int`         | 开始帧索引       |
| `frame_end`       | `int`         | 结束帧索引       |
| `duration_sec`    | `float`       | 时长（秒）       |

示例输入：

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

示例输出：

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

## 🔗 相关链接

- **代码:** [VideoClipFilter](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_vision/filter/video_clip_filter.py)
