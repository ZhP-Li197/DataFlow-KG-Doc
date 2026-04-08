---
title: CSKGRelationTripleQAGeneration
createTime: 2026/04/01 17:10:00
permalink: /en/kg_operators/commonsense_kg/generate/cskg_rel_triple_qa_generator/
---

## 📚 Overview
`CSKGRelationTripleQAGeneration` is a generate-category operator for generating QA pairs from commonsense triples.
It reads existing relation triples or triple sets, calls an LLM to generate `QA_pairs`, and writes the result back into the DataFrame. This is useful for commonsense QA dataset construction, synthetic training data generation, or benchmark expansion.

Key characteristics of this operator:

- It depends on `LLMServingABC` for QA generation
- It switches among three prompt modes through `qa_type`: `single`, `set`, and `multi`
- It writes to `QA_pairs` by default
- When `qa_type='set'`, the current implementation forcefully reads `set_triple` instead of the externally passed `input_key`
- Model responses are parsed as JSON objects and the `QA_pairs` field is extracted

---

## ✒️ __init__ Function
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    qa_type: str = "set",
):
    ...
```

#### `__init__` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM serving instance. The operator calls `generate_from_input` to generate QA pairs from triples. |
| `seed` | `int` | `0` | Used to initialize the internal random number generator. The current implementation does not use randomness further in the main workflow. |
| `lang` | `str` | `"en"` | Prompt language. The operator initializes the corresponding default prompt using this value. |
| `qa_type` | `str` | `"set"` | QA generation mode. `single` uses the single-relation prompt, `set` uses the set-based prompt, and `multi` uses the multi-relation prompt. |

---

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "triple",
    output_key: str = "QA_pairs",
):
    ...
```

`run` first decides which input column will actually be used according to `qa_type`, then reads a DataFrame from `storage` and validates the effective input column together with the output column. It then passes the input triple list into the internal batch-processing logic. For each row, the operator uses the selected prompt to ask the LLM to generate QA pairs, parses the model response, and extracts the `QA_pairs` field before writing the final result into `output_key`.

#### `run` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow storage object. The operator reads the `dataframe` from it and writes generated QA pairs back. |
| `input_key` | `str` | `"triple"` | Input triple column name. Note that if `qa_type='set'`, the current implementation ignores this value and forcefully switches to `set_triple`. |
| `output_key` | `str` | `"QA_pairs"` | Output column name used to store generated QA pairs. |

---

## 🤖 Example Usage
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.commonsense_kg.generate.cskg_rel_triple_qa_generator import (
    CSKGRelationTripleQAGeneration,
)


operator = CSKGRelationTripleQAGeneration(
    llm_serving=llm_serving,
    qa_type="single",
    lang="en",
)
operator.run(
    storage=storage,
    input_key="triple",
    output_key="QA_pairs",
)
```

---

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `triple` / `set_triple` | `list` | Input triple list or triple-set list. Which one is actually used depends on `qa_type`. |
| `QA_pairs` | `list` | Generated QA-pair list. If model parsing fails, the result becomes `[]`. |

---

#### Example Input
```json
[
  {
    "triple": [
        "<subj> Tom <obj> umbrella <rel> uses",
    ]
  }
]
```

#### Example Output
```json
[
  {
    "triple": [
        "<subj> Tom <obj> umbrella <rel> uses",
    ],
    "QA_pairs": [
      {
        "question": "What does Tom use when it rains?",
        "answer": "umbrella"
      }
    ]
  }
]
```

---

#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/commonsense_kg/generate/cskg_rel_triple_qa_generator.py`
- Default prompts: `DataFlow-KG/dataflow/prompts/diverse_kg/cskg.py`
- Upstream triple-extraction operator: `DataFlow-KG/dataflow/operators/commonsense_kg/generate/cskg_triple_extractor.py`


