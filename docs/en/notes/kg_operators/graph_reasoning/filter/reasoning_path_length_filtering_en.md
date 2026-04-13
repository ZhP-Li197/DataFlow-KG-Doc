---
title: KGReasoningPathLengthFilter
createTime: 2026/04/01 15:50:00
permalink: /en/kg_operators/graph_reasoning/filter/reasoning_path_length_filtering/
---

## 📚 Overview
`KGReasoningPathLengthFilter` is a filter-category operator for knowledge-graph multi-hop path length filtering.
It uses precomputed path-length information to keep only those paths in `mpath` whose lengths fall inside the configured range, and writes the filtered result back into the DataFrame.

Key characteristics of this operator:

- It does not rely on an LLM and instead applies rule-based filtering on path-length results
- It reads `mpath` and `mpath_length` by default
- It writes to `filtered_mpath` by default
- It preserves the original nested grouping by entity pair and only removes paths that do not satisfy the length range
- The allowed interval is controlled by `min_length` and `max_length` from initialization

---

## ✒️ __init__ Function
```python
def __init__(self, min_length: int = 1, max_length: int = 10):
    ...
```

#### `__init__` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `min_length` | `int` | `1` | Lower bound of path length. Only paths with lengths not below this value are kept. |
| `max_length` | `int` | `10` | Upper bound of path length. Only paths with lengths not above this value are kept. |

---

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    mpath_key: str = "mpath",
    length_key: str = "mpath_length",
    output_path_key: str = "filtered_mpath",
) -> List[str]:
    ...
```

`run` first reads a DataFrame from `storage`, validates that `mpath` and `mpath_length` exist, and then processes rows one by one. For each row, the operator iterates over the path groups corresponding to each entity pair and filters the paths using the aligned length list. Only paths whose lengths fall inside `[min_length, max_length]` are kept, and the filtered result preserves the same per-pair nesting structure.

#### `run` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow storage object. The operator reads the `dataframe` from it and writes filtered results back. |
| `mpath_key` | `str` | `"mpath"` | Input path column name, usually produced by an upstream path-search operator. |
| `length_key` | `str` | `"mpath_length"` | Input path-length column name, usually produced by an upstream path-length evaluator. |
| `output_path_key` | `str` | `"filtered_mpath"` | Output column name used to store length-filtered path results. |

---

## 🤖 Example Usage
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.graph_reasoning.filter.reasoning_path_length_filtering import (
    KGReasoningPathLengthFilter,
)

operator = KGReasoningPathLengthFilter(min_length=2, max_length=2)
operator.run(
    storage=storage,
    mpath_key="mpath",
    length_key="mpath_length",
    output_path_key="filtered_mpath",
)
```

---

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `mpath` | `List[List[List[str]]]` | Input multi-hop path result grouped by entity pair. |
| `mpath_length` | `List[List[int]]` | Path-length result aligned with `mpath`. |
| `filtered_mpath` | `List[List[List[str]]]` | Filtered path result that keeps the same grouping level as `mpath`. |

---

#### Example Input
```json
[
  {
    "mpath": [
      [
        ["t1", "t2"],
        ["t1", "t2", "t3"]
      ]
    ],
    "mpath_length": [
      [2, 3]
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
        ["t1", "t2"],
        ["t1", "t2", "t3"]
      ]
    ],
    "mpath_length": [
      [2, 3]
    ],
    "filtered_mpath": [
      [
        ["t1", "t2"]
      ]
    ]
  }
]
```

---
#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/graph_reasoning/filter/reasoning_path_length_filtering.py`
- Upstream evaluation operator: `DataFlow-KG/dataflow/operators/graph_reasoning/eval/reasoning_path_length_eval.py`
- Storage implementation: `DataFlow-KG/dataflow/utils/storage.py`

