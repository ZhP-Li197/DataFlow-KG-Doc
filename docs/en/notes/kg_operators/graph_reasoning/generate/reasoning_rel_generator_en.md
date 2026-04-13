---
title: KGReasoningRelationGeneration
createTime: 2026/04/01 15:25:00
permalink: /en/kg_operators/graph_reasoning/generate/reasoning_rel_generator/
---

## 📚 Overview
`KGReasoningRelationGeneration` is a generate-category operator for knowledge-graph relation inference.
It takes target entity pairs together with multi-hop paths, calls an LLM to infer plausible relation triples between those entities, and writes the inferred triples back into the DataFrame.

Key characteristics of this operator:

- It depends on `LLMServingABC` for relation inference
- It uses `KGReasoningRelationInferencePrompt` by default for prompt construction
- It reads `target_entity` and `mpath` by default
- It writes to `inferred_triples` by default
- It can restrict the model to relations already seen in the paths via `restrict_to_path_rel`

---

## ✒️ __init__ Function
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    restrict_to_path_rel: bool = True,
    lang: str = "en"
):
    ...
```

#### `__init__` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM serving instance. The operator calls `generate_from_input` to produce candidate relation triples between entity pairs. |
| `restrict_to_path_rel` | `bool` | `True` | Whether to restrict candidate relations to the relation set already appearing in the paths. If `False`, the prompt signals that there is no relation restriction. |
| `lang` | `str` | `"en"` | Prompt language. The operator initializes `KGReasoningRelationInferencePrompt(lang=lang)`. |

---

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage,
    target_key: str = "target_entity",
    path_key: str = "mpath",
    output_key: str = "inferred_triples"
) -> List[str]:
    ...
```

`run` first reads a DataFrame from `storage` and checks whether the target-entity and path columns exist. It then processes rows one by one. For each row, the operator reads the entity-pair list and path list, aligns them by index, extracts the subject and object from each target pair, collects candidate relations from the corresponding paths, and finally calls the LLM to infer plausible relation triples for that pair. The per-pair inference results are grouped at the row level and written into the output column.

After the LLM returns, the operator attempts to parse the response directly as a JSON array. If parsing fails or the LLM call itself fails, the inference result for that entity pair falls back to an empty list.

#### `run` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow storage object. The operator reads the `dataframe` from it and writes inferred relation triples back. |
| `target_key` | `str` | `"target_entity"` | Input target-entity column name. Each item is usually shaped like `[["Henry, Berlin"], ["Henry, Rome"]]`. |
| `path_key` | `str` | `"mpath"` | Input path column name. Its structure must stay aligned with the order of entity pairs. |
| `output_key` | `str` | `"inferred_triples"` | Output column name used to store inferred relation triples. |

---

## 🤖 Example Usage
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.graph_reasoning.generate.reasoning_rel_generator import (
    KGReasoningRelationGeneration,
)

operator = KGReasoningRelationGeneration(
    llm_serving=llm_serving,
    restrict_to_path_rel=True,
    lang="en",
)
operator.run(
    storage=storage,
    target_key="target_entity",
    path_key="mpath",
    output_key="inferred_triples",
)
```

---

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `target_entity` | `List[List[str]]` | Target entity-pair list. Each pair is usually wrapped as a one-string list. |
| `mpath` | `List[List[List[str]]]` | Path collection aligned with the entity-pair order. |
| `inferred_triples` | `List[List[str]]` | Inferred relation-triple list for each entity pair. |

---

#### Example Input
```json
[
  {
    "target_entity": [["Henry, Berlin"]],
    "mpath": [
      [
        [
          "<subj> Henry <obj> Maria Rodriguez <rel> is_trained_by",
          "<subj> Maria Rodriguez <obj> Berlin <rel> lives_in"
        ]
      ]
    ]
  }
]
```

#### Example Output
```json
[
  {
    "target_entity": [["Henry, Berlin"]],
    "mpath": [
      [
        [
          "<subj> Henry <obj> Maria Rodriguez <rel> is_trained_by",
          "<subj> Maria Rodriguez <obj> Berlin <rel> lives_in"
        ]
      ]
    ],
    "inferred_triples": [
      [
        "<subj> Henry <obj> Berlin <rel> trained_in_city"
      ]
    ]
  }
]
```

---

#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/graph_reasoning/generate/reasoning_rel_generator.py`
- Default prompt: `DataFlow-KG/dataflow/prompts/application_kg/graph_reasoning.py`
- Upstream path-search operator: `DataFlow-KG/dataflow/operators/graph_reasoning/generate/reasoning_path_search.py`

