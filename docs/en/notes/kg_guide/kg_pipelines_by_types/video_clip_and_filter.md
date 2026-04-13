---
title: Video Clip and Filter Pipeline
createTime: 2025/07/16 15:30:00
permalink: /en/mm_guide/video_clip_and_filter_pipeline/
icon: carbon:video-filled
---

# Video Clip and Filter Pipeline

## 1. Overview

The **Video Clip and Filter Pipeline** provides a complete video processing solution that intelligently segments videos through scene detection and filters high-quality clips based on multi-dimensional quality assessment (aesthetic, luminance, OCR, etc.), suitable for video data cleaning, high-quality clip extraction, and video dataset construction.

We support the following use cases:

- Automatic segmentation of long videos into scene clips
- Multi-dimensional video quality assessment and filtering
- High-quality video dataset construction
- Video content cleaning and curation

The main stages of the pipeline include:

1. **Video Info Extraction**: Extract basic video information (resolution, FPS, duration, etc.).
2. **Scene Detection**: Intelligently segment videos based on scene changes.
3. **Clip Metadata Generation**: Generate metadata for each scene clip.
4. **Frame Extraction**: Extract representative frames from each clip.
5. **Aesthetic Scoring**: Evaluate the aesthetic quality of video clips.
6. **Luminance Evaluation**: Analyze the brightness distribution of video clips.
7. **OCR Analysis**: Detect text content in videos.
8. **Quality Filtering**: Filter low-quality clips based on multi-dimensional scores.
9. **Video Cutting and Saving**: Save high-quality video clips.

---

## 2. Quick Start

### Step 1: Create a new DataFlow workspace
```bash
mkdir run_dataflow_mm
cd run_dataflow_mm
```

### Step 2: Initialize DataFlow-MM
```bash
dataflow init
```
You will see:
```bash
run_dataflow_mm/pipelines/gpu_pipelines/video_clip_and_filter_pipeline.py  
```

### Step 3: Configure model paths and filter parameters

In `video_clip_and_filter_pipeline.py`, configure the aesthetic scoring model and filter thresholds:

```python
generator = VideoFilteredClipGenerator(
    clip_model="/path/to/ViT-L-14.pt",              # CLIP model path
    mlp_checkpoint="/path/to/sac+logos+ava1-l14-linearMSE.pth",  # MLP checkpoint
    aes_min=4,                                       # Minimum aesthetic score
    ocr_max=0.3,                                     # Maximum OCR ratio
    lum_min=20,                                      # Minimum luminance
    lum_max=140,                                     # Maximum luminance
    motion_min=2,                                    # Minimum motion score
    motion_max=14,                                   # Maximum motion score
    strict_mode=False,                               # Strict mode
    seed=42,                                         # Random seed
    video_save_dir="./cache/video_clips",           # Video save directory
)
```

### Step 4: One-click run
```bash
python pipelines/gpu_pipelines/video_clip_and_filter_pipeline.py
```

You can adjust filter parameters based on your needs. Below we introduce each step in the pipeline and parameter configuration in detail.

---

## 3. Data Flow and Pipeline Logic

### 1. **Input Data**

The pipeline input includes the following fields:

* **video**: Video file path

Inputs can be stored in designated files (such as `json` or `jsonl`) and managed and read via the `FileStorage` object:

```python
storage = FileStorage(
    first_entry_file_name="./dataflow/example/video_split/sample_data.json",
    cache_path="./cache",
    file_name_prefix="video_filter",
    cache_type="json",
)
```

**Input Data Example**:

```json
[
    {"video": "./videos/long_video1.mp4"},
    {"video": "./videos/long_video2.mp4"}
]
```

### 2. **Video Processing Pipeline (VideoFilteredClipGenerator)**

The core of the pipeline is the **VideoFilteredClipGenerator** operator, which integrates 9 processing steps.

#### Step 1: Video Info Extraction (VideoInfoFilter)

**Functionality:**
* Extract basic video information (resolution, FPS, total frames, duration, etc.)

**Input:** Video file path  
**Output:** Video info metadata

```python
self.video_info_filter = VideoInfoFilter(
    backend="opencv",  # Video processing backend (opencv, torchvision, av)
    ext=False,         # Whether to filter non-existent files
)
```

#### Step 2: Scene Detection (VideoSceneFilter)

**Functionality:**
* Automatically segment videos based on scene change detection
* Configurable minimum/maximum scene duration

**Input:** Video file path and video info  
**Output:** Scene segmentation info

```python
self.video_scene_filter = VideoSceneFilter(
    frame_skip=0,              # Number of frames to skip
    start_remove_sec=0.0,      # Seconds to remove from scene start
    end_remove_sec=0.0,        # Seconds to remove from scene end
    min_seconds=2.0,           # Minimum scene duration
    max_seconds=15.0,          # Maximum scene duration
    disable_parallel=True,     # Disable parallel processing
)
```

#### Step 3: Clip Metadata Generation (VideoClipFilter)

**Functionality:**
* Generate detailed metadata for each scene clip

**Input:** Video info and scene info  
**Output:** Clip metadata

```python
self.video_clip_filter = VideoClipFilter()
```

#### Step 4: Frame Extraction (VideoFrameFilter)

**Functionality:**
* Extract key frames from each video clip for subsequent analysis

**Input:** Video clip metadata  
**Output:** Extracted frame images

```python
self.video_frame_filter = VideoFrameFilter(
    output_dir="./cache/extract_frames",  # Frame image save directory
)
```

#### Step 5: Aesthetic Scoring (VideoAestheticEvaluator)

**Functionality:**
* Evaluate the aesthetic quality of video clips using CLIP + MLP model
* Score range typically 0-10

**Input:** Extracted frame images  
**Output:** Aesthetic scores

```python
self.video_aesthetic_evaluator = VideoAestheticEvaluator(
    figure_root="./cache/extract_frames",
    clip_model="/path/to/ViT-L-14.pt",
    mlp_checkpoint="/path/to/sac+logos+ava1-l14-linearMSE.pth",
)
```

#### Step 6: Luminance Evaluation (VideoLuminanceEvaluator)

**Functionality:**
* Calculate average luminance of video clips
* Filter videos that are too dark or too bright

**Input:** Extracted frame images  
**Output:** Luminance statistics

```python
self.video_luminance_evaluator = VideoLuminanceEvaluator(
    figure_root="./cache/extract_frames",
)
```

#### Step 7: OCR Analysis (VideoOCREvaluator)

**Functionality:**
* Detect text content ratio in videos
* Can be used to filter videos with excessive text (e.g., subtitles, UI)

**Input:** Extracted frame images  
**Output:** OCR score (text ratio)

```python
self.video_ocr_evaluator = VideoOCREvaluator(
    figure_root="./cache/extract_frames",
)
```

#### Step 8: Quality Filtering (VideoScoreFilter)

**Functionality:**
* Filter low-quality clips based on multi-dimensional scores
* Supports various filtering conditions including aesthetic, luminance, OCR, motion, etc.

**Input:** All scoring data  
**Output:** Filtered clip list

```python
self.video_score_filter = VideoScoreFilter(
    frames_min=None,           # Minimum number of frames
    frames_max=None,           # Maximum number of frames
    fps_min=None,              # Minimum FPS
    fps_max=None,              # Maximum FPS
    resolution_max=None,       # Maximum resolution
    aes_min=4,                 # Minimum aesthetic score
    ocr_min=None,              # Minimum OCR score
    ocr_max=0.3,               # Maximum OCR score
    lum_min=20,                # Minimum luminance
    lum_max=140,               # Maximum luminance
    motion_min=2,              # Minimum motion score
    motion_max=14,             # Maximum motion score
    flow_min=None,             # Minimum flow score
    flow_max=None,             # Maximum flow score
    blur_max=None,             # Maximum blur score
    strict_mode=False,         # Strict mode
    seed=42,                   # Random seed
)
```

#### Step 9: Video Cutting and Saving (VideoClipGenerator)

**Functionality:**
* Cut and save videos based on filtered clip information

**Input:** Filtered clip information  
**Output:** Cut video file paths

```python
self.video_clip_generator = VideoClipGenerator(
    video_save_dir="./cache/video_clips",  # Video save directory
)
```

### 3. **Output Data**

The final output includes:

* **video**: List of cut video clip paths
* **video_info**: Basic video information
* **video_scene**: Scene detection results
* **video_clip**: Clip metadata (including all scores)
* **video_frame_export**: Extracted frame image paths

**Output Data Example**:

```json
{
    "video": ["./cache/video_clips/clip_001.mp4", "./cache/video_clips/clip_002.mp4"],
    "video_info": {
        "fps": 30,
        "resolution": [1920, 1080],
        "duration": 120.5,
        "frames": 3615
    },
    "video_clip": [
        {
            "start_frame": 0,
            "end_frame": 90,
            "aes_score": 5.6,
            "lum_mean": 85.3,
            "ocr_score": 0.1,
            "motion_score": 4.2
        },
        {
            "start_frame": 120,
            "end_frame": 240,
            "aes_score": 6.2,
            "lum_mean": 92.1,
            "ocr_score": 0.05,
            "motion_score": 5.8
        }
    ]
}
```

---

## 4. Pipeline Example

An example pipeline demonstrating how to use VideoFilteredClipGenerator for video clipping and filtering:

```python
from dataflow.operators.core_vision import VideoInfoFilter
from dataflow.operators.core_vision import VideoSceneFilter
from dataflow.operators.core_vision import VideoClipFilter
from dataflow.operators.core_vision import VideoFrameFilter
from dataflow.operators.core_vision import VideoAestheticEvaluator
from dataflow.operators.core_vision import VideoLuminanceEvaluator
from dataflow.operators.core_vision import VideoOCREvaluator
from dataflow.operators.core_vision import VideoScoreFilter
from dataflow.operators.core_vision import VideoClipGenerator
from dataflow.core.Operator import OperatorABC
from dataflow.utils.storage import FileStorage

class VideoFilteredClipGenerator(OperatorABC):
    def __init__(
        self,
        backend="opencv",
        ext=False,
        frame_skip=0,
        start_remove_sec=0.0,
        end_remove_sec=0.0,
        min_seconds=2.0,
        max_seconds=15.0,
        frame_output_dir="./cache/extract_frames",
        clip_model="/path/to/ViT-L-14.pt",
        mlp_checkpoint="/path/to/sac+logos+ava1-l14-linearMSE.pth",
        frames_min=None,
        frames_max=None,
        fps_min=None,
        fps_max=None,
        resolution_max=None,
        aes_min=4,
        ocr_min=None,
        ocr_max=0.3,
        lum_min=20,
        lum_max=140,
        motion_min=2,
        motion_max=14,
        flow_min=None,
        flow_max=None,
        blur_max=None,
        strict_mode=False,
        seed=42,
        video_save_dir="./cache/video_clips",
    ):
        # Initialize all sub-operators
        self.video_info_filter = VideoInfoFilter(
            backend=backend,
            ext=ext,
        )
        self.video_scene_filter = VideoSceneFilter(
            frame_skip=frame_skip,
            start_remove_sec=start_remove_sec,
            end_remove_sec=end_remove_sec,
            min_seconds=min_seconds,
            max_seconds=max_seconds,
            disable_parallel=True,
        )
        self.video_clip_filter = VideoClipFilter()
        self.video_frame_filter = VideoFrameFilter(
            output_dir=frame_output_dir,
        )
        self.video_aesthetic_evaluator = VideoAestheticEvaluator(
            figure_root=frame_output_dir,
            clip_model=clip_model,
            mlp_checkpoint=mlp_checkpoint,
        )
        self.video_luminance_evaluator = VideoLuminanceEvaluator(
            figure_root=frame_output_dir,
        )
        self.video_ocr_evaluator = VideoOCREvaluator(
            figure_root=frame_output_dir,
        )
        self.video_score_filter = VideoScoreFilter(
            frames_min=frames_min,
            frames_max=frames_max,
            fps_min=fps_min,
            fps_max=fps_max,
            resolution_max=resolution_max,
            aes_min=aes_min,
            ocr_min=ocr_min,
            ocr_max=ocr_max,
            lum_min=lum_min,
            lum_max=lum_max,
            motion_min=motion_min,
            motion_max=motion_max,
            flow_min=flow_min,
            flow_max=flow_max,
            blur_max=blur_max,
            strict_mode=strict_mode,
            seed=seed,
        )
        self.video_clip_generator = VideoClipGenerator(
            video_save_dir=video_save_dir,
        )
    
    def run(
        self,
        storage,
        input_video_key="video",
        output_key="video",
    ):
        # Step 1: Extract video info
        self.video_info_filter.run(
            storage=storage.step(),
            input_video_key=input_video_key,
            output_key="video_info",
        )
        
        # Step 2: Detect video scenes
        self.video_scene_filter.run(
            storage=storage.step(),
            input_video_key=input_video_key,
            video_info_key="video_info",
            output_key="video_scene",
        )
        
        # Step 3: Generate clip metadata
        self.video_clip_filter.run(
            storage=storage.step(),
            input_video_key=input_video_key,
            video_info_key="video_info",
            video_scene_key="video_scene",
            output_key="video_clip",
        )
        
        # Step 4: Extract key frames
        self.video_frame_filter.run(
            storage=storage.step(),
            input_video_key=input_video_key,
            video_info_key="video_info",
            video_clips_key="video_clip",
            output_key="video_frame_export",
        )
        
        # Step 5: Compute aesthetic scores
        self.video_aesthetic_evaluator.run(
            storage=storage.step(),
            input_video_key=input_video_key,
            video_clips_key="video_clip",
            output_key="video_clip",
        )
        
        # Step 6: Compute luminance statistics
        self.video_luminance_evaluator.run(
            storage=storage.step(),
            input_video_key=input_video_key,
            video_clips_key="video_clip",
            output_key="video_clip",
        )
        
        # Step 7: Compute OCR scores
        self.video_ocr_evaluator.run(
            storage=storage.step(),
            input_video_key=input_video_key,
            video_clips_key="video_clip",
            output_key="video_clip",
        )
        
        # Step 8: Filter based on scores
        self.video_score_filter.run(
            storage=storage.step(),
            input_video_key=input_video_key,
            video_clips_key="video_clip",
            output_key="video_clip",
        )
        
        # Step 9: Cut and save videos
        self.video_clip_generator.run(
            storage=storage.step(),
            video_clips_key="video_clip",
            output_key=output_key,
        )
        
        return output_key

if __name__ == "__main__":
    storage = FileStorage(
        first_entry_file_name="./dataflow/example/video_split/sample_data.json",
        cache_path="./cache",
        file_name_prefix="video_filter",
        cache_type="json",
    )
    
    generator = VideoFilteredClipGenerator(
        clip_model="/path/to/ViT-L-14.pt",
        mlp_checkpoint="/path/to/sac+logos+ava1-l14-linearMSE.pth",
        aes_min=4,
        ocr_max=0.3,
        lum_min=20,
        lum_max=140,
        motion_min=2,
        motion_max=14,
        strict_mode=False,
        seed=42,
        video_save_dir="./cache/video_clips",
    )
    
    generator.run(
        storage=storage,
        input_video_key="video",
        output_key="video",
    )
```