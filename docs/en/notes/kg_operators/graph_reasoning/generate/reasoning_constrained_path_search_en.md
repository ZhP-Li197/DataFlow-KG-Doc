---
title: KGReasoningConstrainedPathSearch
createTime: 2026/04/01 15:15:00
icon: material-symbols:deployed-code-outline
permalink: /en/kg_operators/graph_reasoning/generate/reasoning_constrained_path_search/
---

## 📚 Overview
`KGReasoningConstrainedPathSearch` is a generate-category operator for constrained path search over a knowledge graph.
It extends ordinary multi-hop path search with constraints such as required intermediate entities, allowed relations, and entity types, and only keeps paths that satisfy those constraints.

Key characteristics of this operator:

- It does not rely on an LLM in the main workflow and instead performs constrained graph search
- It supports path restrictions through `must_pass_entities`, `allowed_relations`, and `required_entity_types`
- It writes to `cons_mpath` by default
- It supports both the newer `List[List[str]]` target format and older backward-compatible string/list formats
- The current implementation builds a directed graph, unlike `KGReasoningPathSearch` which expands both directions

---

## ✒️ __init__ Function
```python
def __init__(
    self,
    llm_serving: LLMServingABC = None,
    max_hop: int = 3,
    must_pass_entities: List[str] = None,
    allowed_relations: List[str] = None,
    required_entity_types: List[str] = None,
    entity_type_map: Dict[str, str] = None,
):
    ...
```

## `__init__` Parameters

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | `None` | Reserved LLM serving parameter. The current implementation does not use it during path search. |
| `max_hop` | `int` | `3` | Maximum hop limit for path search. Paths longer than this limit are not expanded further. |
| `must_pass_entities` | `List[str]` | `None` | Set of entities that every valid path must include. |
| `allowed_relations` | `List[str]` | `None` | Set of allowed relations for graph construction and search. Triples with other relations are filtered out during graph building. |
| `required_entity_types` | `List[str]` | `None` | At least one specified entity type must appear on the path. |
| `entity_type_map` | `Dict[str, str]` | `None` | Entity-to-type mapping used together with `required_entity_types` for constraint checking. |

---

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage,
    triplet_key: str = "triplet",
    target_key: str = "target_entity",
    output_key: str = "cons_mpath",
):
    ...
```

`run` first reads a DataFrame from `storage`, then processes each row by reading triplets and target entities. For every row, the operator builds a graph from `triplet_key`, then interprets `target_entity` according to its format. If the value uses the newer `List[List[str]]` format, it searches one entity pair at a time. If it uses an older compatible string/list format, it expands the targets first and then enumerates all pairwise combinations. Path search itself is implemented with DFS, and only paths satisfying both the hop limit and all configured constraints are kept.

Constraint checking happens after a candidate path is found. If `must_pass_entities` is configured, the path must cover all of them. If `required_entity_types` is configured, the set of entity types appearing on the path must intersect with the required type set.

## `run` Parameters

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow storage object. The operator reads the `dataframe` from it and writes constrained path-search results back. |
| `triplet_key` | `str` | `"triplet"` | Input triplet column name. |
| `target_key` | `str` | `"target_entity"` | Input target-entity column name. |
| `output_key` | `str` | `"cons_mpath"` | Output column name used to store constrained multi-hop paths. |

---

## 🤖 Example Usage
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.graph_reasoning.generate.reasoning_constrained_path_search import (
    KGReasoningConstrainedPathSearch,
)

operator = KGReasoningConstrainedPathSearch(
    max_hop=3,
    must_pass_entities=["Maria Rodriguez"],
)
operator.run(
    storage=storage,
    triplet_key="triplet",
    target_key="target_entity",
    output_key="cons_mpath",
)
```

---

## Default Output Format

| Field | Type | Description |
| :-- | :-- | :-- |
| `triplet` | `List[str]` | Input KG triplet list. |
| `target_entity` | `str` / `List[str]` / `List[List[str]]` | Target-entity input. The recommended format is `List[List[str]]`, where each item represents one entity pair. |
| `cons_mpath` | `List[List[List[str]]]` | Constraint-satisfying path results. The outer layer is grouped by entity pair, the middle layer stores multiple paths, and the inner layer stores triplets inside each path. |

---

### Example Input

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

### Example Output

```json
[
  {
    "triplet": [
      "<subj> Henry <obj> Maria Rodriguez <rel> is_trained_by",
      "<subj> Maria Rodriguez <obj> Berlin <rel> lives_in"
    ],
    "target_entity": [["Henry, Berlin"]],
    "cons_mpath": [
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

### Related Links

- Operator implementation: `DataFlow-KG/dataflow/operators/graph_reasoning/generate/reasoning_constrained_path_search.py`
- Related base path-search operator: `DataFlow-KG/dataflow/operators/graph_reasoning/generate/reasoning_path_search.py`
- Storage implementation: `DataFlow-KG/dataflow/utils/storage.py`
