---
title: KGRAGAnswerPlausibilityFilter
createTime: 2026/04/01 13:05:00
permalink: /zh/kg_operators/graph_rag/filter/graphrag_answer_plausibility_filtering/
---

## 📚 概述
`KGRAGAnswerPlausibilityFilter` 是一个用于 Graph RAG 答案合理性过滤的过滤类算子。
它根据答案列表及其对应的合理性评分列表，对每个位置上的答案做区间过滤，并将满足阈值条件的结果保留下来，供后续流程继续使用。

这个算子的几个关键特点如下：

- 不依赖 LLM，而是基于已有评分结果做规则过滤
- 默认读取 `answer` 和 `question_plausibility_score` 两列
- 默认输出列为 `filtered_answer`
- 支持通过 `merge_to_input=True` 直接覆盖原始输入列
- 当前实现按位置过滤，未通过阈值的位置会被替换为 `[]`，而不是从列表中删除

---

## ✒️ __init__ 函数
```python
def __init__(self, merge_to_input: bool = False):
    ...
```

#### `__init__` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `merge_to_input` | `bool` | `False` | 是否将过滤结果直接写回 `input_key` 指定的原始列。若为 `False`，则写入 `output_key` 指定的新列。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "answer",
    score_key: str = "question_plausibility_score",
    output_key: str = "filtered_answer",
    min_score: float = 0.95,
    max_score: float = 1.0,
):
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，并检查输入列与评分列是否存在。随后，算子逐行读取 `input_key` 和 `score_key` 两列，对每一对列表按位置进行过滤：当评分不为 `None` 且落在 `[min_score, max_score]` 区间内时，保留对应答案；否则将该位置替换为 `[]`。处理完成后，结果会根据 `merge_to_input` 的设置写回原列或输出列。

需要注意的是，当前实现并不会压缩列表长度，而是保留原有位置结构；同时，过滤时通过 `zip` 配对答案与评分，因此如果两个列表长度不一致，较长列表尾部的元素会被直接忽略。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将过滤结果写回。 |
| `input_key` | `str` | `"answer"` | 待过滤的答案列名。当前实现要求该列的每个单元格为列表。 |
| `score_key` | `str` | `"question_plausibility_score"` | 与答案列表按位置对齐的评分列名。当前实现要求该列的每个单元格为列表。 |
| `output_key` | `str` | `"filtered_answer"` | 输出列名。当 `merge_to_input=False` 时，过滤结果会写入该列。 |
| `min_score` | `float` | `0.95` | 评分下界。只有不小于该值的元素才会被保留。 |
| `max_score` | `float` | `1.0` | 评分上界。只有不大于该值的元素才会被保留。 |

---

## 🤖 示例用法
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.graph_rag.filter.graphrag_answer_plausibility_filtering import (
    KGRAGAnswerPlausibilityFilter,
)

operator = KGRAGAnswerPlausibilityFilter(merge_to_input=False)
operator.run(
    storage=storage,
    input_key="answer",
    score_key="question_plausibility_score",
    output_key="filtered_answer",
    min_score=0.95,
    max_score=1.0,
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `answer` | `List[str]` | 待过滤的答案列表。 |
| `question_plausibility_score` | `List[float]` | 与答案按位置对齐的合理性评分列表。 |
| `filtered_answer` | `List[Union[str, list]]` | 过滤后的结果列表。满足阈值的元素保留原值，不满足阈值的位置写入 `[]`。 |

---

#### 示例输入
```json
[
  {
    "answer": ["Maria Rodriguez", "Unknown"],
    "question_plausibility_score": [0.98, 0.42]
  }
]
```

#### 示例输出
```json
[
  {
    "answer": ["Maria Rodriguez", "Unknown"],
    "question_plausibility_score": [0.98, 0.42],
    "filtered_answer": ["Maria Rodriguez", []]
  }
]
```

---


#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/graph_rag/filter/graphrag_answer_plausibility_filtering.py`
- 相关评估算子：`DataFlow-KG/dataflow/operators/graph_rag/eval/graphrag_answer_plausibility_eval.py`
- 存储实现：`DataFlow-KG/dataflow/utils/storage.py`

