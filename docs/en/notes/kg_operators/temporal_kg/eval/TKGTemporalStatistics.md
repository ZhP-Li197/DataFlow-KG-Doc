---
title: TKGTemporalStatistics
createTime: 2026/03/18 00:00:00
icon: material-symbols-light:analytics-outline
permalink: /en/kg_operators/temporal_kg/eval/tkgtemporalstatistics/
---

## 📚 Overview

[TKGTemporalStatistics](https://github.com/ZhP-Li197/DataFlow-KG/tree/main/dataflow/operators/temporal_kg/eval/tkg_4tuple_time_summary.py) is a temporal KG quadruple statistics evaluator. It analyzes time information in the input quadruple list and computes the ratio of valid times (non-NA) and the distribution of time values by year. The operator supports both relation and attribute quadruple formats, and can parse multiple time expressions including exact dates, months, years, quarters, seasons, and time intervals, helping users understand time coverage and distribution characteristics in temporal knowledge graphs.

## ✒️ `__init__`

```python
def __init__(self):
```

### Parameters

This operator has no initialization parameters.

### Prompt Template

| Prompt Template Name | Primary Use | Applicable Scenario | Feature Description |
| --- | --- | --- | --- |

## 💡 `run`

```python
def run(self, storage: DataFlowStorage, input_key: str = "tuple", output_key: str = "temporal_statistics"):
```

#### Parameters

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| **storage** | DataFlowStorage | Required | DataFlow storage instance, responsible for reading and writing data. |
| **input_key** | str | "tuple" | Input column name, corresponding to the quadruple list field. Each row should be `List[str]`. |
| **output_key** | str | "temporal_statistics" | Output column name, corresponding to the generated temporal statistics result field. |

## 🤖 Example Usage

```python
from dataflow.operators.temporal_kg.eval import TKGTemporalStatistics
from dataflow.utils.storage import FileStorage

storage = FileStorage(first_entry_file_name="tkg_rel.json")

operator = TKGTemporalStatistics()
operator.run(
    storage.step(),
    input_key="tuple",
    output_key="temporal_statistics",
)
```

#### Default Output Format

| Field | Type | Description |
| --- | --- | --- |
| tuple | List[str] | Input quadruple list (original field preserved). |
| temporal_statistics | Dict | Temporal statistics result, containing the following sub-fields. |
| temporal_statistics.total_tuples | int | Total number of quadruples. |
| temporal_statistics.valid_time_tuples | int | Number of quadruples with valid time (non-NA). |
| temporal_statistics.non_na_ratio | float | Ratio of valid time (valid_time_tuples / total_tuples). |
| temporal_statistics.year_distribution | Dict[int, float] | Year-based time distribution ratio. |

**Example Input:**

```json
{
  "tuple": [
    "⟨subj⟩ Elon Musk ⟨obj⟩ Stanford University ⟨rel⟩ graduated from ⟨time⟩ 2004",
    "⟨subj⟩ Elon Musk ⟨obj⟩ multiple technology companies ⟨rel⟩ co-founded ⟨time⟩ NA",
    "⟨subj⟩ Elon Musk ⟨obj⟩ Tesla Motors ⟨rel⟩ took over as CEO ⟨time⟩ 2008",
    "⟨subj⟩ Elon Musk ⟨obj⟩ SpaceX ⟨rel⟩ founded ⟨time⟩ 2002",
    "⟨subj⟩ SpaceX ⟨obj⟩ ISS ⟨rel⟩ first commercial spacecraft docking with ⟨time⟩ 2012"
  ]
}
```

**Example Output:**

```json
{
  "tuple": ["...(same as above)"],
  "temporal_statistics": {
    "total_tuples": 5,
    "valid_time_tuples": 4,
    "non_na_ratio": 0.8,
    "year_distribution": {
      "2002": 0.25,
      "2004": 0.25,
      "2008": 0.25,
      "2012": 0.25
    }
  }
}
```