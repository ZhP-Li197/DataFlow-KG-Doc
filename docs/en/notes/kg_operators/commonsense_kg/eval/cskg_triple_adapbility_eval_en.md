---
title: CSKGTripleAdapbilityEvaluator
createTime: 2026/04/01 18:25:00
permalink: /en/kg_operators/commonsense_kg/eval/cskg_triple_adapbility_eval/
---

## 📚 Overview
`CSKGTripleAdapbilityEvaluator` is an evaluation-category operator for scoring the adaptability of commonsense knowledge graph triples.
It reads a triple list from each row, uses an LLM to judge whether those triples express reusable general commonsense rather than context-specific facts, and writes the resulting scores back into the DataFrame.

Key characteristics of this operator:

- It relies on `LLMServingABC` for LLM-based scoring
- It uses `CSKGTripleAdaptabilityPrompt` by default
- It reads `triple` by default and writes to `adaptability_scores` by default
- It accepts either Python lists or JSON strings that can be deserialized into triple lists
- When the input is empty, the LLM call fails, or the model returns invalid JSON, the row falls back to `[]`

---

## ✒️ `__init__` Function
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    lang: str = "en"
):
    ...
```

#### `__init__` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM service object. The operator uses `generate_from_input` to score triple adaptability. |
| `lang` | `str` | `"en"` | Prompt language. The constructor creates `CSKGTripleAdaptabilityPrompt(lang)`. |

---

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "triple",
    output_key: str = "adaptability_scores"
):
    ...
```

`run` first reads a DataFrame from `storage` and, for each row, maps the column specified by `input_key` into the internal structure `{"triple": ...}`. It then calls `process_batch()` to evaluate each row. If a cell contains a string, the operator first attempts `json.loads()`; if parsing fails or the content is empty, that row produces an empty score list. For valid triple lists, the operator builds system and user prompts and expects the model to return JSON containing `adaptability_scores`. The resulting list is then written into the column specified by `output_key`.

#### `run` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow storage object. The operator reads the `dataframe` from it and writes evaluation results back. |
| `input_key` | `str` | `"triple"` | Input triple column name. Each cell is typically `List[str]`, but a JSON string is also accepted. |
| `output_key` | `str` | `"adaptability_scores"` | Output score column name for the per-triple adaptability score list. |

---

## 🤖 Example Usage
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.commonsense_kg.eval.cskg_triple_adapbility_eval import (
    CSKGTripleAdapbilityEvaluator,
)


operator = CSKGTripleAdapbilityEvaluator(
    llm_serving=llm_serving,
    lang="en",
)
operator.run(
    storage=storage,
    input_key="triple",
    output_key="adaptability_scores",
)
```

---

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `triple` | `List[str]` / `str` | Input triple list, or a JSON string that can be parsed into a list. |
| `adaptability_scores` | `List[float]` | Adaptability scores aligned positionally with the input triples. |

---

#### Example Input
```json
[
  {
    "triple": [
      "<subj> bird <obj> fly <rel> CapableOf",
      "<subj> Tom <obj> museum <rel> visited"
    ]
  }
]
```

#### Example Output
```json
[
  {
    "triple": [
      "<subj> bird <obj> fly <rel> CapableOf",
      "<subj> Tom <obj> museum <rel> visited"
    ],
    "adaptability_scores": [0.96, 0.18]
  }
]
```

---

#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/commonsense_kg/eval/cskg_triple_adapbility_eval.py`
- Default prompt: `DataFlow-KG/dataflow/prompts/diverse_kg/cskg.py`
- Downstream filtering operator: `DataFlow-KG/dataflow/operators/commonsense_kg/filter/cskg_triple_adapbility_filtering.py`


