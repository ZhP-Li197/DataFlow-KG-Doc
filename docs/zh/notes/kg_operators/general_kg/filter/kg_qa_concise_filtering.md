---
title: KGQAConciseFilter
createTime: 2026/04/10 15:40:44
permalink: /zh/kg_operators/general_kg/filter/kg_qa_concise_filtering/
---

## 📚 概述
`KGQAConciseFilter` 是一个用于根据简洁性得分过滤 QA 对的过滤类算子。
它会读取每一行中的 QA 对列表及对应的简洁性得分列表，按位置对齐后保留得分在指定范围内的 QA 对，并将过滤结果写回 DataFrame。

这个算子的几个关键特点如下：

- 无需 `LLMServingABC`，是纯规则过滤算子，不依赖大模型
- QA 对与得分按位置一一对齐，逐对判断是否保留
- 支持通过 `merge_to_input` 参数将过滤结果原地写回输入列，或写入新列
- 得分为 `None` 的 QA 对将被过滤掉
- 通常配合 `KGQAConcisenessEvaluator` 的输出列使用

---

## ✒️ `__init__` 函数
```python
def __init__(self, merge_to_input: bool = False):
    ...
```

#### `__init__` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `merge_to_input` | `bool` | `False` | 若为 `True`，过滤结果写回 `input_key` 列，`output_key` 参数失效；若为 `False`，结果写入 `output_key` 指定的新列。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "QA_pairs",
    score_key: str = "conciseness_scores",
    output_key: str = "filtered_QA_pairs",
    min_score: float = 0.95,
    max_score: float = 1.0,
):
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，校验 `input_key` 和 `score_key` 两列均存在，随后逐行将 QA 对列表与得分列表按位置对齐，保留满足 `min_score ≤ score ≤ max_score` 的 QA 对。若输入不是列表类型，则该行输出空列表。根据 `merge_to_input` 的取值，结果写入 `input_key` 列或 `output_key` 列。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将过滤结果写回。 |
| `input_key` | `str` | `"QA_pairs"` | 输入 QA 对列名。每个单元格应为 `List[Dict]` 格式。 |
| `score_key` | `str` | `"conciseness_scores"` | 输入简洁性得分列名，通常为 `KGQAConcisenessEvaluator` 的输出列。每个单元格应为与 `input_key` 等长的 `List[float]`。 |
| `output_key` | `str` | `"filtered_QA_pairs"` | 输出过滤结果列名（`merge_to_input=False` 时生效）。 |
| `min_score` | `float` | `0.95` | 保留 QA 对的最低得分阈值（含）。 |
| `max_score` | `float` | `1.0` | 保留 QA 对的最高得分阈值（含）。 |

---

## 🤖 示例用法
```python
from dataflow.operators.general_kg.filter.kg_qa_concise_filtering import (
    KGQAConciseFilter,
)

operator = KGQAConciseFilter(merge_to_input=False)
operator.run(
    storage=storage,
    input_key="QA_pairs",
    score_key="conciseness_scores",
    output_key="filtered_QA_pairs",
    min_score=0.95,
    max_score=1.0,
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `QA_pairs` | `List[Dict]` | 原始输入 QA 对列表。 |
| `conciseness_scores` | `List[float]` | 各 QA 对对应的简洁性得分，由上游评估算子生成。 |
| `filtered_QA_pairs` | `List[Dict]` | 过滤后保留的 QA 对列表，仅包含得分在 `[min_score, max_score]` 范围内的条目。 |

---

#### 示例输入
```json
[
  {
    "QA_pairs": [
      {"question": "What is the capital of France?", "answer": "Paris."},
      {"question": "Who invented the telephone?", "answer": "Alexander Graham Bell invented the telephone in 1876, moving to Canada..."}
    ],
    "conciseness_scores": [0.97, 0.31]
  }
]
```

#### 示例输出
```json
[
  {
    "filtered_QA_pairs": [
      {"question": "What is the capital of France?", "answer": "Paris."}
    ]
  }
]
```

---

#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/general_kg/filter/kg_qa_concise_filtering.py`
- 上游评估算子：`DataFlow-KG/dataflow/operators/general_kg/eval/kg_qa_concise_eval.py`