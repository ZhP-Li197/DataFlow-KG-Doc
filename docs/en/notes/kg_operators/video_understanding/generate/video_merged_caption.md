---
title: Video Merged Caption Generation (VideoMergedCaptionGenerator)
createTime: 2025/12/20 11:00:00
permalink: /en/mm_operators/video_understanding/generate/video_merged_caption/
---

## 📘 Overview

`VideoMergedCaptionGenerator` is an operator for **merging captions from multiple clips of the same video** .  
It organizes captions by timestamp information, sorts them chronologically, and formats them as "From X to Y, caption..." text. Suitable for long video understanding, video summarization, multimodal reasoning, and more.

**Current Version:** Only supports merging by timestamp. Future versions will support merging by other attributes (e.g., scene, topic, etc.).

---

## 🏗️ `__init__` Function

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

## 🧾 `__init__` Parameters

| Parameter              | Type  | Default             | Description                                    |
| :--------------------- | :---- | :------------------ | :--------------------------------------------- |
| `caption_key`          | `str` | `"caption"`         | Field name for caption text                    |
| `id_key`               | `str` | `"id"`              | Field name for clip ID                         |
| `timestamp_start_key`  | `str` | `"timestamp_start"` | Field name for clip start time                 |
| `timestamp_end_key`    | `str` | `"timestamp_end"`   | Field name for clip end time                   |
| `duration_key`         | `str` | `"duration_sec"`    | Field name for clip duration (fallback method) |

---

## ⚡ `run` Function

```python
def run(
    self,
    storage: DataFlowStorage,
    caption_key: Optional[str] = None,
    id_key: Optional[str] = None,
):
    ...
```

`run` is the main logic for caption merging:
Read clip caption data → Group by original video → Sort by time → Format as text → Write to output storage.

## 🧾 `run` Parameters

| Parameter     | Type              | Default | Description                                        |
| :------------ | :---------------- | :------ | :------------------------------------------------- |
| `storage`     | `DataFlowStorage` | -       | DataFlow storage object                            |
| `caption_key` | `str`             | `None`  | Override caption field name (optional, uses init)  |
| `id_key`      | `str`             | `None`  | Override ID field name (optional, uses init)       |

---

## 🧠 Example Usage

```python
from dataflow.operators.core_vision import VideoMergedCaptionGenerator
from dataflow.utils.storage import FileStorage

# Step 1: Prepare input data (containing multiple clip captions)
storage = FileStorage(
    first_entry_file_name="./clip_captions.json",
    cache_path="./cache",
    file_name_prefix="merged_caption",
    cache_type="json",
)
storage.step()

# Step 2: Initialize and run operator
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

## 🧾 Input Format Requirements

Input should be a DataFrame where each row represents a video clip's caption information:

| Field               | Type        | Description                                        |
| :------------------ | :---------- | :------------------------------------------------- |
| `id`                | `str`       | Clip ID, format: `video_name_X` (X is clip index) |
| `caption`           | `str`       | Caption text for the clip                          |
| `timestamp_start`   | `int/float` | Clip start time (seconds), supports int or `"HH:MM:SS.mmm"` |
| `timestamp_end`     | `int/float` | Clip end time (seconds), supports int or `"HH:MM:SS.mmm"` |
| `duration_sec`      | `float`     | Clip duration (seconds), used only if `timestamp_end` unavailable (optional) |

---

### 📥 Example Input

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

### 📤 Example Output

```json
{
  "id": "movie_trailer",
  "captions": "From 0 to 10, a person is walking in a park on a sunny day.\nFrom 10 to 20, the person sits on a bench and reads a book.\nFrom 20 to 30, a dog runs towards the person and they play together.",
  "num_clips": 3
}
```

---

## 🔄 Typical Workflow

```python
from dataflow.operators.core_vision import (
    VideoClipGenerator,          # Step 1: Cut video clips
    VideoToCaptionGenerator,     # Step 2: Generate caption for each clip
    VideoMergedCaptionGenerator  # Step 3: Merge captions
)

# Step 1: Cut video clips
clip_generator = VideoClipGenerator(video_save_dir="./clips")
clip_generator.run(storage.step())

# Step 2: Generate caption for each clip
caption_generator = VideoToCaptionGenerator(vlm_serving=vlm_serving)
caption_generator.run(storage.step())

# Step 3: Merge all captions from the same video
merged_caption_generator = VideoMergedCaptionGenerator()
merged_caption_generator.run(storage.step())
```

---

## 🔗 Related Links

- **Code:** [VideoMergedCaptionGenerator](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_vision/generate/video_merged_caption_generator.py)
- **Related Operators:**
  - [VideoClipGenerator](./video_clip.md) - Video Clip Cutting
  - [VideoToCaptionGenerator](./video_caption.md) - Video Caption Generation
  - [VideoCaptionToQAGenerator](./video_qa.md) - Caption-based QA Generation

