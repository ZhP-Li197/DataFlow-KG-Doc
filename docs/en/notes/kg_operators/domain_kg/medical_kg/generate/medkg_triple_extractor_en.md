---
title: MedKGTripleExtraction
createTime: 2026/04/11 10:05:00
permalink: /en/kg_operators/domain_kg/medical_kg/generate/medkg_triple_extractor/
---

## 📚 Overview
`MedKGTripleExtraction` is a generation-category operator for extracting medical knowledge graph triples from text.
It reads raw medical text, applies ontology-constrained LLM prompting, and writes both extracted triples and aligned entity-type metadata back into the DataFrame.

Key characteristics of this operator:

- It relies on `LLMServingABC` for LLM-based triple extraction
- It uses `MedKGRelationExtractorPrompt` by default and expects both `triple` and `entity_class`
- It supports passing `ontology_lists` directly, or loading ontology definitions from `./.cache/medical/`
- It reads `raw_chunk` by default and writes to `triple` and `entity_class` by default
- It performs basic text cleaning and quality filtering before invoking the model

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
| `llm_serving` | `LLMServingABC` | - | LLM service object. The operator uses `generate_from_input` to extract medical triples. |
| `seed` | `int` | `0` | Initializes the internal random generator. The current main flow does not use randomness beyond initialization. |
| `triple_type` | `str` | `"relation"` | Reserved parameter. The current implementation does not use it to switch extraction behavior. |
| `lang` | `str` | `"en"` | Prompt language. The constructor always creates `MedKGRelationExtractorPrompt(lang=self.lang)`. |
| `num_q` | `int` | `5` | Reserved parameter not used in the current pipeline. |

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

`run` first reads a DataFrame from `storage` and validates the required input and output columns. It then resolves the medical ontology: if `ontology_lists` is provided, it uses that value directly; otherwise it loads one or more ontology files from `./.cache/medical/` based on `input_key_meta` and merges them when needed. After that, the operator processes each text row. Texts that fail length, sentence-count, or character-quality checks are converted into empty outputs. Valid texts are sent to the default prompt, and the model response is parsed into `triple` and `entity_class`, which are written back into the DataFrame.

#### `run` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow storage object. The operator reads the `dataframe` from it and writes the results back. |
| `ontology_lists` | `Any` | `None` | Optional ontology object. It can be a single ontology dict or a list of ontology dicts. |
| `input_key` | `str` | `"raw_chunk"` | Input text column name. |
| `input_key_meta` | `Union[str, List[str]]` | `"ontology"` | Ontology name or ontology-name list used for cache loading when `ontology_lists=None`. |
| `output_key` | `str` | `"triple"` | Output triple column name. |
| `output_key_meta` | `str` | `"entity_class"` | Output entity-type column name. |

---

## 🤖 Example Usage
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.medical_kg.generate.medkg_triple_extractor import (
    MedKGTripleExtraction,
)

# Step 1: Assume llm_serving has been initialized in your project

# Step 2: Prepare input data
dataframe = pd.DataFrame(
    [
        {
            "raw_chunk": "EGFR mutation is associated with non-small cell lung cancer. Gefitinib targets EGFR in tumor cells."
        }
    ]
)

ontology = {
    "entity_type": {"core": ["Disease", "Drug", "Gene"]},
    "relation_type": {"core": ["associates", "targets"]}
}

storage = DummyStorage()
storage.set_data(dataframe)

operator = MedKGTripleExtraction(
    llm_serving=llm_serving,
    lang="en",
)
operator.run(
    storage=storage,
    ontology_lists=ontology,
    input_key="raw_chunk",
    output_key="triple",
    output_key_meta="entity_class",
)
```

---

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `raw_chunk` | `str` | Input medical text. |
| `triple` | `List[str]` | Extracted triple-string list in the format `"<subj> ... <obj> ... <rel> ..."`. |
| `entity_class` | `List[List[str]]` | Entity-type list aligned item-by-item with `triple`. Each item usually contains subject and object types. |

---

#### Example Input
```json
[
  {
    "raw_chunk": "EGFR mutation is associated with non-small cell lung cancer. Gefitinib targets EGFR in tumor cells."
  }
]
```

#### Example Output
```json
[
  {
    "raw_chunk": "EGFR mutation is associated with non-small cell lung cancer. Gefitinib targets EGFR in tumor cells.",
    "triple": [
      "<subj> EGFR <obj> non-small cell lung cancer <rel> associates",
      "<subj> Gefitinib <obj> EGFR <rel> targets"
    ],
    "entity_class": [
      ["Gene", "Disease"],
      ["Drug", "Gene"]
    ]
  }
]
```

---
#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/domain_kg/medical_kg/generate/medkg_triple_extractor.py`
- Default prompt: `DataFlow-KG/dataflow/prompts/diverse_kg/medkg.py`
- Related filter operator: `DataFlow-KG/dataflow/operators/domain_kg/medical_kg/filter/medkg_triple_metapath_sampling.py`


