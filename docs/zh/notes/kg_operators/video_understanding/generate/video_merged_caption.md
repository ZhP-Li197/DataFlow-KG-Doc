---
title: 视频合并字幕生成（VideoMergedCaptionGenerator）
createTime: 2025/12/20 11:00:00
permalink: /zh/mm_operators/video_understanding/generate/video_merged_caption/
---

## 📘 概述

`VideoMergedCaptionGenerator` 是一个用于 **将同一视频的多个片段字幕合并** 的算子。  
它会根据片段的时间戳信息，将字幕按时间顺序排列并格式化为 "From X to Y, caption..." 的文本形式，适用于长视频理解、视频摘要生成、多模态推理等场景。

**当前版本：** 仅支持根据时间戳进行合并。后续版本将支持根据其他属性（如场景、主题等）进行合并。

---

## 🏗️ `__init__` 函数

```python
def __init__(
    self,
    caption_key: str = "caption",
    id_key: str = "id",
    timestamp_start_key: str = "timestamp_start",
    timestamp_end_key: str = "timestamp_end",
    duration_key: str = "duration_sec",
):
    ...
```

## 🧾 `__init__` 参数说明

| 参数名                   | 类型    | 默认值                | 说明              |
| :-------------------- | :---- | :----------------- | :-------------- |
| `caption_key`         | `str` | `"caption"`        | 字幕文本字段名         |
| `id_key`              | `str` | `"id"`             | 片段ID字段名         |
| `timestamp_start_key` | `str` | `"timestamp_start"` | 片段起始时间字段名       |
| `timestamp_end_key`   | `str` | `"timestamp_end"`  | 片段结束时间字段名       |
| `duration_key`        | `str` | `"duration_sec"`   | 片段时长字段名（备用计算方式） |

---

## ⚡ `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage,
    caption_key: Optional[str] = None,
    id_key: Optional[str] = None,
):
    ...
```

`run` 是算子主逻辑，执行字幕合并任务：
读取片段字幕数据 → 按原视频分组 → 按时间排序 → 格式化为文本 → 写入输出存储。

## 🧾 `run` 参数说明

| 参数名           | 类型                | 默认值    | 说明                      |
| :------------ | :---------------- | :----- | :---------------------- |
| `storage`     | `DataFlowStorage` | -      | Dataflow 数据存储对象         |
| `caption_key` | `str`             | `None` | 覆盖字幕字段名（可选，使用初始化时的设置） |
| `id_key`      | `str`             | `None` | 覆盖ID字段名（可选，使用初始化时的设置） |

---

## 🧠 示例用法

```python
from dataflow.operators.core_vision import VideoMergedCaptionGenerator
from dataflow.utils.storage import FileStorage

# Step 1: 准备输入数据（包含多个片段的字幕）
storage = FileStorage(
    first_entry_file_name="./clip_captions.json",
    cache_path="./cache",
    file_name_prefix="merged_caption",
    cache_type="json",
)
storage.step()

# Step 2: 初始化并运行算子
merged_caption_generator = VideoMergedCaptionGenerator(
    caption_key="caption",
    id_key="id",
    timestamp_start_key="timestamp_start",
    timestamp_end_key="timestamp_end",
)
merged_caption_generator.run(
    storage=storage,
)
```

---

## 🧾 输入格式要求（Input Format）

输入应该是一个 DataFrame，每行代表一个视频片段的字幕信息：

| 字段                  | 类型          | 说明                                   |
| :------------------ | :---------- | :----------------------------------- |
| `id`                | `str`       | 片段ID，格式为 `video_name_X`（X为片段索引）       |
| `caption`           | `str`       | 片段的字幕文本                              |
| `timestamp_start`   | `int/float` | 片段起始时间（秒），支持整数或 `"HH:MM:SS.mmm"` 格式   |
| `timestamp_end`     | `int/float` | 片段结束时间（秒），支持整数或 `"HH:MM:SS.mmm"` 格式   |
| `duration_sec`      | `float`     | 片段时长（秒），仅在 `timestamp_end` 不可用时使用（可选） |

---

### 📥 示例输入

```json
[
  {
    "id": "movie_trailer_0",
    "caption": "A person is walking in a park on a sunny day.",
    "timestamp_start": 0,
    "timestamp_end": 10
  },
  {
    "id": "movie_trailer_1",
    "caption": "The person sits on a bench and reads a book.",
    "timestamp_start": 10,
    "timestamp_end": 20
  },
  {
    "id": "movie_trailer_2",
    "caption": "A dog runs towards the person and they play together.",
    "timestamp_start": 20,
    "timestamp_end": 30
  }
]
```

### 📤 示例输出

```json
{
  "id": "movie_trailer",
  "captions": "From 0 to 10, a person is walking in a park on a sunny day.\nFrom 10 to 20, the person sits on a bench and reads a book.\nFrom 20 to 30, a dog runs towards the person and they play together.",
  "num_clips": 3
}
```

---

## 🔄 典型工作流

```python
from dataflow.operators.core_vision import (
    VideoClipGenerator,          # Step 1: 切割视频片段
    VideoToCaptionGenerator,     # Step 2: 生成每个片段的字幕
    VideoMergedCaptionGenerator  # Step 3: 合并字幕
)

# Step 1: 切割视频片段
clip_generator = VideoClipGenerator(video_save_dir="./clips")
clip_generator.run(storage.step())

# Step 2: 为每个片段生成字幕
caption_generator = VideoToCaptionGenerator(vlm_serving=vlm_serving)
caption_generator.run(storage.step())

# Step 3: 合并同一视频的所有字幕
merged_caption_generator = VideoMergedCaptionGenerator()
merged_caption_generator.run(storage.step())
```

---

## 🔗 相关链接

- **代码:** [VideoMergedCaptionGenerator](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_vision/generate/video_merged_caption_generator.py)
- **相关算子:**
  - [VideoClipGenerator](./video_clip.md) - 视频片段切割
  - [VideoToCaptionGenerator](./video_caption.md) - 视频描述生成
  - [VideoCaptionToQAGenerator](./video_qa.md) - 基于字幕生成问答

