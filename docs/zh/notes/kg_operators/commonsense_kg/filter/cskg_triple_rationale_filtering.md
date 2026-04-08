---
title: CSKGTripleRationaleFilter
createTime: 2026/04/01 18:05:00
icon: material-symbols:filter-alt-outline
permalink: /zh/kg_operators/commonsense_kg/filter/cskg_triple_rationale_filtering/
---

## 📚 概述
`CSKGTripleRationaleFilter` 是一个用于常识三元组合理性分数过滤的过滤类算子。
它根据三元组列表及对应评分列表，筛选出分数落在指定区间内的三元组，并将过滤结果写回 DataFrame，适合在上游合理性评估之后做质量过滤。

这个算子的几个关键特点如下：

- 不依赖 LLM，而是基于已有评分结果做规则过滤
- 默认读取 `triple` 和 `rationale_scores` 两列
- 默认输出列为 `filtered_triple`
- 支持通过 `merge_to_input=True` 直接覆盖原始三元组列
- 过滤结果会压缩列表，只保留满足阈值的三元组，不会保留空占位

---

## ✒️ __init__ 函数
```python
def __init__(self, merge_to_input: bool = False):
    ...
```

## `__init__` 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `merge_to_input` | `bool` | `False` | 是否将过滤结果直接写回 `input_key` 指定的原始列。若为 `False`，则写入 `output_key` 指定的新列。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "triple",
    score_key: str = "rationale_scores",
    output_key: str = "filtered_triple",
    min_score: float = 0.95,
    max_score: float = 1.0,
):
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，并检查输入列和评分列是否存在。随后逐行读取三元组列表与评分列表，通过 `zip` 按位置配对，只保留评分不为 `None` 且落在 `[min_score, max_score]` 区间内的三元组。处理完成后，结果会根据 `merge_to_input` 的设置写回原列或输出列。

## `run` 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将过滤结果写回。 |
| `input_key` | `str` | `"triple"` | 输入三元组列名。 |
| `score_key` | `str` | `"rationale_scores"` | 输入合理性评分列名。 |
| `output_key` | `str` | `"filtered_triple"` | 输出列名。当 `merge_to_input=False` 时，过滤结果会写入该列。 |
| `min_score` | `float` | `0.95` | 评分下界。只有不小于该值的三元组才会被保留。 |
| `max_score` | `float` | `1.0` | 评分上界。只有不大于该值的三元组才会被保留。 |

---

## 🤖 示例用法
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.commonsense_kg.filter.cskg_triple_rationale_filtering import (
    CSKGTripleRationaleFilter,
)

operator = CSKGTripleRationaleFilter(merge_to_input=False)
operator.run(
    storage=storage,
    input_key="triple",
    score_key="rationale_scores",
    output_key="filtered_triple",
    min_score=0.95,
    max_score=1.0,
)
```

---

## 默认输出格式

| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `triple` | `List[str]` | 输入三元组列表。 |
| `rationale_scores` | `List[float]` | 与三元组按位置对齐的合理性评分列表。 |
| `filtered_triple` | `List[str]` | 过滤后的三元组结果列表。 |

---

### 示例输入

```json
[
  {
    "triple": [
      "<subj> Tom <obj> umbrella <rel> uses",
      "<subj> fish <obj> bicycle <rel> rides"
    ],
    "rationale_scores": [0.98, 0.23]
  }
]
```

### 示例输出

```json
[
  {
    "triple": [
      "<subj> Tom <obj> umbrella <rel> uses",
      "<subj> fish <obj> bicycle <rel> rides"
    ],
    "rationale_scores": [0.98, 0.23],
    "filtered_triple": [
      "<subj> Tom <obj> umbrella <rel> uses"
    ]
  }
]
```

---

### 相关链接

- 算子实现：`DataFlow-KG/dataflow/operators/commonsense_kg/filter/cskg_triple_rationale_filtering.py`
- 相关评估算子：`DataFlow-KG/dataflow/operators/commonsense_kg/eval/cskg_triple_rationale_eval.py`
- 存储实现：`DataFlow-KG/dataflow/utils/storage.py`
