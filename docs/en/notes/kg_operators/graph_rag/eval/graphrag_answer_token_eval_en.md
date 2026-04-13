---
title: KGRAGAnswerTokenCount
createTime: 2026/04/01 14:05:00
permalink: /en/kg_operators/graph_rag/eval/graphrag_answer_token_eval/
---

## 📚 Overview
`KGRAGAnswerTokenCount` is an evaluation-category operator for counting Graph RAG answer tokens.
It reads an answer column, uses the `tiktoken` encoder associated with a specified model, and writes token counts back into the DataFrame. It is commonly used for downstream length analysis or filtering steps.

Key characteristics of this operator:

- It does not rely on an LLM and instead uses `tiktoken` for local token counting
- It selects the tokenizer during initialization through `model_name`
- It reads `answer` by default and writes to `answer_token_count` by default
- It supports both single answers as `str` and multiple answers in one row as `List[str]`
- The output keeps the same structure as the input: `int` for single answers and `List[int]` for batched answers

---

## ✒️ __init__ Function
```python
def __init__(
    self,
    model_name: str = "gpt-4o",
):
    ...
```

#### `__init__` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `model_name` | `str` | `"gpt-4o"` | Model name used to select the `tiktoken` encoder. The operator initializes the tokenizer via `tiktoken.encoding_for_model(model_name)`. |

---

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    answer_key: str = "answer",
    output_key: str = "answer_token_count",
):
    ...
```

`run` first reads a DataFrame from `storage`, checks whether the answer column exists, and verifies that the output column does not already exist. It then processes `answer_key` row by row. If a cell is a string, the operator counts tokens for that string directly. If a cell is a list, it counts tokens for each answer in the list and stores the result as a list in the output column. Finally, the operator writes the token counts back into the DataFrame.

#### `run` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow storage object. The operator reads the `dataframe` from it and writes token-count results back. |
| `answer_key` | `str` | `"answer"` | Input answer column name. Each cell may contain `str` or `List[str]`. |
| `output_key` | `str` | `"answer_token_count"` | Output column name used to store token counts. |

---

## 🤖 Example Usage
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.graph_rag.eval.graphrag_answer_token_eval import (
    KGRAGAnswerTokenCount,
)

operator = KGRAGAnswerTokenCount(model_name="gpt-4o")
operator.run(
    storage=storage,
    answer_key="answer",
    output_key="answer_token_count",
)
```

---

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `answer` | `str` / `List[str]` | Input answer column. It can contain a single answer or multiple answers in one row. |
| `answer_token_count` | `int` / `List[int]` | Token-count result aligned with the input structure. |

---

#### Example Input
```json
[
  {
    "answer": "Maria Rodriguez"
  }
]
```

#### Example Output
```json
[
  {
    "answer": "Maria Rodriguez",
    "answer_token_count": 2
  }
]
```

---


#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/graph_rag/eval/graphrag_answer_token_eval.py`
- Related filtering operator: `DataFlow-KG/dataflow/operators/graph_rag/filter/graphrag_answer_token_filtering.py`
- Storage implementation: `DataFlow-KG/dataflow/utils/storage.py`

