---
title: KGRAGAnswerTokenFilter
createTime: 2026/04/01 13:20:00
permalink: /en/kg_operators/graph_rag/filter/graphrag_answer_token_filtering/
---

## 📚 Overview
`KGRAGAnswerTokenFilter` is a filter-category operator for Graph RAG answer length-based filtering.
It filters each answer position using the corresponding token count list and keeps only the entries whose counts fall inside the configured range.

Key characteristics of this operator:

- It does not rely on an LLM and instead applies rule-based filtering on existing token-count results
- It reads `answer` and `answer_token_count` by default
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
    score_key: str = "answer_token_count",
    output_key: str = "filtered_answer",
    min_score: float = 0.95,
    max_score: float = 1.0,
):
    ...
```

`run` first reads a DataFrame from `storage` and checks whether the input and score columns exist. It then processes the two columns row by row and filters each aligned pair positionally: if a token count is not `None` and falls within `[min_score, max_score]`, the corresponding answer is kept; otherwise that position is replaced with `[]`. After processing, the result is written either to the original input column or to the output column depending on `merge_to_input`.

Just like the plausibility filter, the current implementation does not compact the output list length and instead preserves positional structure. Filtering is performed with `zip`, so if the answer list and the token-count list have different lengths, trailing elements on the longer side are ignored.

#### `run` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow storage object. The operator reads the `dataframe` from it and writes filtered results back. |
| `input_key` | `str` | `"answer"` | Column name containing answers to filter. In the current implementation, each cell is expected to be a list. |
| `score_key` | `str` | `"answer_token_count"` | Column name containing token counts aligned with the answer list. Each cell is expected to be a list. |
| `output_key` | `str` | `"filtered_answer"` | Output column name. When `merge_to_input=False`, filtered results are written here. |
| `min_score` | `float` | `0.95` | Lower bound of the allowed range. Only elements with values not below this threshold are kept. |
| `max_score` | `float` | `1.0` | Upper bound of the allowed range. Only elements with values not above this threshold are kept. |

---

## 🤖 Example Usage
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

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `answer` | `List[str]` | Answer list to be filtered. |
| `answer_token_count` | `List[float]` | Token-count list aligned with the answers. |
| `filtered_answer` | `List[Union[str, list]]` | Filtered result list. Entries that pass the threshold are kept, and entries that fail are replaced with `[]`. |

---

#### Example Input
```json
[
  {
    "answer": ["Short answer", "A much longer answer"],
    "answer_token_count": [1.0, 3.0]
  }
]
```

#### Example Output
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
#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/graph_rag/filter/graphrag_answer_token_filtering.py`
- Related evaluation operator: `DataFlow-KG/dataflow/operators/graph_rag/eval/graphrag_answer_token_eval.py`
- Storage implementation: `DataFlow-KG/dataflow/utils/storage.py`

