---
title: TKGTupleTimeFilter
createTime: 2026/04/07 09:00:00
permalink: /en/kg_operators/temporal_kg/filter/tkg_4tuple_time_sampling/
---

#### 📚 Overview

`TKGTupleTimeFilter` filters quadruples by a time range and keeps only the tuples whose time overlaps with the query interval. It supports exact dates, months, years, quarters, seasons, and `start|end` interval expressions.

#### 📚 `__init__` Function

```python
def __init__(self, merge_to_input: bool = False):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `merge_to_input` | `bool` | `False` | If `True`, overwrite the original input column; otherwise write to a new column |

#### 💡 `run` Function

```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "tuple",
    output_key: str = "filtered_tuple",
    query_time_start: str = "Q1 2021",
    query_time_end: str = "2023",
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Input/output storage object |
| `input_key` | `str` | `"tuple"` | Column containing tuples to filter |
| `output_key` | `str` | `"filtered_tuple"` | Output column |
| `query_time_start` | `str` | `"Q1 2021"` | Query start time |
| `query_time_end` | `str` | `"2023"` | Query end time |

If a row is not a list, a tuple does not contain a valid `<time>` field, or the tuple time does not overlap with the query interval, that tuple is excluded from the result.

#### 🤖 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.temporal_kg.filter.tkg_4tuple_time_sampling import TKGTupleTimeFilter

storage = FileStorage(
    first_entry_file_name="dataflow/data_for_operator_testing/tkg_rel.json",
    cache_path="./cache",
    file_name_prefix="tkg_time_filter",
    cache_type="json",
).step()

op = TKGTupleTimeFilter()
op.run(
    storage=storage,
    input_key="tuple",
    output_key="filtered_tuple",
    query_time_start="2010",
    query_time_end="2021"
)
```

Example input:

```json
{
  "tuple": [
    "<subj> Elon Musk <obj> SpaceX <rel> founded <time> 2002",
    "<subj> Tesla <obj> Powerwall home battery system <rel> introduced <time> 2015",
    "<subj> Elon Musk <obj> Time Magazine's 'Person of the Year' <rel> recognized as <time> 2021"
  ]
}
```

Example output:

```json
{
  "filtered_tuple": [
    "<subj> Tesla <obj> Powerwall home battery system <rel> introduced <time> 2015",
    "<subj> Elon Musk <obj> Time Magazine's 'Person of the Year' <rel> recognized as <time> 2021"
  ]
}
```
