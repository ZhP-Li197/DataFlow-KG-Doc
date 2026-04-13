---
title: KGTupleRemoveRepeated
createTime: 2026/04/10 15:40:44
permalink: /en/kg_operators/general_kg/filter/kg_tuple_remove_repeated/
---

## 📚 Overview
`KGTupleRemoveRepeated` is a filtering operator for cleaning and deduplicating knowledge graph triples or tuples.
It flattens and merges all tuple lists from all rows of the input DataFrame, removes exactly duplicate tuple strings, and writes the deduplicated result as a single row.

Key characteristics of this operator:

- Does **not** require `LLMServingABC` — this is a pure string deduplication operator with no dependency on a large language model
- Deduplication strategy is **strict exact match**: only completely identical strings are removed; no semantic merging is performed
- Supports relational triples (`<subj>...<obj>...<rel>...`), attribute triples (`<entity>...<attribute>...<value>...`), and any `<tag>`-marked tuples
- After flattening across all rows and deduplicating, the output is a **single-row** DataFrame (output row count is always 1)
- Input column auto-fallback: prioritizes `input_key`, then falls back to `triple`, then `tuple`
- The output column name defaults to the same as the input column name (i.e., overwrite in place); can be customized via `output_key`

---

## ✒️ `__init__` Parameters
```python
def __init__(
    self,
    llm_serving: LLMServingABC = None,
    seed: int = 0,
    lang: str = "en",
    merge_to_input: bool = False
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | `None` | Not used by this operator. Reserved for interface compatibility only. |
| `seed` | `int` | `0` | Random seed for initializing the internal random number generator (does not affect deduplication logic in the current version). |
| `lang` | `str` | `"en"` | Language setting. Does not affect processing logic in the current version. |
| `merge_to_input` | `bool` | `False` | Reserved parameter. Not used in the main processing flow in the current version. |

---

## 💡 `run` Parameters
```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "triple",
    output_key: str = "triple",
):
    ...
```

`run` reads the DataFrame from `storage`, determines the input column by priority (`input_key` → `triple` → `tuple`), and automatically sets the default output column name based on the input column name. It then flattens all tuple lists from all rows into a single one-dimensional list, performs strict exact deduplication (preserving first-occurrence order), and writes the deduplicated list as a single row into a new DataFrame.

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow storage object. The operator reads the `dataframe` from it and writes the deduplicated result to a new DataFrame. |
| `input_key` | `str` | `"triple"` | Input tuple column name. Supports auto-fallback to `triple` and `tuple`. |
| `output_key` | `str` | `"triple"` | Output column name. Defaults to the same as the input column (i.e., overwrite). |

---

## 🤖 Example Usage
```python
from dataflow.operators.general_kg.filter.kg_tuple_remove_repeated import (
    KGTupleRemoveRepeated,
)

operator = KGTupleRemoveRepeated()
operator.run(
    storage=storage,
    input_key="triple",
    output_key="triple",
)
```

---

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `triple` / `tuple` | `List[str]` | Deduplicated list of tuple strings. The output DataFrame is always 1 row and contains all unique tuples. |

---

#### Example Input
```json
[
  {
    "triple": [
      "<subj> Alice <obj> Bob <rel> knows",
      "<subj> Bob <obj> Carol <rel> worksWith"
    ]
  },
  {
    "triple": [
      "<subj> Bob <obj> Carol <rel> worksWith",
      "<subj> Carol <obj> Dave <rel> manages"
    ]
  }
]
```

#### Example Output
```json
[
  {
    "triple": [
      "<subj> Alice <obj> Bob <rel> knows",
      "<subj> Bob <obj> Carol <rel> worksWith",
      "<subj> Carol <obj> Dave <rel> manages"
    ]
  }
]
```

---

#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/general_kg/filter/kg_tuple_remove_repeated.py`