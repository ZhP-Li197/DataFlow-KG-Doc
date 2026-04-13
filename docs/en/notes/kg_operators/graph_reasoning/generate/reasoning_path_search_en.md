---
title: KGReasoningPathSearch
createTime: 2026/04/01 15:05:00
permalink: /en/kg_operators/graph_reasoning/generate/reasoning_path_search/
---

## 📚 Overview
`KGReasoningPathSearch` is a generate-category operator for multi-hop path search over a knowledge graph.
It takes KG triplets and target entity pairs, searches for all simple paths connecting each pair, and writes the grouped path results back into the DataFrame for downstream reasoning operators.

Key characteristics of this operator:

- It does not rely on an LLM and instead performs graph-based path reasoning
- It builds an undirected graph, so each triplet can participate in path search in both directions
- It writes to `mpath` by default
- It supports both the newer `List[List[str]]` target format and older backward-compatible string/list formats
- Path results are organized hierarchically as "entity pair -> multiple paths -> triplets in each path"

---

## ✒️ `__init__` Function
```python
def __init__(self, max_hop: int = 10):
    ...
```

#### `__init__` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `max_hop` | `int` | `10` | Maximum hop limit for path search. Paths longer than this limit are not expanded further. |

---

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "triple",
    output_key: str = "mpath",
) -> List[str]:
    ...
```

`run` first reads a DataFrame from `storage`, validates the required columns, and then processes rows one by one. For each row, it reads the triplet list and builds an undirected adjacency graph. It then interprets `target_entity` according to its format: if the value is in the newer `List[List[str]]` format, the operator searches paths for each entity pair directly; otherwise it falls back to the older compatible logic, expands the targets, and enumerates all pairwise combinations. The final result is written to `output_key` as nested lists.

Internally, the search logic uses BFS to enumerate all simple paths from `src` to `tgt`. Each path is stored as a list of triplet strings. As long as the search reaches the target node with a non-empty path, that path is added to the output.

#### `run` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow storage object. The operator reads the `dataframe` from it and writes path-search results back. |
| `input_key` | `str` | `"triple"` | Input triplet column name. The current validation logic actually checks for a column named `triplet`, so if you use the default value directly, make sure the real data column matches the implementation. |
| `output_key` | `str` | `"mpath"` | Output column name used to store multi-hop path results. |

---

## 🤖 Example Usage
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.graph_reasoning.generate.reasoning_path_search import (
    KGReasoningPathSearch,
)

operator = KGReasoningPathSearch(max_hop=3)
operator.run(
    storage=storage,
    input_key="triplet",
    output_key="mpath",
)
```

---

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `triplet` | `List[str]` | Input KG triplet list. |
| `target_entity` | `str` / `List[str]` / `List[List[str]]` | Target-entity input. The recommended format is `List[List[str]]`, where each item represents one entity pair. |
| `mpath` | `List[List[List[str]]]` | Path-search result. The outer layer is grouped by entity pair, the middle layer stores multiple paths, and the inner layer stores triplets inside each path. |

---

#### Example Input
```json
[
  {
    "triplet": [
      "<subj> Henry <obj> Maria Rodriguez <rel> is_trained_by",
      "<subj> Maria Rodriguez <obj> Berlin <rel> lives_in"
    ],
    "target_entity": [["Henry, Berlin"]]
  }
]
```

#### Example Output
```json
[
  {
    "triplet": [
      "<subj> Henry <obj> Maria Rodriguez <rel> is_trained_by",
      "<subj> Maria Rodriguez <obj> Berlin <rel> lives_in"
    ],
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

---

#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/graph_reasoning/generate/reasoning_path_search.py`
- Downstream relation-generation operator: `DataFlow-KG/dataflow/operators/graph_reasoning/generate/reasoning_rel_generator.py`
- Storage implementation: `DataFlow-KG/dataflow/utils/storage.py`

