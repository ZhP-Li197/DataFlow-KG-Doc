---
title: MedKGTripleDrugActionMechanismDiscovery
createTime: 2026/04/11 10:15:00
permalink: /en/kg_operators/domain_kg/medical_kg/generate/medkg_triple_drug_action_mechanism_discovery/
---

## 📚 Overview
`MedKGTripleDrugActionMechanismDiscovery` is a generation-category operator for discovering drug action paths and generating mechanism explanations.
It builds candidate reasoning paths from the input query and triple set, then uses an LLM to select the most relevant paths and produce a natural-language mechanism answer.

Key characteristics of this operator:

- It relies on `LLMServingABC` for path selection and answer generation
- It uses `MedKGDrugActionMechanismPrompt` by default
- It reads `query` and `triple` by default
- It writes `mechanism_path` and `mechanism_answer` by default
- Candidate-path generation is performed in code first, and the LLM only ranks and summarizes those candidates

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
| `llm_serving` | `LLMServingABC` | - | LLM service object used to generate the final mechanism answer from candidate paths. |
| `seed` | `int` | `0` | Initializes the internal random generator. The current truncation flow does not directly shuffle candidates. |
| `lang` | `str` | `"en"` | Default prompt language. |
| `max_hop` | `int` | `3` | Maximum path length used during graph search. |
| `max_candidate_paths` | `int` | `20` | Maximum number of candidate paths kept before prompting the model. |
| `prompt_template` | `Any` | `None` | Custom prompt template. When `None`, the operator uses `MedKGDrugActionMechanismPrompt(lang=self.lang)`. |

---

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key_query: str = "query",
    input_key_triple: str = "triple",
    output_key_path: str = "mechanism_path",
    output_key_answer: str = "mechanism_answer",
):
    ...
```

`run` reads a DataFrame from `storage`, validates the query, triple, and output-column states, and then processes each row. It parses the triples into an undirected graph, matches entities appearing in the query, and first tries to collect paths between the top four matched entities. If no suitable path is found, it falls back to collecting paths starting from the top two seed entities. The resulting paths are ranked by query-token overlap and path length, truncated to `max_candidate_paths`, and then passed to the prompt to generate `mechanism_path` and `mechanism_answer`.

#### `run` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow storage object. |
| `input_key_query` | `str` | `"query"` | User-query column name. |
| `input_key_triple` | `str` | `"triple"` | Input triple column name, typically `List[str]`. |
| `output_key_path` | `str` | `"mechanism_path"` | Output mechanism-path column name. |
| `output_key_answer` | `str` | `"mechanism_answer"` | Output mechanism-answer column name. |

---

## 🤖 Example Usage
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.medical_kg.generate.medkg_triple_drug_action_mechanism_discovery import (
    MedKGTripleDrugActionMechanismDiscovery,
)

# Step 1: Assume llm_serving has been initialized in your project

# Step 2: Prepare input data
dataframe = pd.DataFrame(
    [
        {
            "query": "How does gefitinib act on EGFR-mutant lung cancer?",
            "triple": [
                "<subj> Gefitinib <obj> EGFR <rel> binds",
                "<subj> EGFR <obj> cell proliferation <rel> affects",
                "<subj> non-small cell lung cancer <obj> EGFR <rel> associates"
            ]
        }
    ]
)

storage = DummyStorage()
storage.set_data(dataframe)

operator = MedKGTripleDrugActionMechanismDiscovery(
    llm_serving=llm_serving,
    lang="en",
    max_hop=3,
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
| `mechanism_path` | `List[str]` | Candidate-path strings selected by the model. |
| `mechanism_answer` | `str` | Natural-language mechanism explanation generated from the selected paths. |

---

#### Example Input
```json
[
  {
    "query": "How does gefitinib act on EGFR-mutant lung cancer?",
    "triple": [
      "<subj> Gefitinib <obj> EGFR <rel> binds",
      "<subj> EGFR <obj> cell proliferation <rel> affects",
      "<subj> non-small cell lung cancer <obj> EGFR <rel> associates"
    ]
  }
]
```

#### Example Output
```json
[
  {
    "query": "How does gefitinib act on EGFR-mutant lung cancer?",
    "triple": [
      "<subj> Gefitinib <obj> EGFR <rel> binds",
      "<subj> EGFR <obj> cell proliferation <rel> affects",
      "<subj> non-small cell lung cancer <obj> EGFR <rel> associates"
    ],
    "mechanism_path": [
      "<subj> Gefitinib <obj> EGFR <rel> binds || <subj> EGFR <obj> cell proliferation <rel> affects"
    ],
    "mechanism_answer": "Gefitinib may act by binding EGFR and affecting downstream cell proliferation related to the disease context."
  }
]
```

---

#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/domain_kg/medical_kg/generate/medkg_triple_drug_action_mechanism_discovery.py`
- Default prompt: `DataFlow-KG/dataflow/prompts/diverse_kg/medkg.py`
- Related operator: `DataFlow-KG/dataflow/operators/domain_kg/medical_kg/generate/medkg_triple_drug_repositioning_discovery.py`


