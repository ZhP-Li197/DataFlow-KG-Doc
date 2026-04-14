---
title: KGGraphRAGAnswerLLMEvaluation
createTime: 2026/04/01 14:35:00
permalink: /en/kg_operators/graph_rag/eval/graphrag_truth_eval/
---

## 📚 Overview
`KGGraphRAGAnswerLLMEvaluation` is an evaluation-category operator for Graph RAG answer correctness checking.
It reads model answers and ground-truth answers, calls another LLM for judgment, and outputs a boolean correctness result for each answer.

Key characteristics of this operator:

- It depends on `LLMServingABC` for LLM-based judgment
- It reads `answer` and `truth` by default
- It writes to `is_correct` by default
- It supports single-answer evaluation and batched answer-vs-truth evaluation within one row
- The current implementation uses fixed English user and system prompts, while `lang` is only stored as an instance attribute and does not affect judging logic

---

## ✒️ `__init__` Function
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    lang: str = "en",
):
    ...
```

#### `__init__` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM serving instance. The operator calls `generate_from_input` to judge whether generated answers match ground truth. |
| `lang` | `str` | `"en"` | Language parameter. In the current implementation, the value is stored but judging still uses fixed English prompts. |

---

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_keys: List[str] = ["answer", "truth"],
    output_key: str = "is_correct",
) -> List[str]:
    ...
```

`run` first reads a DataFrame from `storage`, validates the answer, truth, and output columns, and then processes each row. If both `answer` and `truth` are strings, the operator directly calls the LLM for correctness judgment. If both are lists, it first pads them to the same length and then evaluates each aligned pair, returning a boolean list for that row. After processing, the result is written into the column specified by `output_key`.

Internally, the operator constructs a fixed English prompt asking the model whether the generated answer contains the key information from the ground truth. It then parses the model output using a simple keyword rule: if the returned text contains `true`, the result is treated as `True`; otherwise if it contains `false`, it is treated as `False`. If the output is ambiguous or the LLM call fails, the operator falls back to `False`.

#### `run` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow storage object. The operator reads the `dataframe` from it and writes correctness judgments back. |
| `input_keys` | `List[str]` | `["answer", "truth"]` | Input column name list. By default, the first column is the answer column and the second is the ground-truth column. |
| `output_key` | `str` | `"is_correct"` | Output column name used to store boolean correctness results. |

---

## 🤖 Example Usage
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.graph_rag.eval.graphrag_truth_eval import (
    KGGraphRAGAnswerLLMEvaluation,
)


operator = KGGraphRAGAnswerLLMEvaluation(
    llm_serving=llm_serving,
    lang="en",
)
operator.run(
    storage=storage,
    input_keys=["answer", "truth"],
    output_key="is_correct",
)
```

---

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `answer` | `str` / `List[str]` | Model-generated answer column. |
| `truth` | `str` / `List[str]` | Ground-truth answer column. |
| `is_correct` | `bool` / `List[bool]` / `None` | Correctness result. If the input types are unsupported or mismatched, the current implementation writes `None` for that row. |

---

#### Example Input
```json
[
  {
    "answer": "Maria Rodriguez",
    "truth": "Maria Rodriguez"
  }
]
```

#### Example Output
```json
[
  {
    "answer": "Maria Rodriguez",
    "truth": "Maria Rodriguez",
    "is_correct": true
  }
]
```

---

#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/graph_rag/eval/graphrag_truth_eval.py`
- Upstream answer generation operator: `DataFlow-KG/dataflow/operators/graph_rag/generate/graphrag_get_answer.py`
- Storage implementation: `DataFlow-KG/dataflow/utils/storage.py`


