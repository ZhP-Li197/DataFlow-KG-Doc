---
title: KGAttributeTupleSampler
createTime: 2026/04/10 15:40:44
permalink: /en/kg_operators/general_kg/sample/kg_attri_tuple_sampling/
---

## 📚 Overview
`KGAttributeTupleSampler` is a sampling operator that performs grouped sampling on entity attribute tuples.
It groups the input attribute tuples by entity or attribute, optionally truncates the number of groups and tuples per group, and outputs each group as a subgraph.

Key characteristics of this operator:

- Does **not** require `LLMServingABC` — this is a pure rule-based sampling operator with no dependency on a large language model
- Supports two grouping modes: `group_by="entity"` aggregates all attributes of the same entity; `group_by="attribute"` aggregates all entity records sharing the same attribute
- Supports `max_groups` to limit the maximum number of output groups, and `max_per_group` to limit the maximum number of tuples per group
- When the DataFrame has multiple rows, tuples from all rows are merged before processing; for a single-row DataFrame, the row is used directly
- The input column accepts both `tuple` and `triple` column names, with priority given to `input_key` specified in `run`
- The output does not preserve the original DataFrame row structure — each group becomes a new row in the output

---

## ✒️ `__init__` Parameters
```python
def __init__(
    self,
    llm_serving: LLMServingABC = None,
    seed: int = 0,
    lang: str = "en",
    group_by: str = "entity",
    max_groups: int = None,
    max_per_group: int = None,
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | `None` | Not used by this operator. Reserved for interface compatibility only. |
| `seed` | `int` | `0` | Random seed for controlling shuffle order when truncating groups and per-group tuples. |
| `lang` | `str` | `"en"` | Language setting. Does not affect processing logic in the current version. |
| `group_by` | `str` | `"entity"` | Grouping criterion. `"entity"` aggregates all attributes of the same entity; `"attribute"` aggregates all entity records sharing the same attribute. |
| `max_groups` | `int` | `None` | Maximum number of output groups. If `None`, all groups are output. When set, groups are shuffled and the first N are kept. |
| `max_per_group` | `int` | `None` | Maximum number of tuples to retain per group. If `None`, all tuples in the group are kept. When set, tuples are shuffled and the first N are kept. |

---

## 💡 `run` Parameters
```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "tuple",
    output_key: str = "subgraph",
):
    ...
```

`run` reads the DataFrame from `storage` and determines the input column by the following priority: `input_key` → `tuple` → `triple`. It then decides processing mode based on row count: single-row DataFrames are used directly; multi-row DataFrames have all tuple lists merged before processing. `_group_and_sample()` is called on the merged tuple list to perform grouping and sampling, and each group is written as a new row in the output DataFrame with the column name specified by `output_key`.

> Note: The number of rows in the output DataFrame equals the number of groups, which is independent of the number of input rows.

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow storage object. The operator reads the `dataframe` from it and writes the sampling result to a new DataFrame. |
| `input_key` | `str` | `"tuple"` | Input attribute tuple column name. Each cell should be a `List[str]` of attribute tuples. |
| `output_key` | `str` | `"subgraph"` | Output subgraph column name. Each row in the new DataFrame corresponds to one group and stores the list of tuples in that group. |

---

## 🤖 Example Usage
```python
from dataflow.operators.general_kg.sample.kg_attri_tuple_sampling import (
    KGAttributeTupleSampler,
)

operator = KGAttributeTupleSampler(
    seed=42,
    group_by="entity",
    max_groups=100,
    max_per_group=10,
)
operator.run(
    storage=storage,
    input_key="tuple",
    output_key="subgraph",
)
```

---

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `subgraph` | `List[str]` | List of all raw attribute tuple strings in the group. Each row corresponds to one entity (or attribute) group. |

---

#### Example Input
```json
[
  {
    "tuple": [
      "<entity> Henry <attribute> occupation <value> singer <time> 2018",
      "<entity> Henry <attribute> nationality <value> British",
      "<entity> Lucy <attribute> occupation <value> writer",
      "<entity> Lucy <attribute> award <value> Booker Prize <time> 2020"
    ]
  }
]
```

#### Example Output (`group_by="entity"`)
```json
[
  {
    "subgraph": [
      "<entity> Henry <attribute> occupation <value> singer <time> 2018",
      "<entity> Henry <attribute> nationality <value> British"
    ]
  },
  {
    "subgraph": [
      "<entity> Lucy <attribute> occupation <value> writer",
      "<entity> Lucy <attribute> award <value> Booker Prize <time> 2020"
    ]
  }
]
```

---

#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/general_kg/sample/kg_attri_tuple_sampling.py`