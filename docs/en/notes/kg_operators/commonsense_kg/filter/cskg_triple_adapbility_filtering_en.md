---
title: CSKGTripleAdapbilityFilter
createTime: 2026/04/01 18:00:00
permalink: /en/kg_operators/commonsense_kg/filter/cskg_triple_adapbility_filtering/
---

## 📚 Overview
`CSKGTripleAdapbilityFilter` is a filter-category operator for filtering commonsense triples by adaptability-related scores.
It reads a triple list together with a corresponding score list, keeps only the triples whose scores fall inside the configured range, and writes the filtered result back into the DataFrame.

Key characteristics of this operator:

- It does not rely on an LLM and instead applies rule-based filtering on existing scores
- It reads `triple` by default and writes to `filtered_triple` by default
- It supports `merge_to_input=True` to overwrite the original triple column directly
- The filtered result is compacted: only triples passing the threshold are kept, without empty placeholders
- The current implementation uses `rationale_scores` as the default `score_key`, which does not match the class name's "adaptability" intent

---

## ✒️ __init__ Function
```python
def __init__(self, merge_to_input: bool = False):
    self.merge_to_input = merge_to_input
```

#### `__init__` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `merge_to_input` | `bool` | `False` | Whether to write the filtered result back into the original column specified by `input_key`. If `False`, the result is written to `output_key`. |

---

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "triple",
    score_key: str = "rationale_scores",
    output_key: str = "filtered_triple",
    min_score: float = 0.95,
    max_score: float = 1.0,
):
    ...
```

`run` first reads a DataFrame from `storage`, validates that the input and score columns exist, and then processes each row. For every row, it zips the triple list with the score list positionally and keeps only those triples whose scores are not `None` and fall inside `[min_score, max_score]`. After filtering, the result is written either to the original input column or to the output column depending on `merge_to_input`.

#### `run` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow storage object. The operator reads the `dataframe` from it and writes filtered results back. |
| `input_key` | `str` | `"triple"` | Input triple column name. |
| `score_key` | `str` | `"rationale_scores"` | Input score column name. Note that the current default does not match the "adaptability" naming. |
| `output_key` | `str` | `"filtered_triple"` | Output column name. When `merge_to_input=False`, filtered results are written here. |
| `min_score` | `float` | `0.95` | Lower score bound. Only triples with values not below this threshold are kept. |
| `max_score` | `float` | `1.0` | Upper score bound. Only triples with values not above this threshold are kept. |

---

## 🤖 Example Usage
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.commonsense_kg.filter.cskg_triple_adapbility_filtering import (
    CSKGTripleAdapbilityFilter,
)

operator = CSKGTripleAdapbilityFilter(merge_to_input=False)
operator.run(
    storage=storage,
    input_key="triple",
    score_key="adaptability_scores",
    output_key="filtered_triple",
    min_score=0.95,
    max_score=1.0,
)
```

---

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `triple` | `List[str]` | Input triple list. |
| `adaptability_scores` / `rationale_scores` | `List[float]` | Score list aligned positionally with the triples. Which column is used depends on the actual `score_key` you pass. |
| `filtered_triple` | `List[str]` | Filtered triple-result list. |

---

#### Example Input
```json
[
  {
    "triple": [
      "<subj> Tom <obj> umbrella <rel> uses",
      "<subj> fish <obj> bicycle <rel> rides"
    ],
    "adaptability_scores": [0.97, 0.12]
  }
]
```

#### Example Output
```json
[
  {
    "triple": [
      "<subj> Tom <obj> umbrella <rel> uses",
      "<subj> fish <obj> bicycle <rel> rides"
    ],
    "adaptability_scores": [0.97, 0.12],
    "filtered_triple": [
      "<subj> Tom <obj> umbrella <rel> uses"
    ]
  }
]
```

---

#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/commonsense_kg/filter/cskg_triple_adapbility_filtering.py`
- Related evaluation operator: `DataFlow-KG/dataflow/operators/commonsense_kg/eval/cskg_triple_adapbility_eval.py`
- Storage implementation: `DataFlow-KG/dataflow/utils/storage.py`

