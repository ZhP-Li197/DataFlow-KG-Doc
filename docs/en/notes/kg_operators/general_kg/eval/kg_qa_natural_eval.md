---
title: KGQANaturalEvaluator
createTime: 2026/04/10 15:40:36
permalink: /en/kg_operators/general_kg/eval/kg_qa_natural_eval/
---

## 📚 Overview
`KGQANaturalEvaluator` is an evaluation operator that scores the naturalness and fluency of knowledge graph QA pairs.
It reads a list of QA pairs from each row, calls a large language model to score the naturalness of those pairs, and writes the results back to the DataFrame.

Key characteristics of this operator:

- Depends on `LLMServingABC` for LLM-based evaluation.
- Uses `KGQANaturalnessPrompt` by default to construct prompts.
- Reads from the `QA_pairs` column by default and writes to `naturalness_scores` by default.
- Supports input cells as either Python lists or JSON strings that can be deserialized.
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
| `llm_serving` | `LLMServingABC` | - | LLM service object. The operator calls `generate_from_input` to score the naturalness of QA pairs. |
| `lang` | `str` | `"en"` | Prompt language. The constructor creates `KGQANaturalnessPrompt(lang)`. |

---

## 💡 `run` Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "QA_pairs",
    output_key: str = "naturalness_scores"
):
    ...
```

`run` reads the DataFrame from `storage` and extracts the column specified by `input_key` row by row, reorganizing it into the internally used `{"QA_pairs": ...}` structure. It then calls `process_batch()` to evaluate each row. If the cell content is a string, it is first parsed as JSON; if it is empty or parsing fails, the row outputs an empty list. For valid QA pair lists, the operator constructs system and user prompts and asks the model to return JSON containing only `naturalness_scores`. Final results are written to the `output_key` column.

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow storage object. The operator reads the `dataframe` from it and writes evaluation results back. |
| `input_key` | `str` | `"QA_pairs"` | Input QA pairs column name. Each cell is typically a `List[Dict]`, but may also be a JSON string. |
| `output_key` | `str` | `"naturalness_scores"` | Output score column name for the naturalness scores corresponding to each QA pair. |

---

## 🤖 Example Usage
```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.general_kg.eval.kg_qa_natural_eval import (
    KGQANaturalEvaluator,
)

operator = KGQANaturalEvaluator(
    llm_serving=llm_serving,
    lang="en",
)
operator.run(
    storage=storage,
    input_key="QA_pairs",
    output_key="naturalness_scores",
)
```

---

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `QA_pairs` | `List[Dict]` / `str` | Input QA pair list, or a JSON string that can be parsed into a list. |
| `naturalness_scores` | `List[float]` | Naturalness scores positionally aligned with the input QA pairs. |

---

#### Example Input
```json
[
  {
    "QA_pairs": [
      {"question": "Where does the sun rise?", "answer": "The sun rises in the east."},
      {"question": "Capital France what is?", "answer": "Paris is it."}
    ]
  }
]
```

#### Example Output
```json
[
  {
    "QA_pairs": [
      {"question": "Where does the sun rise?", "answer": "The sun rises in the east."},
      {"question": "Capital France what is?", "answer": "Paris is it."}
    ],
    "naturalness_scores": [0.94, 0.21]
  }
]
```

---

#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/general_kg/eval/kg_qa_natural_eval.py`
- Default prompt: `DataFlow-KG/dataflow/prompts/core_kg/rel_triple_eval.py`