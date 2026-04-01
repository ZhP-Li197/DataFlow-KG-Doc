---
title: 视频场景检测（VideoSceneFilter）
createTime: 2025/01/20 10:00:00
permalink: /zh/mm_operators/video_understanding/filter/video_scene_filter/
---

## 📘 概述

`VideoSceneFilter` 是一个基于 **PySceneDetect** 的视频场景切分算子。它可以自动检测视频中的场景切换点，将视频切分为多个场景片段，并输出每个场景的开始时间、结束时间、帧范围等信息。支持内容检测器和自适应检测器，支持并行处理。

---

## 🏗️ `__init__` 函数

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

## 🧾 `__init__` 参数说明

| 参数名                    | 类型      | 默认值            | 说明                                    |
| :--------------------- | :------ | :------------- | :------------------------------------ |
| `frame_skip`           | `int`   | `0`            | 跳帧数量，用于加速检测（0 表示不跳帧）                    |
| `start_remove_sec`     | `float` | `0.0`          | 从视频开头移除的秒数                              |
| `end_remove_sec`       | `float` | `0.0`          | 从视频结尾移除的秒数                              |
| `min_seconds`          | `float` | `2.0`          | 场景最小时长（秒）                              |
| `max_seconds`          | `float` | `15.0`         | 场景最大时长（秒）                              |
| `disable_parallel`     | `bool`  | `False`        | 是否禁用并行处理                                |
| `num_workers`          | `int`   | `16`           | 并行处理的 worker 数量                           |
| `input_video_key`      | `str`   | `"video"`      | 输入数据中视频路径字段名                            |
| `video_info_key`       | `str`   | `"video_info"` | 输入数据中视频信息字段名（可选，用于获取 fps）              |
| `output_key`           | `str`   | `"video_scene"` | 输出视频场景信息字段名                            |
| `use_adaptive_detector` | `bool`  | `True`         | 是否使用自适应检测器（AdaptiveDetector）            |
| `overlap`              | `bool`  | `False`        | 是否使用重叠切分策略。当场景时长超过 `max_seconds` 时：<br>- `True`：从起始时间开始，以 `max_seconds` 为步长连续切分多个片段<br>- `False`：将长场景均匀切分，片段之间不重叠                              |
| `use_fixed_interval`   | `bool`  | `False`        | 是否使用固定间隔切分（而非场景检测）                      |

---

## ⚡ `run` 函数

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

执行算子主逻辑：从 storage 读取数据表，为每个视频检测场景切换点，并写回存储。

## 🧾 `run` 参数说明

| 参数名               | 类型                | 默认值    | 说明                                    |
| :---------------- | :---------------- | :----- | :------------------------------------ |
| `storage`         | `DataFlowStorage` | -      | Dataflow 数据存储对象                          |
| `input_video_key` | `Optional[str]`   | `None` | 视频路径字段名（覆盖初始化参数）                        |
| `video_info_key`  | `Optional[str]`   | `None` | 视频信息字段名（覆盖初始化参数）                         |
| `output_key`      | `Optional[str]`   | `None` | 输出字段名（覆盖初始化参数）                           |
| `overlap`         | `Optional[bool]`  | `None` | 是否使用重叠切分策略（覆盖初始化参数）。当场景时长超过 `max_seconds` 时：<br>- `True`：从起始时间开始，以 `max_seconds` 为步长连续切分多个片段<br>- `False`：将长场景均匀切分，片段之间不重叠                      |
| `use_fixed_interval` | `Optional[bool]` | `None` | 是否使用固定间隔切分（覆盖初始化参数）                      |

---

## 🧠 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import VideoSceneFilter

# Step 1: 准备 FileStorage（至少包含 video 列，可选 video_info 列）
storage = FileStorage(
    first_entry_file_name="data/video_scene_input.jsonl",
    cache_path="./cache_local",
    file_name_prefix="video_scene_filter",
    cache_type="jsonl"
)

# Step 2: 初始化算子
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

# Step 3: 执行场景检测
filter_op.run(
    storage=storage.step()
)
```

---

### 🧾 默认输出格式（Output Format）

**新增字段：**
- `video_scene` (dict): 视频场景信息字典

**字典字段说明：**

| 字段        | 类型                | 说明               |
| :-------- | :---------------- | :--------------- |
| `success` | `bool`            | 是否成功检测场景         |
| `error`   | `Optional[str]`   | 错误信息（如有）         |
| `fps`     | `Optional[float]` | 视频帧率             |
| `scenes`  | `List[Dict]`      | 场景列表，每个场景包含以下字段 |

**每个场景（scene）的字段：**

| 字段             | 类型      | 说明                      |
| :------------- | :------ | :---------------------- |
| `start`        | `str`   | 开始时间戳（HH:MM:SS.mmm）     |
| `end`          | `str`   | 结束时间戳（HH:MM:SS.mmm）     |
| `start_frame`  | `int`   | 开始帧索引                   |
| `end_frame`    | `int`   | 结束帧索引                   |
| `duration_sec` | `float` | 场景时长（秒）                 |

示例输入：

```jsonl
{"video": "./test/video1.mp4"}
{"video": "./test/video2.mp4", "video_info": {"fps": 30.0}}
```

示例输出：

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

## 🔗 相关链接

- **代码:** [VideoSceneFilter](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_vision/filter/video_scene_filter.py)
- **PySceneDetect:** [PySceneDetect 文档](https://pyscenedetect.readthedocs.io/)
