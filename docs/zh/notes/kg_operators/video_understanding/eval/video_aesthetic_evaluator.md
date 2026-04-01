---
title: 视频美学评估器（VideoAestheticEvaluator）
createTime: 2025/01/20 11:00:00
permalink: /zh/mm_operators/video_understanding/eval/video_aesthetic_evaluator/
---

## 📘 概述

`VideoAestheticEvaluator` 是一个**视频美学评估算子**，使用 CLIP 编码器 + MLP 回归头对视频片段进行美学评分。它读取上游提取的视频帧，为每个片段计算美学分数，并将分数写回到 `video_clips` 字段中。

---

## 🏗️ `__init__` 函数

```python
def __init__(
    self,
    figure_root: str = "extract_frames",
    input_video_key: str = "video",
    video_clips_key: str = "video_clips",
    clip_model: str = "ViT-L/14",
    mlp_checkpoint: Optional[str] = None,
    load_num: int = 3,
    batch_size: int = 64,
    num_workers: int = 4,
    init_distributed: bool = False,
    output_key: str = "video_clips"
):
    ...
```

## 🧾 `__init__` 参数说明

| 参数名                | 类型                | 默认值                  | 说明                        |
| :----------------- | :---------------- | :------------------- | :------------------------ |
| `figure_root`      | `str`             | `"extract_frames"`   | 提取帧的根目录                   |
| `input_video_key`  | `str`             | `"video"`            | 输入数据中视频字段名                |
| `video_clips_key`  | `str`             | `"video_clips"`      | 输入数据中视频片段字段名              |
| `clip_model`       | `str`             | `"ViT-L/14"`         | CLIP 模型名称或路径              |
| `mlp_checkpoint`   | `Optional[str]`   | `None`               | MLP 回归头权重文件路径（可选）         |
| `load_num`         | `int`             | `3`                  | 每个片段加载的帧数                 |
| `batch_size`       | `int`             | `64`                 | 批处理大小                     |
| `num_workers`      | `int`             | `4`                  | 数据加载工作进程数                 |
| `init_distributed` | `bool`            | `False`              | 是否初始化分布式训练                |
| `output_key`       | `str`             | `"video_clips"`      | 输出字段名（更新后的视频片段）           |

---

## ⚡ `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage,
    figure_root: Optional[str] = None,
    input_video_key: Optional[str] = None,
    video_clips_key: Optional[str] = None,
    clip_model: Optional[str] = None,
    mlp_checkpoint: Optional[str] = None,
    load_num: Optional[int] = None,
    batch_size: Optional[int] = None,
    num_workers: Optional[int] = None,
    init_distributed: Optional[bool] = None,
    output_key: Optional[str] = None
):
    ...
```

执行算子主逻辑：从 storage 读取数据表和提取的视频帧，使用 CLIP + MLP 计算每个片段的美学分数，并写回存储。

## 🧾 `run` 参数说明

所有参数均为可选，用于覆盖初始化时的参数。参数说明与 `__init__` 相同。

---

## 🧠 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import VideoAestheticEvaluator

# Step 1: 准备 FileStorage（需要包含 video, video_clips 列）
# 注意：需要先使用 VideoFrameFilter 提取帧
storage = FileStorage(
    first_entry_file_name="data/video_aesthetic_input.jsonl",
    cache_path="./cache_local",
    file_name_prefix="video_aesthetic",
    cache_type="jsonl"
)

# Step 2: 初始化算子
evaluator = VideoAestheticEvaluator(
    figure_root="./cache/extract_frames",
    input_video_key="video",
    video_clips_key="video_clips",
    clip_model="/path/to/ViT-L-14.pt",
    mlp_checkpoint="/path/to/sac+logos+ava1-l14-linearMSE.pth",
    load_num=3,
    batch_size=64,
    num_workers=4,
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
- `video_clips` (dict): 更新视频片段字典，为每个 clip 添加 `aesthetic_score` 字段

**每个片段（clip）新增字段：**

| 字段                | 类型      | 说明                      |
| :---------------- | :------ | :---------------------- |
| `aesthetic_score` | `float` | 美学分数（值越高表示视觉质量越好）       |

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
        "num_frames": 150
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
        "aesthetic_score": 5.8
      }
    ]
  }
}
```

---

## 🔗 相关链接

- **代码:** [VideoAestheticEvaluator](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_vision/eval/video_aesthetic_evaluator.py)

