---
title: 视频片段切割生成（VideoClipGenerator）
createTime: 2025/12/20 10:00:00
permalink: /zh/mm_operators/video_understanding/generate/video_clip/
---

## 📘 概述

`VideoClipGenerator` 是一个用于 **根据时间戳信息自动切割视频片段** 的算子。  
它会从输入的视频片段元信息中，仅切割未被过滤（`filtered == False`）的片段，支持分辨率缩放、帧率调整等功能，适用于视频数据预处理、视频片段提取、多模态数据集构建等场景。

---

## 🏗️ `__init__` 函数

```python
def __init__(
    self,
    video_save_dir: str = "./cache/video_clips",
    drop_invalid_timestamps: bool = False,
    disable_parallel: bool = True,
    num_workers: int = None,
    target_fps: float = None,
    shorter_size: int = None,
):
    ...
```

## 🧾 `__init__` 参数说明

| 参数名                      | 类型      | 默认值                      | 说明                                         |
| :----------------------- | :------ | :----------------------- | :----------------------------------------- |
| `video_save_dir`         | `str`   | `"./cache/video_clips"`  | 切割后的视频片段保存目录                               |
| `drop_invalid_timestamps` | `bool`  | `False`                  | 是否丢弃时间戳无效的片段                               |
| `disable_parallel`       | `bool`  | `True`                   | 是否禁用并行处理（True为串行处理，False为并行处理）            |
| `num_workers`            | `int`   | `None`                   | 并行处理的工作进程数，默认为CPU核心数                       |
| `target_fps`             | `float` | `None`                   | 目标帧率，设置后会对视频进行帧率转换                         |
| `shorter_size`           | `int`   | `None`                   | 短边尺寸，用于视频缩放（不会上采样，仅当原视频较大时缩放，保持宽高比不变） |

---

## ⚡ `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage,
    video_clips_key: str = "video_clip",
    output_key: str = "video_info",
):
    ...
```

`run` 是算子主逻辑，执行视频片段切割任务：
读取视频片段元信息 → 过滤未被标记的片段 → 使用FFmpeg切割视频 → 保存并写入输出存储。

## 🧾 `run` 参数说明

| 参数名               | 类型                | 默认值            | 说明                     |
| :---------------- | :---------------- | :------------- | :--------------------- |
| `storage`         | `DataFlowStorage` | -              | Dataflow 数据存储对象        |
| `video_clips_key` | `str`             | `"video_clip"` | 输入数据中视频片段列表的字段名        |
| `output_key`      | `str`             | `"video_info"` | 输出到storage的键名（用于下游算子） |

---

## 🧠 示例用法

```python
from dataflow.operators.core_vision import VideoClipGenerator
from dataflow.utils.storage import FileStorage

# Step 1: 准备输入数据（包含视频片段元信息）
storage = FileStorage(
    first_entry_file_name="./video_clips_meta.json",
    cache_path="./cache",
    file_name_prefix="video_clip",
    cache_type="json",
)
storage.step()

# Step 2: 初始化并运行算子
video_clip_generator = VideoClipGenerator(
    video_save_dir="./output/video_clips",
    disable_parallel=False,  # 启用并行处理
    num_workers=4,
    target_fps=30.0,  # 统一转换为30fps
    shorter_size=720,  # 短边缩放到720p
)
video_clip_generator.run(
    storage=storage,
    video_clips_key="video_clip",
    output_key="video_info"
)
```

---

## 🧾 默认输入格式（Input Format）

输入数据的 `video_clip` 字段应该是一个列表，每个元素包含以下结构：

| 字段                  | 类型           | 说明                               |
| :------------------ | :----------- | :------------------------------- |
| `success`           | `bool`       | 上游处理是否成功                         |
| `clips`             | `List[Dict]` | 片段列表，每个片段包含以下字段：                 |
| └─ `id`             | `str`        | 片段唯一标识符                          |
| └─ `video_path`     | `str`        | 原始视频文件路径                         |
| └─ `timestamp_start` | `int/float`  | 片段起始时间（秒）                        |
| └─ `timestamp_end`  | `int/float`  | 片段结束时间（秒）                        |
| └─ `filtered`       | `bool`       | 是否被过滤（True表示跳过该片段，False表示切割该片段） |
| └─ `width`          | `int`        | 视频宽度（可选）                         |
| └─ `height`         | `int`        | 视频高度（可选）                         |

---

### 📥 示例输入

```json
{
  "video_clip": [
    {
      "success": true,
      "clips": [
        {
          "id": "video1_0",
          "video_path": "./videos/video1.mp4",
          "timestamp_start": 0,
          "timestamp_end": 10,
          "filtered": false,
          "width": 1920,
          "height": 1080
        },
        {
          "id": "video1_1",
          "video_path": "./videos/video1.mp4",
          "timestamp_start": 10,
          "timestamp_end": 20,
          "filtered": true,
          "width": 1920,
          "height": 1080
        }
      ]
    }
  ]
}
```

### 📤 示例输出

```json
{
  "id": "video1_0",
  "video": "./output/video_clips/video1_0.mp4",
  "original_video_path": "./videos/video1.mp4",
  "timestamp_start": 0,
  "timestamp_end": 10,
  "width": 1920,
  "height": 1080,
  "conversation": null
}
```

**注意：** `filtered` 为 `true` 的片段（如 `video1_1`）不会被切割，因此不会出现在输出中。

---

## 🔧 FFmpeg 依赖

### 安装 FFmpeg

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**验证安装:**
```bash
ffmpeg -version
```

---

## 🔗 相关链接

- **代码:** [VideoClipGenerator](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_vision/generate/video_clip_generator.py)
- **相关算子:**
  - [VideoToCaptionGenerator](./video_caption.md) - 视频描述生成
  - [VideoMergedCaptionGenerator](./video_merged_caption.md) - 视频合并字幕生成
