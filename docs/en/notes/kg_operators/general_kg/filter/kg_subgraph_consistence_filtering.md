---
title: KGSubgraphConsistenceFilter
createTime: 2026/04/10 15:40:44
permalink: /en/kg_operators/general_kg/filter/kg_subgraph_consistence_filtering/
---

## 📚 Overview
`KGSubgraphConsistenceFilter` is a filtering operator that filters knowledge graph subgraphs based on consistency scores.
It reads the subgraph column and the corresponding consistency score column, applies threshold-based filtering at the row level, retains rows whose scores fall within the specified range, and writes the results back to the DataFrame.

Key characteristics of this operator:

- Does **not** require `LLMServingABC` — this is a pure threshold-based filtering operator with no dependency on a large language model
- Filtering granularity is **row-level**: rows satisfying the condition are retained as a whole; rows that do not satisfy the condition are removed entirely (not element-wise filtering)
- Does not add any new output columns; writes the filtered DataFrame directly back to storage
- Typically used with the `consistency_score` column output by `KGSubgraphConsistency`
- In this operator, the `output_key` parameter specifies the **score column name** (i.e., the column used for filtering), not a new column name

---

## ✒️ `__init__` Parameters
```python
def __init__(self, merge_to_input: bool = False):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `merge_to_input` | `bool` | `False` | Reserved parameter. Not used in the main processing flow in the current version. |

---

## 💡 `run` Parameters
```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "subgraph",
    output_key: str = "consistency_score",
    min_score: float = 0.95,
    max_score: float = 1.0,
):
    ...
```

`run` reads the DataFrame from `storage`, validates that both `input_key` and `output_key` (score column) exist, then applies the condition `min_score ≤ score ≤ max_score` to the `output_key` column, removes rows that do not satisfy the condition, and writes the retained rows back to storage.

> Note: In this operator, `output_key` semantically refers to the **score column name used for filtering**, not a new output column. The operator does not add any columns.

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow storage object. The operator reads the `dataframe` from it and writes the filtered rows back. |
| `input_key` | `str` | `"subgraph"` | Subgraph column name, used to validate the column exists. Does not directly participate in filtering logic. |
| `output_key` | `str` | `"consistency_score"` | Consistency score column name used for filtering, typically the output column of `KGSubgraphConsistency`. |
| `min_score` | `float` | `0.95` | Minimum score threshold (inclusive) for retaining a row. |
| `max_score` | `float` | `1.0` | Maximum score threshold (inclusive) for retaining a row. |

---

## 🤖 Example Usage
```python
from dataflow.operators.general_kg.filter.kg_subgraph_consistence_filtering import (
    KGSubgraphConsistenceFilter,
)

operator = KGSubgraphConsistenceFilter()
operator.run(
    storage=storage,
    input_key="subgraph",
    output_key="consistency_score",
    min_score=0.95,
    max_score=1.0,
)
```

---

#### Default Output Format

This operator does not add new columns. It outputs the subset of rows satisfying the condition.

| Field | Type | Description |
| :-- | :-- | :-- |
| `subgraph` | `List[str]` | Subgraph triple list of retained rows (preserved as-is). |
| `consistency_score` | `float` | Consistency score used for filtering (preserved as-is). |

---

#### Example Input
```json
[
  {"subgraph": ["..."], "consistency_score": 0.97},
  {"subgraph": ["..."], "consistency_score": 0.60},
  {"subgraph": ["..."], "consistency_score": 0.99}
]
```

#### Example Output (`min_score=0.95`)
```json
[
  {"subgraph": ["..."], "consistency_score": 0.97},
  {"subgraph": ["..."], "consistency_score": 0.99}
]
```

---

#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/general_kg/filter/kg_subgraph_consistence_filtering.py`
- Upstream evaluation operator: `DataFlow-KG/dataflow/operators/general_kg/eval/kg_subgraph_consistence_eval.py`