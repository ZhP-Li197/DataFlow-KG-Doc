---
title: TKGTemporalStatistics
createTime: 2026/04/07 09:00:00
permalink: /en/kg_operators/temporal_kg/eval/tkg_4tuple_time_summary/
---

#### 📚 Overview

`TKGTemporalStatistics` computes time-distribution statistics from temporal quadruples. It reports the total tuple count, the number of tuples with valid time values, the non-`NA` ratio, and a normalized year distribution.

#### 📚 `__init__` Function

```python
def __init__(self):
    ...
```

This operator has no extra initialization arguments.

#### 💡 `run` Function

```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "tuple",
    output_key: str = "temporal_statistics",
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Input/output storage object |
| `input_key` | `str` | `"tuple"` | Column containing temporal tuples |
| `output_key` | `str` | `"temporal_statistics"` | Output column for computed statistics |

The output is a dictionary that typically contains `total_tuples`, `valid_time_tuples`, `non_na_ratio`, and `year_distribution`.

#### 🤖 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.temporal_kg.eval.tkg_4tuple_time_summary import TKGTemporalStatistics

storage = FileStorage(
    first_entry_file_name="dataflow/data_for_operator_testing/tkg_rel.json",
    cache_path="./cache",
    file_name_prefix="tkg_stats",
    cache_type="json",
).step()

op = TKGTemporalStatistics()
op.run(storage=storage, input_key="tuple", output_key="temporal_statistics")
```

Example input:

```json
{
  "tuple": [
    "<subj> Elon Musk <obj> Stanford University <rel> graduated from <time> 2004",
    "<subj> Elon Musk <obj> Tesla Motors <rel> took over as CEO <time> 2008",
    "<subj> Tesla <obj> mass-market electric vehicles <rel> began steering toward <time> NA",
    "<subj> Tesla <obj> Powerwall home battery system <rel> introduced <time> 2015"
  ]
}
```

Example output:

```json
{
  "temporal_statistics": {
    "total_tuples": 4,
    "valid_time_tuples": 3,
    "non_na_ratio": 0.75,
    "year_distribution": {
      "2004": 0.3333333333333333,
      "2008": 0.3333333333333333,
      "2015": 0.3333333333333333
    }
  }
}
```
