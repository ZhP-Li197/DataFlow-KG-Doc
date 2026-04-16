---
title: SchoKGTripleExtraction
createTime: 2026/04/11 10:45:00
permalink: /en/kg_operators/domain_kg/scholar_kg/generate/schokg_triple_extractor/
---

## 📚 Overview
`SchoKGTripleExtraction` is a generation-category operator for extracting scholarly knowledge graph triples from text.
It reads academic text, applies ontology-constrained prompting, and writes both extracted triples and aligned entity-type metadata back into the DataFrame.

Key characteristics of this operator:

- It relies on `LLMServingABC` for triple extraction
- It uses `SchoKGRelationExtractorPrompt` by default
- It supports either direct `ontology_lists` input or ontology loading from `./.cache/schokg/`
- It reads `raw_chunk` by default and writes to `triple` and `entity_class`
- It performs text-length, sentence-count, and character-quality filtering before extraction

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
| `llm_serving` | `LLMServingABC` | - | LLM service object. |
| `seed` | `int` | `0` | Initializes the internal random generator. |
| `triple_type` | `str` | `"relation"` | Reserved parameter not used in the current implementation. |
| `lang` | `str` | `"en"` | Prompt language. The constructor always creates `SchoKGRelationExtractorPrompt(lang=self.lang)`. |
| `num_q` | `int` | `5` | Reserved parameter not used in the current main flow. |

---

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    ontology_lists = None,
    input_key: str = "raw_chunk",
    input_key_meta: Union[str, List[str]] = "ontology",
    output_key: str = "triple",
    output_key_meta: str = "entity_class"
):
    ...
```

`run` reads a DataFrame, validates the input and output columns, and then resolves the scholarly ontology. If `ontology_lists` is provided, it uses that object directly. Otherwise, it loads one or more ontology files from `./.cache/schokg/` according to `input_key_meta` and merges them when necessary. The operator then preprocesses each text row, returns empty outputs for invalid text, and calls the default prompt for valid text. Finally, it parses the returned `triple` and `entity_class` fields and writes them back into the DataFrame.

#### `run` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow storage object. |
| `ontology_lists` | `Any` | `None` | Optional ontology object. It can be a single dict or a list of ontology dicts. |
| `input_key` | `str` | `"raw_chunk"` | Input text column name. |
| `input_key_meta` | `Union[str, List[str]]` | `"ontology"` | Ontology name or ontology-name list used for cache loading. |
| `output_key` | `str` | `"triple"` | Output triple column name. |
| `output_key_meta` | `str` | `"entity_class"` | Output entity-type column name. |

---

## 🤖 Example Usage
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.scholar_kg.generate.schokg_triple_extractor import (
    SchoKGTripleExtraction,
)

# Step 1: Assume llm_serving has been initialized in your project

# Step 2: Prepare input data
dataframe = pd.DataFrame(
    [
        {
            "raw_chunk": "Geoffrey Hinton is affiliated with the University of Toronto. He published influential work in deep learning."
        }
    ]
)

ontology = {
    "entity_type": {"core": ["Author", "University", "Paper"]},
    "relation_type": {"core": ["affiliated_with", "published"]}
}

storage = DummyStorage()
storage.set_data(dataframe)

operator = SchoKGTripleExtraction(
    llm_serving=llm_serving,
    lang="en",
)
operator.run(
    storage=storage,
    ontology_lists=ontology,
    input_key="raw_chunk",
)
```

---

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `raw_chunk` | `str` | Input scholarly text. |
| `triple` | `List[str]` | Extracted scholarly triple-string list. |
| `entity_class` | `List[List[str]]` | Entity-type list aligned item-by-item with `triple`. |

---

#### Example Input
```json
[
  {
    "raw_chunk": "Geoffrey Hinton is affiliated with the University of Toronto. He published influential work in deep learning."
  }
]
```

#### Example Output
```json
[
  {
    "raw_chunk": "Geoffrey Hinton is affiliated with the University of Toronto. He published influential work in deep learning.",
    "triple": [
      "<subj> Geoffrey Hinton <obj> University of Toronto <rel> affiliated_with"
    ],
    "entity_class": [
      ["Author", "University"]
    ]
  }
]
```

---
#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/domain_kg/scholar_kg/generate/schokg_triple_extractor.py`
- Default prompt: `DataFlow-KG/dataflow/prompts/diverse_kg/schokg.py`
- Related operator: `DataFlow-KG/dataflow/operators/domain_kg/scholar_kg/generate/schokg_query_reasoning.py`


