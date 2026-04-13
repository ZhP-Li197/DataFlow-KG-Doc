---
title: KGSubgraphConnectivityEvaluator
createTime: 2026/04/10 15:40:44
permalink: /en/kg_operators/general_kg/eval/kg_subgraph_connectivity_eval/
---

## 📚 Overview
`KGSubgraphConnectivityEvaluator` is an evaluation operator that computes connectivity metrics for knowledge graph subgraphs.
It reads a list of subgraph triples from each row, builds an undirected graph, and calculates vertex connectivity, edge connectivity, and global efficiency, writing the results back to the DataFrame.

Key characteristics of this operator:

- Does **not** require `LLMServingABC` — this is a pure graph computation operator with no dependency on a large language model.
- Uses NetworkX to compute `node_connectivity`, `edge_connectivity`, and `global_efficiency`.
- Relation types are ignored during triple parsing; only entity-level connection structure is considered.
- Input cells must be Python lists; rows with non-list types fall back to zero values.
- When the node count is ≤ 1, all three metrics fall back to `0` / `0.0`.

---

## ✒️ `__init__` Parameters
```python
def __init__(self, merge_to_input: bool = False):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `merge_to_input` | `bool` | `False` | Reserved parameter; not used in the current main pipeline. |

---

## 💡 `run` Function
```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "subgraph",
    output_key1: str = "vertex_connectivity",
    output_key2: str = "edge_connectivity",
    output_key3: str = "global_efficiency"
):
    ...
```

`run` reads the DataFrame from `storage`, validates that the `input_key` column exists, then iterates over each row's triple list and constructs an undirected graph. For each graph, it calls NetworkX's `node_connectivity`, `edge_connectivity`, and `global_efficiency` functions to compute the three connectivity metrics and writes results to the columns specified by `output_key1`, `output_key2`, and `output_key3`. If any computation raises an exception, that metric falls back to `0` / `0.0`.

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow storage object. The operator reads the `dataframe` from it and writes evaluation results back. |
| `input_key` | `str` | `"subgraph"` | Input subgraph column name. Each cell should be a `List[str]` of triples. |
| `output_key1` | `str` | `"vertex_connectivity"` | Output column name for vertex connectivity. |
| `output_key2` | `str` | `"edge_connectivity"` | Output column name for edge connectivity. |
| `output_key3` | `str` | `"global_efficiency"` | Output column name for global efficiency. |

---

## 🤖 Example Usage
```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.general_kg.eval.kg_subgraph_connectivity_eval import (
    KGSubgraphConnectivityEvaluator,
)

operator = KGSubgraphConnectivityEvaluator()
operator.run(
    storage=storage,
    input_key="subgraph",
    output_key1="vertex_connectivity",
    output_key2="edge_connectivity",
    output_key3="global_efficiency",
)
```

---

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `subgraph` | `List[str]` | Input subgraph triple list in `<subj> ... <obj> ... <rel> ...` format. |
| `vertex_connectivity` | `int` | Vertex connectivity — the minimum number of nodes that must be removed to disconnect the graph. |
| `edge_connectivity` | `int` | Edge connectivity — the minimum number of edges that must be removed to disconnect the graph. |
| `global_efficiency` | `float` | Global efficiency, measuring the average efficiency of information propagation between nodes, in the range `[0.0, 1.0]`. |

---

#### Example Input
```json
[
  {
    "subgraph": [
      "<subj> Henry <obj> Lucy <rel> is_inspired_by",
      "<subj> Lucy <obj> Tom <rel> collaborates_with",
      "<subj> Tom <obj> Henry <rel> mentors"
    ]
  }
]
```

#### Example Output
```json
[
  {
    "subgraph": ["..."],
    "vertex_connectivity": 1,
    "edge_connectivity": 1,
    "global_efficiency": 0.8333
  }
]
```

---

#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/general_kg/eval/kg_subgraph_connectivity_eval.py`
- Dependency: [NetworkX](https://networkx.org/)