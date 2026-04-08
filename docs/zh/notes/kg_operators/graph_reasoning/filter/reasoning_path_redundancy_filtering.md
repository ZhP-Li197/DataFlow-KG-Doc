---
title: KGReasoningPathRedundancyFilter
createTime: 2026/04/01 15:55:00
permalink: /zh/kg_operators/graph_reasoning/filter/reasoning_path_redundancy_filtering/
---

## 📚 概述
`KGReasoningPathRedundancyFilter` 是一个用于知识图谱路径冗余度过滤的过滤类算子。
它根据路径及其冗余评分，筛选出分数位于指定区间内的路径结果，并将过滤后的结果写回 DataFrame。

这个算子的几个关键特点如下：

- 不依赖 LLM，而是基于已有冗余评分做规则过滤
- 默认读取 `mpath` 和 `redundancy_scores` 两列
- 默认输出列为 `filtered_mpath`
- 支持通过 `merge_to_input=True` 直接覆盖原始路径列
- 当前实现直接在顶层对 `mpath` 和 `redundancy_scores` 做位置过滤

---

## ✒️ __init__ 函数
```python
def __init__(self, merge_to_input: bool = False):
    ...
```

#### `__init__` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `merge_to_input` | `bool` | `False` | 是否将过滤结果直接写回 `input_key` 指定的原始路径列。若为 `False`，则写入 `output_key` 指定的新列。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "mpath",
    score_key: str = "redundancy_scores",
    output_key: str = "filtered_mpath",
    min_score: float = 0.0,
    max_score: float = 0.5,
):
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，并检查输入路径列和评分列是否存在。随后逐行读取 `mpath` 和 `redundancy_scores`，在当前实现中直接对这两个顶层列表做 `zip` 配对，并保留分数位于 `[min_score, max_score]` 区间内的元素。处理完成后，结果会根据 `merge_to_input` 的设置写回原列或输出列。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将过滤结果写回。 |
| `input_key` | `str` | `"mpath"` | 输入路径列名。 |
| `score_key` | `str` | `"redundancy_scores"` | 输入冗余评分列名。 |
| `output_key` | `str` | `"filtered_mpath"` | 输出列名。当 `merge_to_input=False` 时，过滤结果会写入该列。 |
| `min_score` | `float` | `0.0` | 评分下界。只有不小于该值的元素才会被保留。 |
| `max_score` | `float` | `0.5` | 评分上界。只有不大于该值的元素才会被保留。 |

---

## 🤖 示例用法
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.graph_reasoning.filter.reasoning_path_redundancy_filtering import (
    KGReasoningPathRedundancyFilter,
)

operator = KGReasoningPathRedundancyFilter(merge_to_input=False)
operator.run(
    storage=storage,
    input_key="mpath",
    score_key="redundancy_scores",
    output_key="filtered_mpath",
    min_score=0.0,
    max_score=0.5,
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `mpath` | `list` | 输入路径列。当前实现把它当作顶层可与评分逐项配对的列表处理。 |
| `redundancy_scores` | `list` | 输入冗余评分列。当前实现要求其元素可直接与 `min_score`、`max_score` 做数值比较。 |
| `filtered_mpath` | `list` | 过滤后的路径结果列表。 |

---

#### 示例输入
```json
[
  {
    "mpath": [
      [["t1", "t2"]],
      [["t3", "t4"]]
    ],
    "redundancy_scores": [0.2, 0.8]
  }
]
```

#### 示例输出
```json
[
  {
    "mpath": [
      [["t1", "t2"]],
      [["t3", "t4"]]
    ],
    "redundancy_scores": [0.2, 0.8],
    "filtered_mpath": [
      [["t1", "t2"]]
    ]
  }
]
```

---
#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/graph_reasoning/filter/reasoning_path_redundancy_filtering.py`
- 上游评估算子：`DataFlow-KG/dataflow/operators/graph_reasoning/eval/reasoning_path_redundancy_eval.py`
- 存储实现：`DataFlow-KG/dataflow/utils/storage.py`

