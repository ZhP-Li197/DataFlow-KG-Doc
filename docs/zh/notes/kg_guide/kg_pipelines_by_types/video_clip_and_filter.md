---
title: 视频分割与过滤流水线
createTime: 2025/07/16 15:30:00
permalink: /zh/mm_guide/video_clip_and_filter_pipeline/
icon: carbon:video-filled
---

# 视频分割与过滤流水线

## 1. 概述

**视频分割与过滤流水线**提供了完整的视频处理解决方案，通过场景检测智能分割视频，并基于多维度质量评估（美学、亮度、OCR等）过滤出高质量片段，适用于视频数据清洗、高质量片段提取和视频数据集构建。

我们支持以下应用场景：

- 长视频自动分割成场景片段
- 多维度视频质量评估与过滤
- 高质量视频数据集构建
- 视频内容清洗与筛选

流水线的主要流程包括：

1. **视频信息提取**：提取视频的基础信息（分辨率、帧率、时长等）。
2. **场景检测**：基于场景变化智能分割视频。
3. **片段元数据生成**：为每个场景片段生成元数据。
4. **关键帧提取**：从每个片段中提取代表性帧。
5. **美学评分**：评估视频片段的美学质量。
6. **亮度评估**：分析视频片段的亮度分布。
7. **OCR分析**：检测视频中的文字内容。
8. **质量过滤**：基于多维度评分过滤低质量片段。
9. **视频切割保存**：保存高质量的视频片段。

---

## 2. 快速开始

### 第一步：创建新的 DataFlow 工作文件夹
```bash
mkdir run_dataflow_mm
cd run_dataflow_mm
```

### 第二步：初始化 DataFlow-MM
```bash
dataflow init
```
这时你会看到：
```bash
run_dataflow_mm/pipelines/gpu_pipelines/video_clip_and_filter_pipeline.py  
```

### 第三步：配置模型路径和过滤参数

在 `video_clip_and_filter_pipeline.py` 中配置美学评分模型和过滤阈值：

```python
generator = VideoFilteredClipGenerator(
    clip_model="/path/to/ViT-L-14.pt",              # CLIP 模型路径
    mlp_checkpoint="/path/to/sac+logos+ava1-l14-linearMSE.pth",  # MLP 检查点
    aes_min=4,                                       # 最低美学分数
    ocr_max=0.3,                                     # 最高 OCR 比例
    lum_min=20,                                      # 最低亮度
    lum_max=140,                                     # 最高亮度
    motion_min=2,                                    # 最低运动分数
    motion_max=14,                                   # 最高运动分数
    strict_mode=False,                               # 严格模式
    seed=42,                                         # 随机种子
    video_save_dir="./cache/video_clips",           # 视频保存目录
)
```

### 第四步：一键运行
```bash
python pipelines/gpu_pipelines/video_clip_and_filter_pipeline.py
```

此外，你可以根据自己的需求调整过滤参数。接下来，我们会详细介绍流水线中的各个步骤和参数配置。

---

## 3. 数据流与流水线逻辑

### 1. **输入数据**

该流程的输入数据包括以下字段：

* **video**：视频文件路径

这些输入数据可以存储在指定的文件中（如 `json` 或 `jsonl`），并通过 `FileStorage` 对象进行管理和读取：

```python
storage = FileStorage(
    first_entry_file_name="./dataflow/example/video_split/sample_data.json",
    cache_path="./cache",
    file_name_prefix="video_filter",
    cache_type="json",
)
```

**输入数据示例**：

```json
[
    {"video": "./videos/long_video1.mp4"},
    {"video": "./videos/long_video2.mp4"}
]
```

### 2. **视频处理流水线（VideoFilteredClipGenerator）**

流程的核心是 **VideoFilteredClipGenerator** 算子，它整合了9个处理步骤。

#### 步骤 1：视频信息提取（VideoInfoFilter）

**功能：**
* 提取视频的基础信息（分辨率、帧率、总帧数、时长等）

**输入**：视频文件路径  
**输出**：视频信息元数据

```python
self.video_info_filter = VideoInfoFilter(
    backend="opencv",  # 视频处理后端（opencv, torchvision, av）
    ext=False,         # 是否过滤不存在的文件
)
```

#### 步骤 2：场景检测（VideoSceneFilter）

**功能：**
* 基于场景变化检测自动分割视频
* 可配置最小/最大场景时长

**输入**：视频文件路径和视频信息  
**输出**：场景分割信息

```python
self.video_scene_filter = VideoSceneFilter(
    frame_skip=0,              # 跳帧数量
    start_remove_sec=0.0,      # 场景开始去除秒数
    end_remove_sec=0.0,        # 场景结束去除秒数
    min_seconds=2.0,           # 最小场景时长
    max_seconds=15.0,          # 最大场景时长
    disable_parallel=True,     # 禁用并行处理
)
```

#### 步骤 3：片段元数据生成（VideoClipFilter）

**功能：**
* 为每个场景片段生成详细的元数据信息

**输入**：视频信息和场景信息  
**输出**：片段元数据

```python
self.video_clip_filter = VideoClipFilter()
```

#### 步骤 4：关键帧提取（VideoFrameFilter）

**功能：**
* 从每个视频片段中提取关键帧用于后续分析

**输入**：视频片段元数据  
**输出**：提取的帧图像

```python
self.video_frame_filter = VideoFrameFilter(
    output_dir="./cache/extract_frames",  # 帧图像保存目录
)
```

#### 步骤 5：美学评分（VideoAestheticEvaluator）

**功能：**
* 使用 CLIP + MLP 模型评估视频片段的美学质量
* 分数范围通常为 0-10

**输入**：提取的帧图像  
**输出**：美学分数

```python
self.video_aesthetic_evaluator = VideoAestheticEvaluator(
    figure_root="./cache/extract_frames",
    clip_model="/path/to/ViT-L-14.pt",
    mlp_checkpoint="/path/to/sac+logos+ava1-l14-linearMSE.pth",
)
```

#### 步骤 6：亮度评估（VideoLuminanceEvaluator）

**功能：**
* 计算视频片段的平均亮度
* 过滤过暗或过亮的视频

**输入**：提取的帧图像  
**输出**：亮度统计信息

```python
self.video_luminance_evaluator = VideoLuminanceEvaluator(
    figure_root="./cache/extract_frames",
)
```

#### 步骤 7：OCR 分析（VideoOCREvaluator）

**功能：**
* 检测视频中的文字内容比例
* 可用于过滤含有大量文字的视频（如字幕、UI等）

**输入**：提取的帧图像  
**输出**：OCR 分数（文字占比）

```python
self.video_ocr_evaluator = VideoOCREvaluator(
    figure_root="./cache/extract_frames",
)
```

#### 步骤 8：质量过滤（VideoScoreFilter）

**功能：**
* 基于多维度评分过滤低质量片段
* 支持美学、亮度、OCR、运动等多种过滤条件

**输入**：所有评分数据  
**输出**：过滤后的片段列表

```python
self.video_score_filter = VideoScoreFilter(
    frames_min=None,           # 最小帧数
    frames_max=None,           # 最大帧数
    fps_min=None,              # 最小帧率
    fps_max=None,              # 最大帧率
    resolution_max=None,       # 最大分辨率
    aes_min=4,                 # 最低美学分数
    ocr_min=None,              # 最低 OCR 分数
    ocr_max=0.3,               # 最高 OCR 分数
    lum_min=20,                # 最低亮度
    lum_max=140,               # 最高亮度
    motion_min=2,              # 最低运动分数
    motion_max=14,             # 最高运动分数
    flow_min=None,             # 最低光流分数
    flow_max=None,             # 最高光流分数
    blur_max=None,             # 最高模糊度
    strict_mode=False,         # 严格模式
    seed=42,                   # 随机种子
)
```

#### 步骤 9：视频切割保存（VideoClipGenerator）

**功能：**
* 根据过滤后的片段信息切割并保存视频

**输入**：过滤后的片段信息  
**输出**：切割后的视频文件路径

```python
self.video_clip_generator = VideoClipGenerator(
    video_save_dir="./cache/video_clips",  # 视频保存目录
)
```

### 3. **输出数据**

最终，流水线生成的输出数据将包含以下内容：

* **video**：切割后的视频片段路径列表
* **video_info**：视频基础信息
* **video_scene**：场景检测结果
* **video_clip**：片段元数据（包含所有评分信息）
* **video_frame_export**：提取的帧图像路径

**输出数据示例**：

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

## 4. 流水线示例

以下给出示例流水线，展示如何使用 VideoFilteredClipGenerator 进行视频分割与过滤。

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
        # 初始化所有子算子
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
        # 步骤 1: 提取视频信息
        self.video_info_filter.run(
            storage=storage.step(),
            input_video_key=input_video_key,
            output_key="video_info",
        )
        
        # 步骤 2: 检测视频场景
        self.video_scene_filter.run(
            storage=storage.step(),
            input_video_key=input_video_key,
            video_info_key="video_info",
            output_key="video_scene",
        )
        
        # 步骤 3: 生成片段元数据
        self.video_clip_filter.run(
            storage=storage.step(),
            input_video_key=input_video_key,
            video_info_key="video_info",
            video_scene_key="video_scene",
            output_key="video_clip",
        )
        
        # 步骤 4: 提取关键帧
        self.video_frame_filter.run(
            storage=storage.step(),
            input_video_key=input_video_key,
            video_info_key="video_info",
            video_clips_key="video_clip",
            output_key="video_frame_export",
        )
        
        # 步骤 5: 计算美学评分
        self.video_aesthetic_evaluator.run(
            storage=storage.step(),
            input_video_key=input_video_key,
            video_clips_key="video_clip",
            output_key="video_clip",
        )
        
        # 步骤 6: 计算亮度统计
        self.video_luminance_evaluator.run(
            storage=storage.step(),
            input_video_key=input_video_key,
            video_clips_key="video_clip",
            output_key="video_clip",
        )
        
        # 步骤 7: 计算 OCR 分数
        self.video_ocr_evaluator.run(
            storage=storage.step(),
            input_video_key=input_video_key,
            video_clips_key="video_clip",
            output_key="video_clip",
        )
        
        # 步骤 8: 基于分数过滤
        self.video_score_filter.run(
            storage=storage.step(),
            input_video_key=input_video_key,
            video_clips_key="video_clip",
            output_key="video_clip",
        )
        
        # 步骤 9: 切割并保存视频
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