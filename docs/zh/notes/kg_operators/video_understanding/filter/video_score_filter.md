---
title: 视频质量分数过滤（VideoScoreFilter）
createTime: 2025/01/20 10:00:00
permalink: /zh/mm_operators/video_understanding/filter/video_score_filter/
---

## 📘 概述

`VideoScoreFilter` 是一个基于**多种质量指标**的视频片段过滤算子。它可以根据帧数、帧率、分辨率、美学分数、OCR分数、亮度、运动分数、光流分数、模糊分数等多维度指标对视频片段进行过滤，为每个片段添加 `filtered` 标记。

---

## 🏗️ `__init__` 函数

```python
def __init__(
    self,
    frames_min: int = None,
    frames_max: int = None,
    fps_min: float = None,
    fps_max: float = None,
    resolution_max: int = None,
    aes_min: float = 4,
    ocr_min: float = None,
    ocr_max: float = 0.3,
    lum_min: float = 20,
    lum_max: float = 140,
    motion_min: float = 2,
    motion_max: float = 14,
    flow_min: float = None,
    flow_max: float = None,
    blur_max: float = None,
    strict_mode: bool = False,
    seed: int = 42
):
    ...
```

## 🧾 `__init__` 参数说明

| 参数名             | 类型      | 默认值     | 说明                                    |
| :-------------- | :------ | :------ | :------------------------------------ |
| `frames_min`    | `int`   | `None`  | 最小帧数                                  |
| `frames_max`    | `int`   | `None`  | 最大帧数                                  |
| `fps_min`       | `float` | `None`  | 最小帧率                                  |
| `fps_max`       | `float` | `None`  | 最大帧率                                  |
| `resolution_max`| `int`   | `None`  | 最大分辨率                                 |
| `aes_min`       | `float` | `4`     | 最小美学分数                                |
| `ocr_min`       | `float` | `None`  | 最小OCR分数                               |
| `ocr_max`       | `float` | `0.3`   | 最大OCR分数                               |
| `lum_min`       | `float` | `20`    | 最小亮度分数                                |
| `lum_max`       | `float` | `140`   | 最大亮度分数                                |
| `motion_min`    | `float` | `2`     | 最小运动分数                                |
| `motion_max`    | `float` | `14`    | 最大运动分数                                |
| `flow_min`      | `float` | `None`  | 最小光流分数                                |
| `flow_max`      | `float` | `None`  | 最大光流分数                                |
| `blur_max`      | `float` | `None`  | 最大模糊分数                                |
| `strict_mode`   | `bool`  | `False` | 是否严格模式，True则缺失字段时报错，False则跳过该过滤条件 |
| `seed`          | `int`   | `42`    | 随机种子，用于保证可重复性                         |

---

## ⚡ `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage,
    input_video_key: str = "video",
    video_clips_key: str = "video_clip",
    output_key: str = "video_clips"
):
    ...
```

执行算子主逻辑：从 storage 读取数据表，对每个视频片段应用多维度质量指标过滤，为每个片段添加 `filtered` 标记，并写回存储。

## 🧾 `run` 参数说明

| 参数名               | 类型                | 默认值            | 说明                      |
| :---------------- | :---------------- | :------------- | :---------------------- |
| `storage`         | `DataFlowStorage` | -              | Dataflow 数据存储对象          |
| `input_video_key` | `str`             | `"video"`      | 输入数据中视频字段名              |
| `video_clips_key` | `str`             | `"video_clip"` | 输入数据中视频片段字段名            |
| `output_key`      | `str`             | `"video_clips"`| 输出字段名（更新后的视频片段）         |

---

## 🧠 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import VideoScoreFilter

# Step 1: 准备 FileStorage（需要包含 video_clip 列，其中包含 clips 列表）
storage = FileStorage(
    first_entry_file_name="data/video_score_input.jsonl",
    cache_path="./cache_local",
    file_name_prefix="video_score_filter",
    cache_type="jsonl"
)

# Step 2: 初始化算子
filter_op = VideoScoreFilter(
    frames_min=30,
    frames_max=3000,
    fps_min=15.0,
    fps_max=60.0,
    resolution_max=1920*1080,
    aes_min=4.0,
    ocr_max=0.3,
    lum_min=20.0,
    lum_max=140.0,
    motion_min=2.0,
    motion_max=14.0,
    strict_mode=False,
    seed=42
)

# Step 3: 执行过滤
filter_op.run(
    storage=storage.step(),
    input_video_key="video",
    video_clips_key="video_clip",
    output_key="video_clips"
)
```

---

### 🧾 默认输出格式（Output Format）

**修改字段：**
- `video_clip` (dict): 更新视频片段字典，为每个 clip 添加 `filtered` 字段

**每个片段（clip）新增字段：**

| 字段         | 类型     | 说明                      |
| :--------- | :----- | :---------------------- |
| `filtered` | `bool` | 是否通过所有质量指标过滤，True表示保留 |

示例输入：

```jsonl
{
  "video": ["./test/video1.mp4"],
  "video_clip": {
    "clips": [
      {
        "id": "clip_0",
        "num_frames": 150,
        "fps": 30.0,
        "resolution": 2073600,
        "aesthetic_score": 5.2,
        "ocr_score": 0.1,
        "luminance_mean": 80.0,
        "motion_score": 5.0
      },
      {
        "id": "clip_1",
        "num_frames": 10,
        "fps": 30.0,
        "aesthetic_score": 3.0
      }
    ]
  }
}
```

示例输出：

```jsonl
{
  "video": ["./test/video1.mp4"],
  "video_clip": {
    "clips": [
      {
        "id": "clip_0",
        "num_frames": 150,
        "fps": 30.0,
        "resolution": 2073600,
        "aesthetic_score": 5.2,
        "ocr_score": 0.1,
        "luminance_mean": 80.0,
        "motion_score": 5.0,
        "filtered": true
      },
      {
        "id": "clip_1",
        "num_frames": 10,
        "fps": 30.0,
        "aesthetic_score": 3.0,
        "filtered": false
      }
    ]
  }
}
```

---

## 🔗 相关链接

- **代码:** [VideoScoreFilter](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_vision/filter/video_score_filter.py)

