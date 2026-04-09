---
title: TKGTemporalStatistics
createTime: 2026/03/18 00:00:00
permalink: /en/kg_operators/temporal_kg/eval/tkg_4tuple_time_summary_en/
---

## 📚 Overview

[TKGTemporalStatistics](https://github.com/ZhP-Li197/DataFlow-KG/tree/main/dataflow/operators/temporal_kg/eval/tkg_4tuple_time_summary.py) is a temporal KG quadruple statistics evaluator. It analyzes time information in the input quadruple list and computes the ratio of valid times (non-NA) and the distribution of time values by year. The operator supports both relation and attribute quadruple formats, and can parse multiple time expressions including exact dates, months, years, quarters, seasons, and time intervals, helping users understand time coverage and distribution characteristics in temporal knowledge graphs.

## ✒️ `__init__` Function

```python
def __init__(self):
```

#### Parameters

This operator has no initialization parameters.

## 💡 `run` Function

`run` reads a DataFrame from `storage`, validates that it contains the column specified by `input_key`. It iterates over each row, and for every quadruple it extracts the `<time>` field, counts total quadruples and valid (non-NA) time quadruples, and collects yearly statistics by parsing year information from the time field. It then computes the non-NA time ratio and the normalized year distribution, writing the result as a dictionary into the `output_key` column. If a row is not a list or contains no statistics, an empty dictionary is written. The function returns a list containing the `output_key` string.

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
| temporal_statistics | Dict | Temporal statistics result. Contains: total_tuples (int, total count), valid_time_tuples (int, count with valid non-NA time), non_na_ratio (float, ratio), year_distribution (Dict[int, float], normalized yearly distribution). |

**Example Input:**

```json
{
  "tuple": [
    "<subj> Elon Musk <obj> Stanford University <rel> graduated from <time> 2004",
    "<subj> Elon Musk <obj> multiple technology companies <rel> co-founded <time> NA",
    "<subj> Elon Musk <obj> Tesla Motors <rel> took over as CEO <time> 2008",
    "<subj> Elon Musk <obj> SpaceX <rel> founded <time> 2002",
    "<subj> SpaceX <obj> ISS <rel> first commercial spacecraft docking with <time> 2012"
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

---

#### Related Links

- Operator implementation: `DataFlow-KG/dataflow/operators/temporal_kg/eval/tkg_4tuple_time_summary.py`
