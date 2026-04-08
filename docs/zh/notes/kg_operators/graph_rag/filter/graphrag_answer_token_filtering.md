---
title: KGRAGAnswerTokenFilter
createTime: 2026/04/01 13:15:00
permalink: /zh/kg_operators/graph_rag/filter/graphrag_answer_token_filtering/
---

## 📚 概述
`KGRAGAnswerTokenFilter` 是一个用于 Graph RAG 答案长度分数过滤的过滤类算子。
它根据答案列表及其对应的 token 计数列表，对每个位置上的答案做区间过滤，并将满足阈值条件的结果保留下来。

这个算子的几个关键特点如下：

- 不依赖 LLM，而是基于已有 token 计数结果做规则过滤
- 默认读取 `answer` 和 `answer_token_count` 两列
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
    score_key: str = "answer_token_count",
    output_key: str = "filtered_answer",
    min_score: float = 0.95,
    max_score: float = 1.0,
):
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，并检查输入列与评分列是否存在。随后，算子逐行读取 `input_key` 和 `score_key` 两列，对每一对列表按位置进行过滤：当 token 计数不为 `None` 且落在 `[min_score, max_score]` 区间内时，保留对应答案；否则将该位置替换为 `[]`。处理完成后，结果会根据 `merge_to_input` 的设置写回原列或输出列。

和合理性过滤算子一样，当前实现不会压缩输出列表长度，而是保留原位置结构；同时过滤是通过 `zip` 完成的，因此当答案列表与计数列表长度不一致时，较长一侧的尾部元素会被忽略。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将过滤结果写回。 |
| `input_key` | `str` | `"answer"` | 待过滤的答案列名。当前实现要求该列的每个单元格为列表。 |
| `score_key` | `str` | `"answer_token_count"` | 与答案列表按位置对齐的 token 计数列名。当前实现要求该列的每个单元格为列表。 |
| `output_key` | `str` | `"filtered_answer"` | 输出列名。当 `merge_to_input=False` 时，过滤结果会写入该列。 |
| `min_score` | `float` | `0.95` | 区间下界。只有不小于该值的元素才会被保留。 |
| `max_score` | `float` | `1.0` | 区间上界。只有不大于该值的元素才会被保留。 |

---

## 🤖 示例用法
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.graph_rag.filter.graphrag_answer_token_filtering import (
    KGRAGAnswerTokenFilter,
)

operator = KGRAGAnswerTokenFilter(merge_to_input=False)
operator.run(
    storage=storage,
    input_key="answer",
    score_key="answer_token_count",
    output_key="filtered_answer",
    min_score=0.0,
    max_score=2.0,
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `answer` | `List[str]` | 待过滤的答案列表。 |
| `answer_token_count` | `List[float]` | 与答案按位置对齐的 token 计数列表。 |
| `filtered_answer` | `List[Union[str, list]]` | 过滤后的结果列表。满足阈值的元素保留原值，不满足阈值的位置写入 `[]`。 |

---

#### 示例输入
```json
[
  {
    "answer": ["Short answer", "A much longer answer"],
    "answer_token_count": [1.0, 3.0]
  }
]
```

#### 示例输出
```json
[
  {
    "answer": ["Short answer", "A much longer answer"],
    "answer_token_count": [1.0, 3.0],
    "filtered_answer": ["Short answer", []]
  }
]
```

---
#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/graph_rag/filter/graphrag_answer_token_filtering.py`
- 相关评估算子：`DataFlow-KG/dataflow/operators/graph_rag/eval/graphrag_answer_token_eval.py`
- 存储实现：`DataFlow-KG/dataflow/utils/storage.py`

