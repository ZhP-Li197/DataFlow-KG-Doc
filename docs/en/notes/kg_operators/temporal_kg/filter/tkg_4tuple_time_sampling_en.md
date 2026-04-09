---
title: TKGTupleTimeFilter
createTime: 2026/03/18 00:00:00
permalink: /en/kg_operators/temporal_kg/filter/tkg_4tuple_time_sampling/
---

## 📚 Overview

[TKGTupleTimeFilter](https://github.com/ZhP-Li197/DataFlow-KG/tree/main/dataflow/operators/temporal_kg/filter/tkg_4tuple_time_sampling.py) is a temporal KG quadruple filter operator based on time constraints. It filters quadruples whose time values fall within the user-specified range. The operator supports both relation and attribute quadruple formats, and can parse multiple time expressions including exact dates, months, years, quarters, seasons, and time intervals. The filtered results can be written to a new column, or overwrite the input column via parameters for flexible integration into different pipelines.

## ✒️ `__init__` Function

```python
def __init__(self, merge_to_input: bool = False):
```

#### Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `merge_to_input` | `bool` | `False` | If `True`, filter results overwrite the input column; if `False`, write to a new output column. |

#### Prompt Template

This operator is rule-based and does not use LLM prompt templates.

## 💡 `run` Function

`run` reads a DataFrame from `storage`, validates that it contains the column specified by `input_key`. The operator parses `query_time_start` and `query_time_end` via internal date/quarter/season/month parsers, then iterates over each row: if a row is not a list, an empty list is written; otherwise `_filter()` is called to retain only those quadruples whose `<time>` value overlaps with the query interval. When `merge_to_input=True`, the filtered result overwrites the original `input_key` column; otherwise it is written to `output_key`. The function returns a list containing the names of affected columns.

```python
def run(self, storage: DataFlowStorage, input_key: str = "tuple", output_key: str = "filtered_tuple", query_time_start: str = "Q1 2021", query_time_end: str = "2023"):
```

#### Parameters

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `storage` | `DataFlowStorage` | Required | DataFlow storage instance, responsible for reading and writing data. |
| `input_key` | `str` | `"tuple"` | Input column name, corresponding to the quadruple list field. |
| `output_key` | `str` | `"filtered_tuple"` | Output column name, corresponding to the filtered quadruple list field (used when `merge_to_input=False`). |
| `query_time_start` | `str` | `"Q1 2021"` | Start of the query time range, supports multiple formats. |
| `query_time_end` | `str` | `"2023"` | End of the query time range, supports multiple formats. |

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
| `tuple` | `List[str]` | Input original quadruple list (preserved). |
| `filtered_tuple` | `List[str]` | Filtered quadruple list that satisfies the time constraint. |

**Example Input:**

```json
{
  "tuple": [
    "<subj> Elon Musk <obj> Stanford University <rel> graduated from <time> 2004",
    "<subj> Elon Musk <obj> Tesla Motors <rel> took over as CEO <time> 2008",
    "<subj> Tesla <obj> Powerwall home battery system <rel> introduced <time> 2015",
    "<subj> Elon Musk <obj> SpaceX <rel> founded <time> 2002"
  ]
}
```

**Example Output (query_time_start="2005", query_time_end="2016"):**

```json
{
  "tuple": ["...(same as above)"],
  "filtered_tuple": [
    "<subj> Elon Musk <obj> Tesla Motors <rel> took over as CEO <time> 2008",
    "<subj> Tesla <obj> Powerwall home battery system <rel> introduced <time> 2015"
  ]
}
```

---

#### Related Links

- Operator implementation: `DataFlow-KG/dataflow/operators/temporal_kg/filter/tkg_4tuple_time_sampling.py`
