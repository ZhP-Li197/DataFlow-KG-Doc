---
title: CSKGTripleConceptGeneralization
createTime: 2026/04/01 17:40:00
permalink: /en/kg_operators/commonsense_kg/refine/cskg_triple_concept_generalization/
---

## 📚 Overview
`CSKGTripleConceptGeneralization` is a refine-category operator for commonsense triple concept generalization.
It reads existing triples, calls an LLM to generalize concrete commonsense triples into more abstract concept-level triples, and writes the generalized results back into the DataFrame. This is useful for knowledge abstraction, conceptual reasoning, and improving generalization coverage.

Key characteristics of this operator:

- It depends on `LLMServingABC` for concept generalization
- It uses `CSKGConceptGeneralizationPrompt` by default for prompt construction
- It reads `triple` by default and writes to `gen_triple` by default
- It does not perform text-quality filtering and instead directly sends existing triples into the model
- The current implementation uses built-in default prompts and does not expose a `prompt_template` parameter

## ✒️ `__init__` Function
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    num_q: int = 5
):
    ...
```

#### `__init__` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM serving instance. The operator calls `generate_from_input` to perform concept generalization. |
| `seed` | `int` | `0` | Used to initialize the internal random number generator. The current implementation does not use randomness further in the main workflow. |
| `lang` | `str` | `"en"` | Prompt language. The operator initializes `CSKGConceptGeneralizationPrompt(lang=lang)`. |
| `num_q` | `int` | `5` | Reserved parameter. In the current implementation, it is stored as an instance attribute but not used in the generalization logic. |

---

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "triple",
    output_key: str = "gen_triple"
):
    ...
```

`run` first reads a DataFrame from `storage`, validates that the input column exists, and checks that the output column will not conflict with existing data. It then passes the input triple list into the internal batch-processing logic. For each row, the triples are used to build a prompt through `CSKGConceptGeneralizationPrompt`, sent to the LLM for concept generalization, and parsed as JSON to extract the `gen_triple` field before writing the final result into `output_key`.

#### `run` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow storage object. The operator reads the `dataframe` from it and writes generalized triples back. |
| `input_key` | `str` | `"triple"` | Input triple column name. |
| `output_key` | `str` | `"gen_triple"` | Output column name used to store concept-generalized triples. |

---

## 🤖 Example Usage
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.commonsense_kg.refine.cskg_triple_concept_generalization import (
    CSKGTripleConceptGeneralization,
)


operator = CSKGTripleConceptGeneralization(
    llm_serving=llm_serving,
    lang="en",
)
operator.run(
    storage=storage,
    input_key="triple",
    output_key="gen_triple",
)
```

---

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `triple` | `list` | Input triple list. |
| `gen_triple` | `list` | Concept-generalized triple list. If model parsing fails, the result becomes `[]`. |

---

#### Example Input
```json
[
  {
    "triple": [
      "<subj> Tom <obj> umbrella <rel> uses"
    ]
  }
]
```

#### Example Output
```json
[
  {
    "triple": [
      "<subj> Tom <obj> umbrella <rel> uses"
    ],
    "gen_triple": [
      "<subj> person <obj> protective_item <rel> uses"
    ]
  }
]
```

---

#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/commonsense_kg/refine/cskg_triple_concept_generalization.py`
- Default prompt: `DataFlow-KG/dataflow/prompts/diverse_kg/cskg.py`
- Upstream triple-extraction operator: `DataFlow-KG/dataflow/operators/commonsense_kg/generate/cskg_triple_extractor.py`


