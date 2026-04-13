---
title: KGReasoningPathRedundancyFilter
createTime: 2026/04/01 16:00:00
permalink: /en/kg_operators/graph_reasoning/filter/reasoning_path_redundancy_filtering/
---

## 📚 Overview
`KGReasoningPathRedundancyFilter` is a filter-category operator for knowledge-graph path redundancy filtering.
It uses path redundancy scores to keep only those path results whose scores fall inside the configured interval, and writes the filtered result back into the DataFrame.

Key characteristics of this operator:

- It does not rely on an LLM and instead applies rule-based filtering on existing redundancy scores
- It reads `mpath` and `redundancy_scores` by default
- It writes to `filtered_mpath` by default
- It supports `merge_to_input=True` to overwrite the original path column directly
- The current implementation performs positional filtering directly at the top level of `mpath` and `redundancy_scores`

---

## ✒️ __init__ Function
```python
def __init__(self, merge_to_input: bool = False):
    ...
```

#### `__init__` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `merge_to_input` | `bool` | `False` | Whether to write the filtered result back into the original path column specified by `input_key`. If `False`, the result is written to `output_key`. |

---

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "mpath",
    score_key: str = "redundancy_scores",
    output_key: str = "filtered_mpath",
    min_score: float = 0.0,
    max_score: float = 0.5,
):
    ...
```

`run` first reads a DataFrame from `storage`, validates that the input path column and score column exist, and then processes each row. In the current implementation, it directly zips the top-level `mpath` list with the top-level `redundancy_scores` list and keeps only the elements whose scores fall inside `[min_score, max_score]`. After processing, the filtered result is written either to the original input column or to the output column depending on `merge_to_input`.

#### `run` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow storage object. The operator reads the `dataframe` from it and writes filtered results back. |
| `input_key` | `str` | `"mpath"` | Input path column name. |
| `score_key` | `str` | `"redundancy_scores"` | Input redundancy-score column name. |
| `output_key` | `str` | `"filtered_mpath"` | Output column name. When `merge_to_input=False`, filtered results are written here. |
| `min_score` | `float` | `0.0` | Lower score bound. Only elements with values not below this threshold are kept. |
| `max_score` | `float` | `0.5` | Upper score bound. Only elements with values not above this threshold are kept. |

---

## 🤖 Example Usage
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.graph_reasoning.filter.reasoning_path_redundancy_filtering import (
    KGReasoningPathRedundancyFilter,
)

operator = KGReasoningPathRedundancyFilter(merge_to_input=False)
operator.run(
    storage=storage,
    input_key="mpath",
    score_key="redundancy_scores",
    output_key="filtered_mpath",
    min_score=0.0,
    max_score=0.5,
)
```

---

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `mpath` | `List[List[List[str]]]` | Input path column. In the current implementation, each top-level entity-pair group in `mpath` is paired with one redundancy score for filtering. |
| `redundancy_scores` | `List[float]` | Input redundancy-score column. In the current implementation, it is expected to align with the top level of `mpath`, and each element must be directly comparable as a numeric value against `min_score` and `max_score`. |
| `filtered_mpath` | `List[List[List[str]]]` | Filtered path-result list. The current implementation keeps only the top-level entity-pair groups that pass the score threshold. |

---

#### Example Input
```json
[
  {
    "mpath": [
      [
        [
          "<subj> Alice Smith <obj> Graph Neural Networks for Scientific Discovery <rel> author_of",
          "<subj> Graph Neural Networks for Scientific Discovery <obj> KDD 2024 <rel> published_at"
        ]
      ],
      [
        [
          "<subj> Alice Smith <obj> Peking University <rel> affiliated_with",
          "<subj> Peking University <obj> Beijing <rel> located_in",
          "<subj> Beijing <obj> China <rel> part_of"
        ]
      ]
    ],
    "redundancy_scores": [0.2, 0.8]
  }
]
```

#### Example Output
```json
[
  {
    "mpath": [
      [
        [
          "<subj> Alice Smith <obj> Graph Neural Networks for Scientific Discovery <rel> author_of",
          "<subj> Graph Neural Networks for Scientific Discovery <obj> KDD 2024 <rel> published_at"
        ]
      ],
      [
        [
          "<subj> Alice Smith <obj> Peking University <rel> affiliated_with",
          "<subj> Peking University <obj> Beijing <rel> located_in",
          "<subj> Beijing <obj> China <rel> part_of"
        ]
      ]
    ],
    "redundancy_scores": [0.2, 0.8],
    "filtered_mpath": [
      [
        [
          "<subj> Alice Smith <obj> Graph Neural Networks for Scientific Discovery <rel> author_of",
          "<subj> Graph Neural Networks for Scientific Discovery <obj> KDD 2024 <rel> published_at"
        ]
      ]
    ]
  }
]
```

---
#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/graph_reasoning/filter/reasoning_path_redundancy_filtering.py`
- Upstream evaluation operator: `DataFlow-KG/dataflow/operators/graph_reasoning/eval/reasoning_path_redundancy_eval.py`
- Storage implementation: `DataFlow-KG/dataflow/utils/storage.py`
