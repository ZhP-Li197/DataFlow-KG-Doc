---
title: Video OCR Evaluator (VideoOCREvaluator)
createTime: 2025/01/20 11:00:00
permalink: /en/mm_operators/video_understanding/eval/video_ocr_evaluator/
---

## 📘 Overview

`VideoOCREvaluator` is a **video OCR evaluation operator** that uses PaddleOCR to detect and recognize text in video clips. It reads upstream extracted video frames, calculates the ratio of text area to frame area for each clip, and writes the OCR scores back into the `video_clips` field.

---

## 🏗️ `__init__` Function

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

## 🧾 `__init__` Parameters

| Parameter          | Type   | Default            | Description                           |
| :----------------- | :----- | :----------------- | :------------------------------------ |
| `figure_root`      | `str`  | `"extract_frames"` | Root directory for extracted frames   |
| `input_video_key`  | `str`  | `"video"`          | Field name for video path             |
| `video_clips_key`  | `str`  | `"video_clips"`    | Field name for video clips            |
| `load_num`         | `int`  | `3`                | Number of frames per clip to load     |
| `batch_size`       | `int`  | `8`                | Batch size for processing             |
| `num_workers`      | `int`  | `4`                | Number of data loading workers        |
| `gpu_num`          | `int`  | `0`                | GPU ID (0+ for GPU, -1 for CPU)       |
| `init_distributed` | `bool` | `False`            | Whether to initialize distributed training |
| `output_key`       | `str`  | `"video_clips"`    | Output field name (updated clips)     |

---

## 🧠 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import VideoOCREvaluator

storage = FileStorage(
    first_entry_file_name="data/video_ocr_input.jsonl",
    cache_path="./cache_local",
    file_name_prefix="video_ocr",
    cache_type="jsonl"
)

evaluator = VideoOCREvaluator(
    figure_root="./cache/extract_frames",
    load_num=3,
    batch_size=8,
    gpu_num=0
)

evaluator.run(storage=storage.step())
```

---

### 🧾 Default Output Format

**Modified Field:**
- `video_clips` (dict): Updated video clips dictionary, adds `ocr_score` to each clip

**New Field in Each Clip:**

| Field       | Type    | Description                             |
| :---------- | :------ | :-------------------------------------- |
| `ocr_score` | `float` | OCR score (text area ratio, 0-1, higher means more text) |

---

## 🔗 Related Links

- **Code:** [VideoOCREvaluator](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_vision/eval/video_ocr_evaluator.py)
- **PaddleOCR:** [https://github.com/PaddlePaddle/PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR)
