---
title: KGRelationTuplePathGenerator
createTime: 2026/04/10 15:40:44
permalink: /en/kg_operators/general_kg/sample/kg_rel_tuple_path_sampling/
---

## 📚 Overview
`KGRelationTuplePathGenerator` is a sampling operator that generates undirected k-hop paths from relation triples.
It builds an undirected graph from the input triples, enumerates paths of length k via DFS, deduplicates the paths, and outputs them.

Key characteristics of this operator:

- Does **not** require `LLMServingABC` — this is a pure graph path enumeration operator with no dependency on a large language model
- Path enumeration ignores edge direction; DFS runs on an undirected graph, and deduplication uses a direction-agnostic canonical form
- Supports `max_paths_per_group` to limit the maximum number of paths per group
- When the DataFrame has multiple rows, triples from all rows are merged before processing; for a single-row DataFrame, the row is used directly
- The output does not preserve the original DataFrame row structure — each path becomes a new row in the output
- The output column name is dynamically assembled from `k` and `output_key_meta`, e.g., `2_hop_paths` when `k=2`

---

## ✒️ `__init__` Parameters
```python
def __init__(
    self,
    llm_serving: LLMServingABC = None,
    seed: int = 0,
    lang: str = "en",
    k: int = 2,
    max_paths_per_group: int = 100,
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | `None` | Not used by this operator. Reserved for interface compatibility only. |
| `seed` | `int` | `0` | Random seed for initializing the internal random number generator. |
| `lang` | `str` | `"en"` | Language setting. Does not affect processing logic in the current version. |
| `k` | `int` | `2` | Number of hops. The operator enumerates paths with exactly `k` edges. |
| `max_paths_per_group` | `int` | `100` | Maximum number of paths to output per group. Excess paths are truncated. |

---

## 💡 `run` Parameters
```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "triple",
    output_key_meta: str = "hop_paths",
):
    ...
```

`run` reads the DataFrame from `storage` and determines the input column by priority (`input_key` → `triple` → `tuple`). It then decides processing mode based on row count: single-row DataFrames are used directly; multi-row DataFrames have all triples merged before processing. The operator builds an undirected graph from the merged triples, performs DFS from each starting node to enumerate paths of length `k`, represents each path as a `||`-separated string of original triple strings, and deduplicates using canonical form. Each path is written as a new row in the output DataFrame, with the column name `{k}_{output_key_meta}` (e.g., `2_hop_paths`).

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow storage object. The operator reads the `dataframe` from it and writes the path results to a new DataFrame. |
| `input_key` | `str` | `"triple"` | Input triple column name. Also supports fallback to `triple` and `tuple` column names. |
| `output_key_meta` | `str` | `"hop_paths"` | Output column name suffix. The actual output column name is `{k}_{output_key_meta}`, e.g., `2_hop_paths`. |

---

## 🤖 Example Usage
```python
from dataflow.operators.general_kg.sample.kg_rel_tuple_path_sampling import (
    KGRelationTuplePathGenerator,
)

operator = KGRelationTuplePathGenerator(
    seed=42,
    k=2,
    max_paths_per_group=200,
)
operator.run(
    storage=storage,
    input_key="triple",
    output_key_meta="hop_paths",
)
```

---

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `{k}_hop_paths` | `str` | Each row is one k-hop path, represented as the original triple strings along the path joined by ` \|\| `. |

---

#### Example Input
```json
[
  {
    "triple": [
      "<subj> Henry <obj> Maria <rel> is_trained_by",
      "<subj> Maria <obj> Jazz <rel> specializes_in",
      "<subj> Henry <obj> Pop <rel> specializes_in"
    ]
  }
]
```

#### Example Output (`k=2`)
```json
[
  {"2_hop_paths": "<subj> Henry <obj> Maria <rel> is_trained_by || <subj> Maria <obj> Jazz <rel> specializes_in"},
  {"2_hop_paths": "<subj> Henry <obj> Maria <rel> is_trained_by || <subj> Henry <obj> Pop <rel> specializes_in"}
]
```

---

#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/general_kg/sample/kg_rel_tuple_path_sampling.py`