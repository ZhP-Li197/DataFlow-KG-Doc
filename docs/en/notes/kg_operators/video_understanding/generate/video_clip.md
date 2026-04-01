---
title: Video Clip Generation (VideoClipGenerator)
createTime: 2025/12/20 10:00:00
permalink: /en/mm_operators/video_understanding/generate/video_clip/
---

## 📘 Overview

`VideoClipGenerator` is an operator for **automatically cutting video clips based on timestamp information** .  
It processes video clip metadata and only cuts clips that are not filtered (`filtered == False`), supporting resolution scaling, frame rate adjustment, and other features. Suitable for video data preprocessing, video clip extraction, and multimodal dataset construction.

---

## 🏗️ `__init__` Function

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

## 🧾 `__init__` Parameters

| Parameter                 | Type    | Default                 | Description                                                    |
| :------------------------ | :------ | :---------------------- | :------------------------------------------------------------- |
| `video_save_dir`          | `str`   | `"./cache/video_clips"` | Directory to save cut video clips                              |
| `drop_invalid_timestamps` | `bool`  | `False`                 | Whether to drop clips with invalid timestamps                  |
| `disable_parallel`        | `bool`  | `True`                  | Whether to disable parallel processing (True for serial)       |
| `num_workers`             | `int`   | `None`                  | Number of worker processes for parallel processing (defaults to CPU count) |
| `target_fps`              | `float` | `None`                  | Target frame rate for video conversion                         |
| `shorter_size`            | `int`   | `None`                  | Shorter side size for scaling (no upsampling, maintains aspect ratio) |

---

## ⚡ `run` Function

```python
def run(
    self,
    storage: DataFlowStorage,
    video_clips_key: str = "video_clip",
    output_key: str = "video_info",
):
    ...
```

`run` is the main logic for video clip cutting:
Read video clip metadata → Filter unfiltered clips → Cut videos using FFmpeg → Save and write to output storage.

## 🧾 `run` Parameters

| Parameter         | Type              | Default        | Description                              |
| :---------------- | :---------------- | :------------- | :--------------------------------------- |
| `storage`         | `DataFlowStorage` | -              | DataFlow storage object                  |
| `video_clips_key` | `str`             | `"video_clip"` | Field name for video clip list in input  |
| `output_key`      | `str`             | `"video_info"` | Output key in storage (for downstream)   |

---

## 🧠 Example Usage

```python
from dataflow.operators.core_vision import VideoClipGenerator
from dataflow.utils.storage import FileStorage

# Step 1: Prepare input data (containing video clip metadata)
storage = FileStorage(
    first_entry_file_name="./video_clips_meta.json",
    cache_path="./cache",
    file_name_prefix="video_clip",
    cache_type="json",
)
storage.step()

# Step 2: Initialize and run operator
video_clip_generator = VideoClipGenerator(
    video_save_dir="./output/video_clips",
    disable_parallel=False,  # Enable parallel processing
    num_workers=4,
    target_fps=30.0,  # Convert to 30fps
    shorter_size=720,  # Scale shorter side to 720p
)
video_clip_generator.run(
    storage=storage,
    video_clips_key="video_clip",
    output_key="video_info"
)
```

---

## 🧾 Default Input Format

The `video_clip` field in input data should be a list, where each element contains the following structure:

| Field               | Type         | Description                                      |
| :------------------ | :----------- | :----------------------------------------------- |
| `success`           | `bool`       | Whether upstream processing succeeded            |
| `clips`             | `List[Dict]` | List of clips, each containing:                  |
| └─ `id`             | `str`        | Unique clip identifier                           |
| └─ `video_path`     | `str`        | Original video file path                         |
| └─ `timestamp_start` | `int/float`  | Clip start time (seconds)                        |
| └─ `timestamp_end`  | `int/float`  | Clip end time (seconds)                          |
| └─ `filtered`       | `bool`       | Whether filtered (True to skip, False to cut)    |
| └─ `width`          | `int`        | Video width (optional)                           |
| └─ `height`         | `int`        | Video height (optional)                          |

---

### 📥 Example Input

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

### 📤 Example Output

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

**Note:** Clips with `filtered` set to `true` (like `video1_1`) will not be cut and won't appear in the output.

---

## 🔧 FFmpeg Dependency

### Installing FFmpeg

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Verify Installation:**
```bash
ffmpeg -version
```

---

## 🔗 Related Links

- **Code:** [VideoClipGenerator](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_vision/generate/video_clip_generator.py)
- **Related Operators:**
  - [VideoToCaptionGenerator](./video_caption.md) - Video Caption Generation
  - [VideoMergedCaptionGenerator](./video_merged_caption.md) - Video Merged Caption Generation

