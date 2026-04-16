---
title: MedKGMetaPathGenerator
createTime: 2026/04/11 10:35:00
permalink: /en/kg_operators/domain_kg/medical_kg/filter/medkg_triple_metapath_sampling/
---

## 📚 Overview
`MedKGMetaPathGenerator` is a filter-category operator for matching concrete path instances in a medical graph according to a user-defined meta-path rule.
It does not depend on an LLM. Instead, it parses triples and entity-class lists, builds a graph, and performs DFS matching against the supplied `meta_path_rule`.

Key characteristics of this operator:

- It is fully rule-based and does not rely on an LLM
- It reads `triple` and `entity_class` by default
- It requires an explicit `meta_path_rule`
- It writes to `matched_meta_path` by default
- The current implementation writes results into a new single-column DataFrame instead of preserving the original row structure

---

## ✒️ __init__ Function
```python
def __init__(
    self,
    llm_serving: LLMServingABC = None,
    seed: int = 0,
    lang: str = "en",
    max_paths_per_group: int = 100,
):
    ...
```

#### `__init__` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | `None` | Reserved parameter. It is not used in the current implementation. |
| `seed` | `int` | `0` | Controls truncation order when matched paths exceed the configured limit. |
| `lang` | `str` | `"en"` | Reserved parameter not used in the current main flow. |
| `max_paths_per_group` | `int` | `100` | Maximum number of matched paths to keep. When exceeded, the operator shuffles and truncates the path list. |

---

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "triple",
    input_key_class: str = "entity_class",
    meta_path_rule: Union[str, List[str]] = None,
    output_key_meta: str = "matched_meta_path",
):
    ...
```

`run` first reads a DataFrame and validates the required inputs. If the DataFrame has only one row, it expects the row-level `triple` and `entity_class` values to both be lists. If the DataFrame has multiple rows, it flattens triples and entity classes from all rows into one global graph. It then parses `meta_path_rule` into an alternating sequence of entity types and relation types, builds an undirected graph, and performs DFS matching. The final result is written as a new DataFrame containing only the `matched_meta_path` column.

#### `run` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow storage object. |
| `input_key` | `str` | `"triple"` | Input triple column name. If this column is not found, the code falls back to `triple` or `tuple`. |
| `input_key_class` | `str` | `"entity_class"` | Input entity-class column name. |
| `meta_path_rule` | `Union[str, List[str]]` | `None` | Meta-path rule such as `"Disease -> treats -> Compound -> affects -> Gene"`. |
| `output_key_meta` | `str` | `"matched_meta_path"` | Output column name. |

---

## 🤖 Example Usage
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.medical_kg.filter.medkg_triple_metapath_sampling import (
    MedKGMetaPathGenerator,
)

dataframe = pd.DataFrame(
    [
        {
            "triple": [
                "<subj> lung cancer <obj> gefitinib <rel> treats",
                "<subj> gefitinib <obj> EGFR <rel> affects"
            ],
            "entity_class": [
                ["Disease", "Compound"],
                ["Compound", "Gene"]
            ]
        }
    ]
)

storage = DummyStorage()
storage.set_data(dataframe)

operator = MedKGMetaPathGenerator(max_paths_per_group=50)
operator.run(
    storage=storage,
    input_key="triple",
    input_key_class="entity_class",
    meta_path_rule="Disease -> treats -> Compound -> affects -> Gene",
    output_key_meta="matched_meta_path",
)
```

---

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `matched_meta_path` | `str` | Matched meta-path instance string. Each output row contains one path, and multi-hop paths use ` || ` as the separator. |

---

#### Example Input
```json
[
  {
    "triple": [
      "<subj> lung cancer <obj> gefitinib <rel> treats",
      "<subj> gefitinib <obj> EGFR <rel> affects"
    ],
    "entity_class": [
      ["Disease", "Compound"],
      ["Compound", "Gene"]
    ]
  }
]
```

#### Example Output
```json
[
  {
    "matched_meta_path": "<subj> lung cancer <obj> gefitinib <rel> treats || <subj> gefitinib <obj> EGFR <rel> affects"
  }
]
```

---

#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/domain_kg/medical_kg/filter/medkg_triple_metapath_sampling.py`
- Upstream extraction operator: `DataFlow-KG/dataflow/operators/domain_kg/medical_kg/generate/medkg_triple_extractor.py`


