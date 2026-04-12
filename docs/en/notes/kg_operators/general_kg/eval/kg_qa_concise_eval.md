---
title: KGQAConcisenessEvaluator
createTime: 2026/04/10 10:00:00
permalink: /en/kg_operators/general_kg/eval/kg_qa_concise_eval/
---

## 📚 Overview
`KGQAConcisenessEvaluator` is an evaluation operator that scores the conciseness of knowledge graph QA pairs.
It reads a list of QA pairs from each row, calls a large language model to score their conciseness, and writes the results back to the DataFrame.

Key characteristics of this operator:

- Depends on `LLMServingABC` for LLM-based evaluation.
- Uses `KGQAConcisenessPrompt` by default to construct prompts.
- Reads from the `QA_pairs` column by default and writes to `conciseness_scores` by default.
- Supports input cells as either Python lists or JSON strings that can be deserialized.
- The raw model output is required to be a strict JSON object: `{"conciseness_scores": [...]}`
- Falls back to `[]` for the current row when a model call fails, the response is invalid JSON, or the input is empty.

---

## ✒️ `__init__` Parameters
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    lang: str = "en"
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM service object. The operator calls `generate_from_input` to score the conciseness of QA pairs. |
| `lang` | `str` | `"en"` | Prompt language. The constructor creates `KGQAConcisenessPrompt(lang)`. |

---

## 💡 `run` Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "QA_pairs",
    output_key: str = "conciseness_scores"
):
    ...
```

`run` reads the DataFrame from `storage` and extracts the column specified by `input_key` row by row, reorganizing it into the internally used `{"QA_pairs": ...}` structure. It then calls `process_batch()` to evaluate each row. If the cell content is a string, it is first parsed as JSON; if it is empty or parsing fails, the row outputs an empty list. For valid QA pair lists, the operator constructs system and user prompts and asks the model to return only `{"conciseness_scores": [...]}`. Final results are written to the `output_key` column, and the return value of `run()` matches that column name.

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow storage object. The operator reads the `dataframe` from it and writes evaluation results back. |
| `input_key` | `str` | `"QA_pairs"` | Input QA pairs column name. Each cell is typically a `List[Dict]`, but may also be a JSON string. |
| `output_key` | `str` | `"conciseness_scores"` | Output score column name for the conciseness scores corresponding to each QA pair. |

---

## 🤖 Example Usage
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.general_kg.eval.kg_qa_concise_eval import (
    KGQAConcisenessEvaluator,
)

operator = KGQAConcisenessEvaluator(
    llm_serving=llm_serving,
    lang="en",
)
operator.run(
    storage=storage,
    input_key="QA_pairs",
    output_key="conciseness_scores",
)
```

---

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `QA_pairs` | `List[Dict]` / `str` | Input QA pair list, or a JSON string that can be parsed into a list. |
| `conciseness_scores` | `List[float]` | Scores written back to the DataFrame, positionally aligned with the input QA pairs. |

#### Raw Model Output Format
```json
{
  "conciseness_scores": [0.95, 0.32]
}
```

The final DataFrame keeps the original `QA_pairs` column and adds a `conciseness_scores` column. That DataFrame shape is not extra model output.

---

#### Example Input
```json
[
  {
    "QA_pairs": [
      {"question": "What is the capital of France?", "answer": "Paris."},
      {"question": "Who invented the telephone?", "answer": "Alexander Graham Bell invented the telephone in 1876, and he was born in Edinburgh, Scotland, and later moved to Canada and the United States where he conducted most of his work."}
    ]
  }
]
```

#### Example Output
```json
[
  {
    "QA_pairs": [
      {"question": "What is the capital of France?", "answer": "Paris."},
      {"question": "Who invented the telephone?", "answer": "Alexander Graham Bell invented the telephone in 1876, and he was born in Edinburgh, Scotland, and later moved to Canada and the United States where he conducted most of his work."}
    ],
    "conciseness_scores": [0.95, 0.32]
  }
]
```

---

#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/general_kg/eval/kg_qa_concise_eval.py`
- Default prompt: `DataFlow-KG/dataflow/prompts/core_kg/rel_triple_eval.py`
- Downstream filter operator: `DataFlow-KG/dataflow/operators/general_kg/filter/kg_qa_concise_filtering.py`
