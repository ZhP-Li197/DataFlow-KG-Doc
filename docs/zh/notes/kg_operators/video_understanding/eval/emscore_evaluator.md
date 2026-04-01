---
title: EMScore评估器（EMScoreEval）
createTime: 2025/01/20 11:00:00
permalink: /zh/mm_operators/video_understanding/eval/emscore_evaluator/
---

## 📘 概述

`EMScoreEval` 是一个**视频帧级别的 EMScore 评估算子**。它从视频中按指定策略提取帧，使用 CLIP 模型计算候选文本与参考文本、视频帧之间的语义相似度，提供细粒度（fine-grained）和粗粒度（coarse-grained）的评分指标。

---

## 🏗️ `__init__` 函数

```python
def __init__(
    self,
    every_n_seconds: Optional[float] = None,
    every_n_frames: Optional[int] = None,
    return_all_frames: bool = False,
    clip_model_path: Optional[str] = None,
    score_types: Optional[List[str]] = None,
    metrics: Optional[List[str]] = None
):
    ...
```

## 🧾 `__init__` 参数说明

| 参数名                  | 类型                | 默认值    | 说明                                    |
| :------------------- | :---------------- | :----- | :------------------------------------ |
| `every_n_seconds`    | `Optional[float]` | `None` | 每N秒提取一帧（与 `every_n_frames` 二选一）       |
| `every_n_frames`     | `Optional[int]`   | `None` | 每N帧提取一帧（与 `every_n_seconds` 二选一）      |
| `return_all_frames`  | `bool`            | `False`| 是否在DataFrame中返回每帧详细分数               |
| `clip_model_path`    | `Optional[str]`   | `None` | CLIP模型路径，默认自动查找                      |
| `score_types`        | `Optional[List]`  | `None` | 要计算的评分类型列表，默认全部                       |
| `metrics`            | `Optional[List]`  | `None` | 要输出的指标列表，默认全部                         |

### 可选的评分类型 (`score_types`)

| 评分类型                  | 说明                   |
| :-------------------- | :------------------- |
| `EMScore(X,X*)`       | 候选文本 vs 参考文本         |
| `EMScore(X,V)`        | 候选文本 vs 视频帧          |
| `EMScore(X,V,X*)`     | 综合评分（结合文本和视频）        |

### 可选的指标 (`metrics`)

| 指标        | 说明                   |
| :-------- | :------------------- |
| `figr_P`  | 细粒度精确率（Fine-grained Precision） |
| `figr_R`  | 细粒度召回率（Fine-grained Recall）    |
| `figr_F`  | 细粒度F1分数（Fine-grained F1）      |
| `cogr`    | 粗粒度一致性（Coarse-grained）       |
| `full_P`  | 综合精确率（Fine-grained + Coarse-grained） |
| `full_R`  | 综合召回率（Fine-grained + Coarse-grained） |
| `full_F`  | 综合F1分数（Fine-grained + Coarse-grained） |

---

## ⚡ `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage,
    video_key: str = 'video_path',
    candidate_key: str = 'candidate',
    reference_key: str = 'reference'
):
    ...
```

执行算子主逻辑：从 storage 读取视频路径、候选文本和参考文本，提取视频帧特征，计算 EMScore 评分，并写回存储。

## 🧾 `run` 参数说明

| 参数名            | 类型                | 默认值            | 说明                      |
| :------------- | :---------------- | :------------- | :---------------------- |
| `storage`      | `DataFlowStorage` | -              | Dataflow 数据存储对象          |
| `video_key`    | `str`             | `"video_path"` | 输入数据中视频路径字段名            |
| `candidate_key`| `str`             | `"candidate"`  | 输入数据中候选文本字段名            |
| `reference_key`| `str`             | `"reference"`  | 输入数据中参考文本字段名（可选）        |

---

## 🧠 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import EMScoreEval

# Step 1: 准备 FileStorage（需要包含 video_path, candidate, reference 列）
storage = FileStorage(
    first_entry_file_name="data/emscore_input.jsonl",
    cache_path="./cache_local",
    file_name_prefix="emscore",
    cache_type="jsonl"
)

# Step 2: 初始化算子
evaluator = EMScoreEval(
    every_n_seconds=2.0,  # 每2秒提取一帧
    return_all_frames=True,  # 返回每帧详细分数
    clip_model_path=None,  # 使用默认 CLIP 模型
    score_types=['EMScore(X,X*)', 'EMScore(X,V)', 'EMScore(X,V,X*)'],  # 计算所有评分类型
    metrics=['figr_F', 'cogr', 'full_F']  # 输出主要指标
)

# Step 3: 执行评估
evaluator.run(
    storage=storage.step(),
    video_key="video_path",
    candidate_key="candidate",
    reference_key="reference"
)
```

---

### 🧾 默认输出格式（Output Format）

**新增字段：**

每种评分类型和指标的组合会生成一个字段，例如：

| 字段                           | 类型      | 说明                      |
| :--------------------------- | :------ | :---------------------- |
| `EMScore(X,X*)_figr_P`       | `float` | 候选vs参考文本的细粒度精确率         |
| `EMScore(X,X*)_figr_R`       | `float` | 候选vs参考文本的细粒度召回率         |
| `EMScore(X,X*)_figr_F`       | `float` | 候选vs参考文本的细粒度F1分数        |
| `EMScore(X,X*)_cogr`         | `float` | 候选vs参考文本的粗粒度一致性         |
| `EMScore(X,X*)_full_F`       | `float` | 候选vs参考文本的综合F1分数         |
| `EMScore(X,V)_figr_F`        | `float` | 候选文本vs视频的细粒度F1分数        |
| `EMScore(X,V)_cogr`          | `float` | 候选文本vs视频的粗粒度一致性         |
| `EMScore(X,V,X*)_full_F`     | `float` | 综合评分（文本+视频）的完整F1分数     |
| `frame_details`              | `str`   | 每帧详细分数（JSON字符串，仅当 `return_all_frames=True` 时） |

示例输入：

```jsonl
{
  "video_path": "./test/video1.mp4",
  "candidate": "A cat is playing with a ball in the garden",
  "reference": "A cat plays with a red ball outdoors"
}
```

示例输出（`return_all_frames=False`）：

```jsonl
{
  "video_path": "./test/video1.mp4",
  "candidate": "A cat is playing with a ball in the garden",
  "reference": "A cat plays with a red ball outdoors",
  "EMScore(X,X*)_figr_F": 0.85,
  "EMScore(X,X*)_cogr": 0.92,
  "EMScore(X,X*)_full_F": 0.88,
  "EMScore(X,V)_figr_F": 0.78,
  "EMScore(X,V)_cogr": 0.89,
  "EMScore(X,V)_full_F": 0.83,
  "EMScore(X,V,X*)_figr_F": 0.81,
  "EMScore(X,V,X*)_cogr": 0.90,
  "EMScore(X,V,X*)_full_F": 0.86
}
```

---

## 🔗 相关链接

- **代码:** [EMScoreEval](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_vision/eval/emscore_evaluator.py)
- **论文:** [EMScore: Evaluating Video Captioning via Coarse-Grained and Fine-Grained Embedding Matching](https://arxiv.org/abs/2111.08919)

