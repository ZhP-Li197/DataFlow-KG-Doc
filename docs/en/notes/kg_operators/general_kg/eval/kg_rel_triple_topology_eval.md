---
title: KGRelationTripleTopologyEvaluator
createTime: 2026/04/10 15:40:44
permalink: /en/kg_operators/general_kg/eval/kg_rel_triple_topology_eval/
---

## 📚 Overview
`KGRelationTripleTopologyEvaluator` is an evaluation operator that assesses the topological structural features of knowledge graphs.
It reads a list of triples from each row, constructs an undirected graph using NetworkX, computes a set of graph topology metrics, and writes the results back to the DataFrame.

Key characteristics of this operator:

- Does **not** require `LLMServingABC` — this is a pure graph computation operator with no dependency on a large language model.
- Uses NetworkX to construct an undirected graph and compute topology metrics.
- Outputs 6 metric columns in a single run: `lcc_ratio`, `structure_avg_degree`, `fragmentation_score`, `num_components`, `node_count`, and `edge_count`.
- Supports input cells as either Python lists or JSON strings that can be deserialized.
- When input is empty or parsing fails, outputs degenerate values (node count / edge count as 0, fragmentation score as 1.0).

---

## ✒️ `__init__` Parameters
```python
def __init__(self):
    ...
```

This operator requires no constructor parameters and can be instantiated directly.

---

## 💡 `run` Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "triple"
):
    ...
```

`run` reads the DataFrame from `storage` and extracts the triple list specified by `input_key` row by row, attempting JSON parsing if the value is a string. It then calls `process_batch()` to build an undirected graph for each row and compute the topology metrics: largest connected component ratio (`lcc_ratio`), average degree (`structure_avg_degree`), fragmentation score (`fragmentation_score`), number of connected components (`num_components`), node count (`node_count`), and edge count (`edge_count`) — all 6 columns are written back to the DataFrame.

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow storage object. The operator reads the `dataframe` from it and writes evaluation results back. |
| `input_key` | `str` | `"triple"` | Input triple column name. Each cell should be a `List[str]`, or a JSON string. |

---

## 🤖 Example Usage
```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.general_kg.eval.kg_rel_triple_topology_eval import (
    KGRelationTripleTopologyEvaluator,
)

operator = KGRelationTripleTopologyEvaluator()
operator.run(
    storage=storage,
    input_key="triple",
)
```

---

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `lcc_ratio` | `float` | Ratio of nodes in the largest connected component to total nodes, in the range `[0.0, 1.0]`. |
| `structure_avg_degree` | `float` | Average node degree, calculated as `2 * edge_count / node_count`. |
| `fragmentation_score` | `float` | Degree of graph fragmentation, calculated as `(num_components - 1) / (node_count - 1)`, in the range `[0.0, 1.0]`. |
| `num_components` | `int` | Number of connected components in the graph. |
| `node_count` | `int` | Total number of nodes (entities) in the graph. |
| `edge_count` | `int` | Total number of edges (relations) in the graph. |

---

#### Example Input
```json
[
  {
    "triple": [
      "<subj> Alice <obj> Bob <rel> knows",
      "<subj> Bob <obj> Carol <rel> worksWith",
      "<subj> Dave <obj> Eve <rel> knows"
    ]
  }
]
```

#### Example Output
```json
[
  {
    "triple": ["..."],
    "lcc_ratio": 0.6,
    "structure_avg_degree": 1.3333,
    "fragmentation_score": 0.25,
    "num_components": 2,
    "node_count": 5,
    "edge_count": 2
  }
]
```

---

#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/general_kg/eval/kg_rel_triple_topology_eval.py`
- Dependency: [NetworkX](https://networkx.org/)