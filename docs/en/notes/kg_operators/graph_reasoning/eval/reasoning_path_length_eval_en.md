---
title: KGReasoningPathLengthEvaluator
createTime: 2026/04/01 16:25:00
permalink: /en/kg_operators/graph_reasoning/eval/reasoning_path_length_eval/
---

## 📚 Overview
`KGReasoningPathLengthEvaluator` is an evaluation-category operator for knowledge-graph multi-hop path length assessment.
It reads existing multi-hop path results from `mpath`, counts the number of triples in each path, and writes the length results back into the DataFrame with the same nested structure. This is commonly used for downstream path filtering or path analysis.

Key characteristics of this operator:

- It does not rely on an LLM and instead performs local structural counting
- It reads `mpath` by default and writes to `mpath_length` by default
- The output structure stays fully aligned with the input path structure
- Invalid path items fall back to length `0`
- Invalid row-level inputs fall back to an empty list `[]` for that row

---

## ✒️ `__init__` Function
```python
def __init__(self):
    ...
```

#### `__init__` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| - | - | - | This operator does not require extra initialization parameters. |

---

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "mpath",
    output_key: str = "mpath_length",
) -> List[str]:
    ...
```

`run` first reads a DataFrame from `storage` and checks whether the path column specified by `input_key` exists. It then processes `mpath` row by row. For each entity-pair group in a row, the operator iterates through the paths in that group and uses the number of triples in each path as its length value. The final result keeps exactly the same nested structure as the original path data and is written into `output_key`.

#### `run` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow storage object. The operator reads the `dataframe` from it and writes path-length results back. |
| `input_key` | `str` | `"mpath"` | Input path column name. It is usually produced by an upstream path-search operator. |
| `output_key` | `str` | `"mpath_length"` | Output column name used to store per-path length values. |

---

## 🤖 Example Usage
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.graph_reasoning.eval.reasoning_path_length_eval import (
    KGReasoningPathLengthEvaluator,
)

operator = KGReasoningPathLengthEvaluator()
operator.run(
    storage=storage,
    input_key="mpath",
    output_key="mpath_length",
)
```

---

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `mpath` | `List[List[List[str]]]` | Input multi-hop path result grouped by entity pair. |
| `mpath_length` | `List[List[int]]` | Length result aligned with `mpath`. Each path is replaced by the number of triples it contains. |

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
        ],
        [
          "<subj> Alice Smith <obj> Peking University <rel> affiliated_with",
          "<subj> Peking University <obj> Beijing <rel> located_in",
          "<subj> Beijing <obj> China <rel> part_of"
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
    "mpath": [
      [
        [
          "<subj> Alice Smith <obj> Graph Neural Networks for Scientific Discovery <rel> author_of",
          "<subj> Graph Neural Networks for Scientific Discovery <obj> KDD 2024 <rel> published_at"
        ],
        [
          "<subj> Alice Smith <obj> Peking University <rel> affiliated_with",
          "<subj> Peking University <obj> Beijing <rel> located_in",
          "<subj> Beijing <obj> China <rel> part_of"
        ]
      ]
    ],
    "mpath_length": [
      [2, 3]
    ]
  }
]
```

---
#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/graph_reasoning/eval/reasoning_path_length_eval.py`
- Downstream filtering operator: `DataFlow-KG/dataflow/operators/graph_reasoning/filter/reasoning_path_length_filtering.py`
- Storage implementation: `DataFlow-KG/dataflow/utils/storage.py`
