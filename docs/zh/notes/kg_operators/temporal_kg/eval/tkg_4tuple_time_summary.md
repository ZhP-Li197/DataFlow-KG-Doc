---
title: TKGTemporalStatistics
createTime: 2026/04/07 09:00:00
permalink: /zh/kg_operators/temporal_kg/eval/tkg_4tuple_time_summary/
---

#### 📚 概述

`TKGTemporalStatistics` 用于统计四元组中的时间信息分布。它会计算总四元组数、可解析时间的四元组数、非 `NA` 比例，以及按年份归一化后的分布。

#### 📚 `__init__` 函数

```python
def __init__(self):
    ...
```

该算子没有额外初始化参数。

#### 💡 `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "tuple",
    output_key: str = "temporal_statistics",
):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | 输入输出存储对象 |
| `input_key` | `str` | `"tuple"` | 时序四元组列 |
| `output_key` | `str` | `"temporal_statistics"` | 统计结果列 |

输出结果是一个字典，通常包含 `total_tuples`、`valid_time_tuples`、`non_na_ratio` 和 `year_distribution`。

#### 🤖 示例用法

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

输入示例：

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

输出示例：

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
