---
title: MedKGTripleDrugRepositioningDiscovery
createTime: 2026/04/11 10:25:00
permalink: /en/kg_operators/domain_kg/medical_kg/generate/medkg_triple_drug_repositioning_discovery/
---

## 📚 Overview
`MedKGTripleDrugRepositioningDiscovery` is a generation-category operator for drug repositioning path discovery and answer generation.
It first retrieves candidate paths from the medical triple graph based on a user query, then uses an LLM to choose the most supportive repositioning paths and produce an explanatory answer.

Key characteristics of this operator:

- It relies on `LLMServingABC` for the final repositioning explanation
- It uses `MedKGDrugRepositioningPrompt` by default
- It reads `query` and `triple` by default
- It writes `reposition_path` and `reposition_answer` by default
- It explicitly prefers candidate paths containing a built-in set of medically useful relations

---

## ✒️ __init__ Function
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    max_hop: int = 3,
    max_candidate_paths: int = 20,
    prompt_template=None,
):
    ...
```

#### `__init__` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM service object. |
| `seed` | `int` | `0` | Initializes the internal random generator. |
| `lang` | `str` | `"en"` | Default prompt language. |
| `max_hop` | `int` | `3` | Maximum path length used during graph search. |
| `max_candidate_paths` | `int` | `20` | Maximum number of candidate paths retained before prompting. |
| `prompt_template` | `Any` | `None` | Custom prompt template. When omitted, the operator uses `MedKGDrugRepositioningPrompt(lang=self.lang)`. |

---

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key_query: str = "query",
    input_key_triple: str = "triple",
    output_key_path: str = "reposition_path",
    output_key_answer: str = "reposition_answer",
):
    ...
```

`run` reads a DataFrame, validates the query, triple, and output columns, and then processes each row. It builds an undirected graph from the triples, matches graph entities against the query text, and collects multi-hop paths starting from the two most relevant seed entities. Unlike the mechanism-discovery operator, this operator also ranks candidate paths with an explicit `preferred_relations` set, so paths containing relations such as `treats`, `binds`, `affects`, or `indicates` are ranked more favorably. The top paths are then passed into the prompt to generate `reposition_path` and `reposition_answer`.

#### `run` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow storage object. |
| `input_key_query` | `str` | `"query"` | User-query column name. |
| `input_key_triple` | `str` | `"triple"` | Input triple column name. |
| `output_key_path` | `str` | `"reposition_path"` | Output reposition-path column name. |
| `output_key_answer` | `str` | `"reposition_answer"` | Output reposition-answer column name. |

---

## 🤖 Example Usage
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.medical_kg.generate.medkg_triple_drug_repositioning_discovery import (
    MedKGTripleDrugRepositioningDiscovery,
)

# Step 1: Assume llm_serving has been initialized in your project

# Step 2: Prepare input data
dataframe = pd.DataFrame(
    [
        {
            "query": "Can this kinase inhibitor be repurposed for lung cancer?",
            "triple": [
                "<subj> Gefitinib <obj> EGFR <rel> binds",
                "<subj> EGFR <obj> non-small cell lung cancer <rel> associates",
                "<subj> Gefitinib <obj> tumor growth <rel> affects"
            ]
        }
    ]
)

storage = DummyStorage()
storage.set_data(dataframe)

operator = MedKGTripleDrugRepositioningDiscovery(
    llm_serving=llm_serving,
    lang="en",
)
operator.run(
    storage=storage,
    input_key_query="query",
    input_key_triple="triple",
)
```

---

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `query` | `str` | Input user query. |
| `triple` | `List[str]` | Input medical triple list. |
| `reposition_path` | `List[str]` | Model-selected supporting paths for drug repositioning. |
| `reposition_answer` | `str` | Repositioning explanation generated from the candidate paths. |

---

#### Example Input
```json
[
  {
    "query": "Can this kinase inhibitor be repurposed for lung cancer?",
    "triple": [
      "<subj> Gefitinib <obj> EGFR <rel> binds",
      "<subj> EGFR <obj> non-small cell lung cancer <rel> associates",
      "<subj> Gefitinib <obj> tumor growth <rel> affects"
    ]
  }
]
```

#### Example Output
```json
[
  {
    "query": "Can this kinase inhibitor be repurposed for lung cancer?",
    "triple": [
      "<subj> Gefitinib <obj> EGFR <rel> binds",
      "<subj> EGFR <obj> non-small cell lung cancer <rel> associates",
      "<subj> Gefitinib <obj> tumor growth <rel> affects"
    ],
    "reposition_path": [
      "<subj> Gefitinib <obj> EGFR <rel> binds || <subj> EGFR <obj> non-small cell lung cancer <rel> associates"
    ],
    "reposition_answer": "The candidate paths suggest Gefitinib may be repurposed for non-small cell lung cancer through EGFR-related evidence."
  }
]
```

---

#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/domain_kg/medical_kg/generate/medkg_triple_drug_repositioning_discovery.py`
- Default prompt: `DataFlow-KG/dataflow/prompts/diverse_kg/medkg.py`
- Related operator: `DataFlow-KG/dataflow/operators/domain_kg/medical_kg/generate/medkg_triple_drug_action_mechanism_discovery.py`


