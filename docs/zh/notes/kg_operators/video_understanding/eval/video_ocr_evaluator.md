---
title: 视频OCR评估器（VideoOCREvaluator）
createTime: 2025/01/20 11:00:00
permalink: /zh/mm_operators/video_understanding/eval/video_ocr_evaluator/
---

## 📘 概述

`VideoOCREvaluator` 是一个**视频OCR评估算子**，使用 PaddleOCR 对视频片段进行文字检测和识别。它读取上游提取的视频帧，计算每个片段中文字区域占画面的比例，并将 OCR 分数写回到 `video_clips` 字段中。

---

## 🏗️ `__init__` 函数

```python
def __init__(
    self,
    figure_root: str = "extract_frames",
    input_video_key: str = "video",
    video_clips_key: str = "video_clips",
    load_num: int = 3,
    batch_size: int = 8,
    num_workers: int = 4,
    gpu_num: int = 0,
    init_distributed: bool = False,
    output_key: str = "video_clips"
):
    ...
```

## 🧾 `__init__` 参数说明

| 参数名                | 类型     | 默认值                  | 说明                        |
| :----------------- | :----- | :------------------- | :------------------------ |
| `figure_root`      | `str`  | `"extract_frames"`   | 提取帧的根目录                   |
| `input_video_key`  | `str`  | `"video"`            | 输入数据中视频字段名                |
| `video_clips_key`  | `str`  | `"video_clips"`      | 输入数据中视频片段字段名              |
| `load_num`         | `int`  | `3`                  | 每个片段加载的帧数                 |
| `batch_size`       | `int`  | `8`                  | 批处理大小                     |
| `num_workers`      | `int`  | `4`                  | 数据加载工作进程数                 |
| `gpu_num`          | `int`  | `0`                  | GPU ID（0+ 表示使用GPU，-1 表示CPU） |
| `init_distributed` | `bool` | `False`              | 是否初始化分布式训练                |
| `output_key`       | `str`  | `"video_clips"`      | 输出字段名（更新后的视频片段）           |

---

## ⚡ `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage,
    figure_root: Optional[str] = None,
    input_video_key: Optional[str] = None,
    video_clips_key: Optional[str] = None,
    load_num: Optional[int] = None,
    batch_size: Optional[int] = None,
    num_workers: Optional[int] = None,
    gpu_num: Optional[int] = None,
    init_distributed: Optional[bool] = None,
    output_key: Optional[str] = None
):
    ...
```

执行算子主逻辑：从 storage 读取数据表和提取的视频帧，使用 PaddleOCR 检测文字区域，计算文字占比，并写回存储。

## 🧾 `run` 参数说明

所有参数均为可选，用于覆盖初始化时的参数。参数说明与 `__init__` 相同。

---

## 🧠 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import VideoOCREvaluator

# Step 1: 准备 FileStorage（需要包含 video, video_clips 列）
# 注意：需要先使用 VideoFrameFilter 提取帧
storage = FileStorage(
    first_entry_file_name="data/video_ocr_input.jsonl",
    cache_path="./cache_local",
    file_name_prefix="video_ocr",
    cache_type="jsonl"
)

# Step 2: 初始化算子
evaluator = VideoOCREvaluator(
    figure_root="./cache/extract_frames",
    input_video_key="video",
    video_clips_key="video_clips",
    load_num=3,
    batch_size=8,
    num_workers=4,
    gpu_num=0,  # 使用 GPU 0
    init_distributed=False
)

# Step 3: 执行评估
evaluator.run(
    storage=storage.step()
)
```

---

### 🧾 默认输出格式（Output Format）

**修改字段：**
- `video_clips` (dict): 更新视频片段字典，为每个 clip 添加 `ocr_score` 字段

**每个片段（clip）新增字段：**

| 字段          | 类型      | 说明                                    |
| :---------- | :------ | :------------------------------------ |
| `ocr_score` | `float` | OCR分数（文字区域占画面的比例，0-1之间，值越高表示文字内容越多） |

示例输入：

```jsonl
{
  "video": ["./test/video1.mp4"],
  "video_clips": {
    "clips": [
      {
        "id": "video1_0",
        "frame_start": 0,
        "frame_end": 150,
        "num_frames": 150,
        "height": 720,
        "width": 1280
      }
    ]
  }
}
```

示例输出：

```jsonl
{
  "video": ["./test/video1.mp4"],
  "video_clips": {
    "clips": [
      {
        "id": "video1_0",
        "frame_start": 0,
        "frame_end": 150,
        "num_frames": 150,
        "height": 720,
        "width": 1280,
        "ocr_score": 0.15
      }
    ]
  }
}
```

---

## 🔗 相关链接

- **代码:** [VideoOCREvaluator](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_vision/eval/video_ocr_evaluator.py)
- **PaddleOCR:** [https://github.com/PaddlePaddle/PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR)

