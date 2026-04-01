---
title: 视频帧提取（VideoFrameFilter）
createTime: 2025/01/20 10:00:00
permalink: /zh/mm_operators/video_understanding/filter/video_frame_filter/
---

## 📘 概述

`VideoFrameFilter` 是一个用于**从视频片段中提取帧并保存到磁盘**的算子。它读取上游的视频片段元数据，按照指定的采样间隔或策略提取关键帧，并保存为图像文件。支持帧大小调整、并行处理等功能。

---

## 🏗️ `__init__` 函数

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

## 🧾 `__init__` 参数说明

| 参数名                | 类型                | 默认值                        | 说明                                    |
| :----------------- | :---------------- | :------------------------- | :------------------------------------ |
| `input_video_key`  | `str`             | `"video"`                  | 输入数据中视频路径字段名                          |
| `video_info_key`   | `str`             | `"video_info"`             | 输入数据中视频信息字段名（用于获取fps）                |
| `video_clips_key`  | `str`             | `"video_clips"`            | 输入数据中视频片段字段名                          |
| `output_key`       | `str`             | `"video_frame_export"`     | 输出帧提取结果字段名                            |
| `output_dir`       | `str`             | `"./cache/extract_frames"` | 保存提取帧的根目录                             |
| `interval_sec`     | `Optional[float]` | `None`                     | 采样间隔（秒），None表示每个片段提取3帧（开头、中间、结尾）    |
| `target_size`      | `Optional[str]`   | `"640*360"`                | 目标帧大小，格式 "宽*高" 或 "宽x高"，None表示保持原始大小 |
| `disable_parallel` | `bool`            | `False`                    | 是否禁用并行处理                              |
| `num_workers`      | `int`             | `16`                       | 并行处理的 worker 数量                        |

---

## ⚡ `run` 函数

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

执行算子主逻辑：从 storage 读取数据表，为每个视频片段提取帧并保存到磁盘，将提取结果写回存储。

## 🧾 `run` 参数说明

| 参数名                | 类型                | 默认值    | 说明                      |
| :----------------- | :---------------- | :----- | :---------------------- |
| `storage`          | `DataFlowStorage` | -      | Dataflow 数据存储对象          |
| `input_video_key`  | `Optional[str]`   | `None` | 视频路径字段名（覆盖初始化参数）        |
| `video_info_key`   | `Optional[str]`   | `None` | 视频信息字段名（覆盖初始化参数）        |
| `video_clips_key`  | `Optional[str]`   | `None` | 视频片段字段名（覆盖初始化参数）        |
| `output_key`       | `Optional[str]`   | `None` | 输出字段名（覆盖初始化参数）          |
| `output_dir`       | `Optional[str]`   | `None` | 输出目录（覆盖初始化参数）           |

---

## 🧠 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import VideoFrameFilter

# Step 1: 准备 FileStorage（需要包含 video, video_info, video_clips 列）
storage = FileStorage(
    first_entry_file_name="data/video_frame_input.jsonl",
    cache_path="./cache_local",
    file_name_prefix="video_frame_filter",
    cache_type="jsonl"
)

# Step 2: 初始化算子
filter_op = VideoFrameFilter(
    input_video_key="video",
    video_info_key="video_info",
    video_clips_key="video_clips",
    output_key="video_frame_export",
    output_dir="./cache/extract_frames",
    interval_sec=None,  # 每个片段提取3帧
    target_size="640*360",  # 调整为640x360
    disable_parallel=False,
    num_workers=16
)

# Step 3: 执行帧提取
filter_op.run(
    storage=storage.step()
)
```

---

### 🧾 默认输出格式（Output Format）

**新增字段：**
- `video_frame_export` (dict): 视频帧提取结果字典

**字典字段说明：**

| 字段                  | 类型           | 说明               |
| :------------------ | :----------- | :--------------- |
| `success`           | `bool`       | 是否成功提取帧          |
| `error`             | `Optional[str]` | 错误信息（如有）         |
| `output_dir`        | `str`        | 输出根目录            |
| `total_clips`       | `int`        | 总片段数             |
| `total_saved_frames`| `int`        | 总保存帧数            |
| `clips`             | `List[Dict]` | 片段列表，每个片段包含以下字段 |

**每个片段（clip）的字段：**

| 字段              | 类型            | 说明               |
| :-------------- | :------------ | :--------------- |
| `clip_id`       | `str`         | 片段ID            |
| `dir`           | `str`         | 该片段帧保存的目录        |
| `saved`         | `int`         | 保存的帧数            |
| `frame_indices` | `List[int]`   | 提取的帧索引列表（片段内的相对索引） |

示例输入：

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

示例输出：

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

## 🔗 相关链接

- **代码:** [VideoFrameFilter](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_vision/filter/video_frame_filter.py)

