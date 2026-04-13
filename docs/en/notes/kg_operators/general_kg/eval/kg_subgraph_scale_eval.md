---
title: KGSubgraphScaleEvaluator
createTime: 2026/04/10 15:40:44
permalink: /en/kg_operators/general_kg/eval/kg_subgraph_scale_eval/
---

## 📚 Overview
`KGSubgraphScaleEvaluator` is an evaluation operator that computes structural scale metrics for knowledge graph subgraphs.
It reads a list of subgraph triples from each row, counts the number of nodes, edges, and graph density, and writes the results back to the DataFrame.

Key characteristics of this operator:

- Does **not** require `LLMServingABC` — this is a pure statistics operator with no dependency on a large language model.
- Parses triples in the `<subj> ... <obj> ... <rel> ...` format using regular expressions.
- Density is calculated as `num_edges / (num_nodes × (num_nodes - 1))`; when the node count is ≤ 1, density falls back to `0.0`.
- The input cell must be a Python list; rows with non-list types will fall back to zero values.
- Does not require the output columns to be absent beforehand — existing columns are overwritten directly.

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
    output_key1: str = "num_nodes",
    output_key2: str = "num_edges",
    output_key3: str = "density"
):
    ...
```

`run` reads the DataFrame from `storage`, validates that the `input_key` column exists, and then iterates over each row's triple list. For each triple, it uses a regular expression to extract the subject and object, accumulates a unique node set and edge list, computes the graph density, and writes the results to the columns specified by `output_key1`, `output_key2`, and `output_key3`.

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow storage object. The operator reads the `dataframe` from it and writes results back. |
| `input_key` | `str` | `"subgraph"` | Input subgraph column name. Each cell should be a `List[str]` of triples. |
| `output_key1` | `str` | `"num_nodes"` | Output column name for node count. |
| `output_key2` | `str` | `"num_edges"` | Output column name for edge count. |
| `output_key3` | `str` | `"density"` | Output column name for graph density. |

---

## 🤖 Example Usage
```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.general_kg.eval.kg_subgraph_scale_eval import (
    KGSubgraphScaleEvaluator,
)

operator = KGSubgraphScaleEvaluator()
operator.run(
    storage=storage,
    input_key="subgraph",
    output_key1="num_nodes",
    output_key2="num_edges",
    output_key3="density",
)
```

---

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `subgraph` | `List[str]` | Input subgraph triple list in `<subj> ... <obj> ... <rel> ...` format. |
| `num_nodes` | `int` | Number of unique entities (nodes) in the subgraph. |
| `num_edges` | `int` | Number of relations (edges) in the subgraph; duplicate edges are allowed. |
| `density` | `float` | Subgraph density, measuring the ratio of actual edges to the maximum possible edges. Returns `0.0` when node count ≤ 1. |

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
    "num_nodes": 3,
    "num_edges": 3,
    "density": 0.5
  }
]
```

---

#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/general_kg/eval/kg_subgraph_scale_eval.py`