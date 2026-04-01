---
title: 视频清洗算子
createTime: 2025/10/14 13:57:20
permalink: /zh/mm_operators/wjyzfpp5/
---
# 视频清洗算子

## 概述

视频过滤算子适用于面向视频理解、视频生成、多模态学习等下游任务的数据集质量把控与内容筛选，主要包括：**视频分辨率清洗算子(VideoResolutionFilter)**和**视频运动分数清洗算子(VideoMotionScoreFilter)**。这些算子能够从空间分辨率、运动强度等维度对视频数据进行精准筛选，确保高质量的视频数据用于模型训练。

**视频过滤算子:**

| 名称                   | 适用类型 | 简介                                                         | 官方仓库或论文 |
| ---------------------- | -------- | ------------------------------------------------------------ | -------------- |
| VideoResolutionFilter  | 视频清洗 | 根据视频的宽度和高度过滤样本，保留分辨率在指定范围内的视频。支持设置最小/最大宽度和高度阈值。 | -              |
| VideoMotionScoreFilter | 视频清洗 | 使用Farneback光流算法计算视频运动分数(光流幅度均值),保留运动分数在指定范围内的样本。支持帧大小调整、相对归一化、可配置采样帧率等参数。 | -              |

## 算子接口调用说明

特别地，对于指定存储路径等或是调用模型的算子，我们提供了封装后的**模型接口**、**存储对象接口**和**数据库管理接口**，可以通过这些接口，对所需要使用的配置进行预定义。

### 接口模型配置

可以通过以下方式为算子进行模型API参数预定义，包括生成式模型和嵌入模型:

```python
from dataflow.llmserving import APILLMServing_request

api_llm_serving = APILLMServing_request(
    api_url="https://api.openai.com/v1/chat/completions",
    model_name="gpt-4o",
    max_workers=100
)
```

可以通过如下方式定义本地LLM服务接口：

```python
from dataflow.llmserving import LocalModelLLMServing

local_llm_serving = LocalModelLLMServing_vllm(
    hf_model_name_or_path="/path/to/your/model",
    vllm_max_tokens=1024,
    vllm_tensor_parallel_size=4,
    vllm_gpu_memory_utilization=0.6,
    vllm_repetition_penalty=1.2
)
```

可以通过以下方式为算子进行存储接口预定义：

```python
from dataflow.utils.storage import FileStorage

self.storage = FileStorage(
    first_entry_file_name="your_file_path",
    cache_path="./cache",
    file_name_prefix="dataflow_cache_step",
    cache_type="jsonl", # jsonl, json, ...
)
```

对于每个算子，下文将详细介绍其调用方式和参数列表。

## 详细算子说明

### 1. VideoResolutionFilter (视频分辨率清洗算子)

**功能描述:** 视频分辨率过滤算子(VideoResolutionFilter)是一个高效的视频空间维度筛选工具,支持基于视频分辨率进行精准的质量把控。该算子通过OpenCV视频处理引擎直接读取视频元数据,实现对视频宽度和高度的快速检测与范围判定。

**代码:** [VideoResolutionFilter](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_vision/filter/video_resolution_filter.py)

**输入参数:**

- `__init__()`
  - `min_width`: 最小宽度(默认:1)
  - `max_width`: 最大宽度(默认:sys.maxsize)
  - `min_height`: 最小高度(默认:1)
  - `max_height`: 最大高度(默认:sys.maxsize)
  - `any_or_all`: 多视频保留策略(默认:"any")
- `run()`
  - `storage`: 数据流存储接口对象(必须)
  - `video_key`: 视频路径字段名(默认:"video_path")

**主要特性:**

- 精准分辨率检测:使用OpenCV快速获取视频宽高
- 灵活过滤策略:支持宽度和高度独立范围设置
- 自动错误处理:对无效视频返回-1标记

**使用示例:**

```python
self.video_resolution_filter = VideoResolutionFilter(
    min_width=720,
    max_width=3840,
    min_height=480,
    max_height=2160,
)
self.video_resolution_filter.run(
    storage=self.storage.step(),
    video_key="video_path",
)
```

---

### 2. VideoMotionScoreFilter (视频运动分数清洗算子)

**功能描述:** 视频运动分数过滤算子(VideoMotionScoreFilter)是一个基于光流分析的视频动态特性评估工具,支持通过运动强度筛选视频样本。该算子采用Farneback稠密光流算法,实现相邻帧之间的像素级运动向量计算。

**代码:** [VideoMotionScoreFilter](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_vision/filter/video_motion_score_filter.py)

**输入参数:**

- `__init__()`
  - `min_score`: 最小运动分数(默认:0.25)
  - `max_score`: 最大运动分数(默认:sys.float_info.max)
  - `sampling_fps`: 采样帧率(默认:2.0帧/秒)
  - `size`: 处理前调整帧大小(可选)
  - `relative`: 是否归一化(默认:False)
- `run()`
  - `storage`: 数据流存储接口对象(必须)
  - `video_key`: 视频路径字段名(默认:"video_path")

**主要特性:**

- 光流计算:Farneback算法进行稠密光流分析
- 灵活采样:可配置采样帧率
- 归一化选项:支持相对归一化

**使用示例:**

```python
self.video_motion_filter = VideoMotionScoreFilter(
    min_score=2.0,
    max_score=14.0,
    sampling_fps=2.0,
)
self.video_motion_filter.run(
    storage=self.storage.step(),
    video_key="video_path",
)
```
