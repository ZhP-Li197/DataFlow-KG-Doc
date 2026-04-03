---
title: TKGTupleTimeFilter
createTime: 2026/03/18 00:00:00
icon: material-symbols-light:filter-alt-outline
permalink: /en/kg_operators/temporal_kg/filter/tkgtupletimefilter/
---

## 📚 Overview

[TKGTupleTimeFilter](https://github.com/ZhP-Li197/DataFlow-KG/tree/main/dataflow/operators/temporal_kg/filter/tkg_4tuple_time_sampling.py) is a temporal KG quadruple filter operator based on time constraints. It filters quadruples whose time values fall within the user-specified range. The operator supports both relation and attribute quadruple formats, and can parse multiple time expressions including exact dates, months, years, quarters, seasons, and time intervals. The filtered results can be written to a new column, or overwrite the input column via parameters for flexible integration into different pipelines.

## ✒️ `__init__`

```python
def __init__(self, merge_to_input: bool = False):
```

### Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| **merge_to_input** | bool | False | If True, filter results overwrite the input column; if False, write to a new output column. |

### Prompt Template

| Prompt Template Name | Primary Use | Applicable Scenario | Feature Description |
| --- | --- | --- | --- |

## 💡 `run`

```python
def run(self, storage: DataFlowStorage, input_key: str = "tuple", output_key: str = "filtered_tuple", query_time_start: str = "Q1 2021", query_time_end: str = "2023"):
```

#### Parameters

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| **storage** | DataFlowStorage | Required | DataFlow storage instance, responsible for reading and writing data. |
| **input_key** | str | "tuple" | Input column name, corresponding to the quadruple list field. |
| **output_key** | str | "filtered_tuple" | Output column name, corresponding to the filtered quadruple list field (used when `merge_to_input=False`). |
| **query_time_start** | str | "Q1 2021" | Start of the query time range, supports multiple formats. |
| **query_time_end** | str | "2023" | End of the query time range, supports multiple formats. |

## 🤖 Example Usage

```python
from dataflow.operators.temporal_kg.filter import TKGTupleTimeFilter
from dataflow.utils.storage import FileStorage

storage = FileStorage(first_entry_file_name="tkg_rel.json")

filter_op = TKGTupleTimeFilter(merge_to_input=False)
filter_op.run(
    storage.step(),
    input_key="tuple",
    output_key="filtered_tuple",
    query_time_start="2005",
    query_time_end="2016",
)
```

#### Default Output Format

| Field | Type | Description |
| --- | --- | --- |
| tuple | List[str] | Input original quadruple list (preserved). |
| filtered_tuple | List[str] | Filtered quadruple list that satisfies the time constraint. |

**Example Input:**

```json
{
  "tuple": [
    "⟨subj⟩ Elon Musk ⟨obj⟩ Stanford University ⟨rel⟩ graduated from ⟨time⟩ 2004",
    "⟨subj⟩ Elon Musk ⟨obj⟩ Tesla Motors ⟨rel⟩ took over as CEO ⟨time⟩ 2008",
    "⟨subj⟩ Tesla ⟨obj⟩ Powerwall home battery system ⟨rel⟩ introduced ⟨time⟩ 2015",
    "⟨subj⟩ Elon Musk ⟨obj⟩ SpaceX ⟨rel⟩ founded ⟨time⟩ 2002"
  ]
}
```

**Example Output (query_time_start="2005", query_time_end="2016"):**

```json
{
  "tuple": ["...(same as above)"],
  "filtered_tuple": [
    "⟨subj⟩ Elon Musk ⟨obj⟩ Tesla Motors ⟨rel⟩ took over as CEO ⟨time⟩ 2008",
    "⟨subj⟩ Tesla ⟨obj⟩ Powerwall home battery system ⟨rel⟩ introduced ⟨time⟩ 2015"
  ]
}
```