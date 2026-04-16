---
title: CSKGTripleExtraction
createTime: 2026/04/01 17:00:00
permalink: /en/kg_operators/commonsense_kg/generate/cskg_triple_extractor/
---

## 📚 Overview
`CSKGTripleExtraction` is a generate-category operator for commonsense knowledge-graph triple extraction.
It reads raw text, applies basic preprocessing and quality checks, calls an LLM to extract commonsense triples, and writes the structured results back into the DataFrame for downstream QA generation, KG construction, or reasoning tasks.

Key characteristics of this operator:

- It depends on `LLMServingABC` for triple extraction
- It switches between relation-triple and attribute-triple prompts through `triple_type`
- It reads `raw_chunk` by default and writes to `triple` by default
- It performs text preprocessing and quality filtering before extraction; low-quality text directly falls back to empty results
- The current implementation uses built-in default prompts and does not expose a `prompt_template` parameter

---

## ✒️ `__init__` Function
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    triple_type: str = "relation",
    lang: str = "en",
    num_q: int = 5
):
    ...
```

#### `__init__` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM serving instance. The operator calls `generate_from_input` to perform triple extraction. |
| `seed` | `int` | `0` | Used to initialize the internal random number generator. The current implementation does not use randomness further in the main workflow. |
| `triple_type` | `str` | `"relation"` | Triple type selector. `"relation"` uses the relation-triple prompt, while `"attribute"` uses the attribute-triple prompt. |
| `lang` | `str` | `"en"` | Prompt language. The operator initializes the corresponding default prompt using this language value. |
| `num_q` | `int` | `5` | Reserved parameter. In the current implementation, it is stored as an instance attribute but not used in extraction logic. |

---

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "raw_chunk",
    output_key: str = "triple"
):
    ...
```

`run` first reads a DataFrame from `storage`, validates that the input column exists, and checks that the output column will not overwrite existing data. It then passes the input text list into the internal batch-processing logic. Each text is first cleaned and quality-checked. Valid text is sent to the selected prompt and LLM for extraction, while invalid text directly produces an empty triple result. The model response is parsed as JSON and the `triple` field is extracted before the final result is written into `output_key`.

#### `run` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow storage object. The operator reads the `dataframe` from it and writes extraction results back. |
| `input_key` | `str` | `"raw_chunk"` | Input text column name. |
| `output_key` | `str` | `"triple"` | Output column name used to store extracted triples. |

---

## 🤖 Example Usage
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.commonsense_kg.generate.cskg_triple_extractor import (
    CSKGTripleExtraction,
)


dataframe = pd.DataFrame(
    [
        {
            "raw_chunk": "Tom uses an umbrella when it rains because he wants to stay dry. The umbrella protects him from the rain."
        }
    ]
)

storage = DummyStorage()
storage.set_data(dataframe)

operator = CSKGTripleExtraction(
    llm_serving=llm_serving,
    triple_type="relation",
    lang="en",
)
operator.run(
    storage=storage,
    input_key="raw_chunk",
    output_key="triple",
)
```

---

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `raw_chunk` | `str` | Input raw text. |
| `triple` | `list` | Extracted triple-result list. If the text fails quality checks or model parsing fails, the result becomes `[]`. |

---

#### Example Input
```json
[
  {
    "raw_chunk": "Tom uses an umbrella when it rains because he wants to stay dry. The umbrella protects him from the rain."
  }
]
```

#### Example Output
```json
[
  {
    "raw_chunk": "Tom uses an umbrella when it rains because he wants to stay dry. The umbrella protects him from the rain.",
     "triple": [
        "<subj> Tom <obj> umbrella <rel> uses",
    ]
  }
]
```

---

#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/commonsense_kg/generate/cskg_triple_extractor.py`
- Default prompts: `DataFlow-KG/dataflow/prompts/diverse_kg/cskg.py`
- Storage implementation: `DataFlow-KG/dataflow/utils/storage.py`


