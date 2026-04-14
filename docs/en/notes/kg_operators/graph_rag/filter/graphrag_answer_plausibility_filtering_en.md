---
title: KGRAGAnswerPlausibilityFilter
createTime: 2026/04/01 13:10:00
permalink: /en/kg_operators/graph_rag/filter/graphrag_answer_plausibility_filtering/
---

## 📚 Overview
`KGRAGAnswerPlausibilityFilter` is a filter-category operator for Graph RAG answer plausibility filtering.
It filters each answer position using a corresponding plausibility score list, keeps the entries that satisfy the score range, and writes the result back for downstream processing.

Key characteristics of this operator:

- It does not rely on an LLM and instead applies rule-based filtering on existing scores
- It reads `answer` and `question_plausibility_score` by default
- It writes to `filtered_answer` by default
- It supports `merge_to_input=True` to overwrite the original input column directly
- The current implementation filters position by position and replaces failed entries with `[]` instead of removing them from the list

---

## ✒️ `__init__` Function
```python
def __init__(self, merge_to_input: bool = False):
    ...
```

#### `__init__` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `merge_to_input` | `bool` | `False` | Whether to write the filtered result back into the original column specified by `input_key`. If `False`, the result is written to `output_key`. |

---

## 💡 run Function
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

`run` first reads a DataFrame from `storage` and checks whether the input and score columns exist. It then processes the two columns row by row and filters each aligned pair positionally: if a score is not `None` and falls within `[min_score, max_score]`, the corresponding answer is kept; otherwise that position is replaced with `[]`. After processing, the result is written either to the original input column or to the output column depending on `merge_to_input`.

One important implementation detail is that the operator does not compact the list length. Instead, it preserves positional structure. It also uses `zip` to pair answers and scores, so if the two lists have different lengths, trailing elements on the longer side are ignored.

#### `run` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow storage object. The operator reads the `dataframe` from it and writes filtered results back. |
| `input_key` | `str` | `"answer"` | Column name containing answers to filter. In the current implementation, each cell is expected to be a list. |
| `score_key` | `str` | `"question_plausibility_score"` | Column name containing plausibility scores aligned with the answer list. Each cell is expected to be a list. |
| `output_key` | `str` | `"filtered_answer"` | Output column name. When `merge_to_input=False`, filtered results are written here. |
| `min_score` | `float` | `0.95` | Lower score bound. Only elements with scores not below this value are kept. |
| `max_score` | `float` | `1.0` | Upper score bound. Only elements with scores not above this value are kept. |

---

## 🤖 Example Usage
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

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `answer` | `List[str]` | Answer list to be filtered. |
| `question_plausibility_score` | `List[float]` | Plausibility score list aligned with the answers. |
| `filtered_answer` | `List[Union[str, list]]` | Filtered result list. Entries that pass the threshold are kept, and entries that fail are replaced with `[]`. |

---

#### Example Input
```json
[
  {
    "answer": ["Maria Rodriguez", "Unknown"],
    "question_plausibility_score": [0.98, 0.42]
  }
]
```

#### Example Output
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


#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/graph_rag/filter/graphrag_answer_plausibility_filtering.py`
- Related evaluation operator: `DataFlow-KG/dataflow/operators/graph_rag/eval/graphrag_answer_plausibility_eval.py`
- Storage implementation: `DataFlow-KG/dataflow/utils/storage.py`

