---
title: 视频质量评估算子
createTime: 2025/10/14 13:57:19
permalink: /zh/mm_operators/4l6a60qs/
---
# 视频质量评估算子

## 概述

视频质量评估算子适用于面向视频理解、视频生成、多模态学习等下游任务的内容质量评估与对齐度分析，主要包括：**EM分数评估算子(EMScoreEval)**和**视频音频相似度评估算子(VideoAudioSimilarity)**。这些算子能够从文本对齐度、视听一致性等多个维度对视频数据进行精准评估，并将这些质量指标量化为可解释、可配置、易扩展的评估体系，为构建高质量视频数据集提供全方位支持。

**视频质量评估算子:**

| 名称                   | 适用类型     | 简介                                                         | 官方仓库或论文                                |
| ---------------------- | ------------ | ------------------------------------------------------------ | --------------------------------------------- |
| EMScoreEval            | 视频质量评估 | 视频帧级别的EMScore评估算子。从视频中按指定策略(每N秒或每N帧)提取帧,使用CLIP模型计算候选文本与参考文本/视频帧之间的多维度相似度评分,包括局部精确率/召回率、全局一致性等指标。 | [EMScore](https://github.com/ShiYaya/emscore) |
| VideoAudioSimilarity   | 视频评估     | 视频帧与音频相似度评估算子。使用CLIP模型计算视频帧图像与音频描述文本之间的余弦相似度,支持多种帧采样方法(关键帧/均匀采样)和图像翻转增强。 | -                                             |

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

### 1. EMScoreEval (EM分数评估算子)

**功能描述:** EM分数评估算子(EMScoreEval)是一个专业的多模态评估工具,支持从视频内容中提取帧级特征并与文本进行精准对齐评分。该算子基于CLIP视觉语言模型,实现候选文本、参考文本与视频帧之间的多维度相似度计算。

**代码:** [EMScoreEval](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_vision/eval/emscore_evaluator.py)

**输入参数:**

- `__init__()`
  - `every_n_seconds`: 每N秒提取一帧(与every_n_frames二选一)
  - `every_n_frames`: 每N帧提取一帧(与every_n_seconds二选一)
  - `return_all_frames`: 是否返回每帧详细分数(默认:False)
  - `clip_model_path`: CLIP模型路径(可选)
  - `score_types`: 评分类型列表(可选,默认全部)
  - `metrics`: 输出指标列表(可选,默认全部)
- `run()`
  - `storage`: 数据流存储接口对象(必须)
  - `video_key`: 视频路径字段名(默认:"video_path")
  - `candidate_key`: 候选文本字段名(默认:"candidate")
  - `reference_key`: 参考文本字段名(默认:"reference")

**主要特性:**

- 多维度评分:支持文本vs文本、文本vs视频、综合评分三种模式
- 七类指标:精确率/召回率/F1/全局一致性等
- 灵活采样:支持基于时间或帧数的采样策略

**使用示例:**

```python
self.emscore_evaluator = EMScoreEval(
    every_n_seconds=2.0,
    return_all_frames=False,
)
self.emscore_evaluator.run(
    storage=self.storage.step(),
    video_key="video_path",
    candidate_key="generated_caption",
    reference_key="ground_truth",
)
```

---

### 2. VideoAudioSimilarity (视频音频相似度评估算子)

**功能描述:** 视频音频相似度评估算子(VideoAudioSimilarity)是一个跨模态匹配分析工具,支持视频帧与音频内容的语义一致性评估。该算子集成CLIP多模态编码器,实现视频关键帧提取、音频特征编码及跨模态相似度计算。

**代码:** [VideoAudioSimilarity](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_audio/eval/video_audio_similarity_evaluator.py)

**输入参数:**

- `__init__()`
  - `hf_clip`: CLIP模型名称(默认:"openai/clip-vit-base-patch32")
  - `min_score`: 最小相似度分数(默认:0.0)
  - `max_score`: 最大相似度分数(默认:1.0)
  - `frame_sampling_method`: 帧采样方法(默认:"uniform")
  - `frame_num`: 均匀采样的帧数(默认:3)
  - `reduce_mode`: 聚合方式(默认:"avg")
- `run()`
  - `storage`: 数据流存储接口对象(必须)
  - `video_key`: 视频路径字段名(默认:"video_path")
  - `audio_key`: 音频路径字段名(默认:"audio_path")

**主要特性:**

- 多种帧采样:关键帧检测或均匀采样
- 跨模态评估:视频与音频语义匹配度计算
- 灵活聚合:支持平均值/最大值/最小值

**使用示例:**

```python
self.video_audio_similarity = VideoAudioSimilarity(
    frame_sampling_method="uniform",
    frame_num=5,
    reduce_mode="avg",
)
self.video_audio_similarity.run(
    storage=self.storage.step(),
    video_key="video_path",
    audio_key="audio_path",
)
```
