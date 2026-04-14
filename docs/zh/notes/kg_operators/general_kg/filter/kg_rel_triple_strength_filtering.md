---
title: KGTripleStrengthFilter
createTime: 2026/04/10 15:40:44
permalink: /zh/kg_operators/general_kg/filter/kg_rel_triple_strength_filtering/
---

## 📚 概述
`KGTripleStrengthFilter` 是一个用于根据强度得分过滤知识图谱三元组的过滤类算子。
它会读取每一行中的三元组列表及对应的强度得分列表，按位置对齐后保留得分在指定范围内的三元组，并将过滤结果写回 DataFrame。

这个算子的几个关键特点如下：

- 无需 `LLMServingABC`，是纯规则过滤算子，不依赖大模型
- 三元组与得分按位置一一对齐，逐条判断是否保留
- 支持通过 `merge_to_input` 参数将过滤结果原地写回输入列，或写入新列
- 得分为 `None` 的三元组将被过滤掉
- 通常配合 `KGRelationStrengthScoring` 的输出列使用

---

## ✒️ `__init__` 函数
```python
def __init__(self, merge_to_input: bool = False):
    ...
```

#### `__init__` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `merge_to_input` | `bool` | `False` | 若为 `True`，过滤结果写回 `triple_key` 列，`output_key` 参数失效；若为 `False`，结果写入 `output_key` 指定的新列。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage,
    triple_key: str = "triple",
    score_key: str = "triple_strength_score",
    output_key: str = "filtered_triple",
    min_score: float = 0.5,
    max_score: float = 1.0,
):
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，校验 `triple_key` 和 `score_key` 两列均存在，随后逐行将三元组列表与得分列表按位置对齐，保留满足 `min_score ≤ score ≤ max_score` 的三元组。若输入不是列表类型，则该行输出空列表。根据 `merge_to_input` 的取值，结果写入 `triple_key` 列或 `output_key` 列。

> 注意：与 QA 过滤算子相比，本算子的第一个输入参数名为 `triple_key`（而非 `input_key`），需注意调用时的参数名称。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将过滤结果写回。 |
| `triple_key` | `str` | `"triple"` | 输入三元组列名。每个单元格应为 `List[str]` 格式。 |
| `score_key` | `str` | `"triple_strength_score"` | 输入强度得分列名，通常为 `KGRelationStrengthScoring` 的输出列。每个单元格应为与 `triple_key` 等长的 `List[float]`。 |
| `output_key` | `str` | `"filtered_triple"` | 输出过滤结果列名（`merge_to_input=False` 时生效）。 |
| `min_score` | `float` | `0.5` | 保留三元组的最低得分阈值（含）。 |
| `max_score` | `float` | `1.0` | 保留三元组的最高得分阈值（含）。 |

---

## 🤖 示例用法
```python
from dataflow.operators.general_kg.filter.kg_rel_triple_strength_filtering import (
    KGTripleStrengthFilter,
)

operator = KGTripleStrengthFilter(merge_to_input=False)
operator.run(
    storage=storage,
    triple_key="triple",
    score_key="triple_strength_score",
    output_key="filtered_triple",
    min_score=0.5,
    max_score=1.0,
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `triple` | `List[str]` | 原始输入三元组列表。 |
| `triple_strength_score` | `List[float]` / `List[float\|None]` | 各三元组对应的强度得分，由上游评估算子生成。 |
| `filtered_triple` | `List[str]` | 过滤后保留的三元组列表，仅包含得分在 `[min_score, max_score]` 范围内的条目。 |

---

#### 示例输入
```json
[
  {
    "triple": [
      "<subj> Newton <obj> laws of motion <rel> formulated",
      "<subj> Newton <obj> alchemy <rel> practiced",
      "<subj> Earth <obj> Sun <rel> orbits"
    ],
    "triple_strength_score": [0.93, 0.41, 0.88]
  }
]
```

#### 示例输出
```json
[
  {
    "filtered_triple": [
      "<subj> Newton <obj> laws of motion <rel> formulated",
      "<subj> Earth <obj> Sun <rel> orbits"
    ]
  }
]
```

---

#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/general_kg/filter/kg_rel_triple_strength_filtering.py`
- 上游评估算子：`DataFlow-KG/dataflow/operators/general_kg/eval/kg_rel_triple_strength_eval.py`