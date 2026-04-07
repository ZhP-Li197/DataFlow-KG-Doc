---
title: TKGTupleTimeFilter
createTime: 2026/04/07 09:00:00
permalink: /zh/kg_operators/temporal_kg/filter/tkg_4tuple_time_sampling/
---

#### 📚 概述

`TKGTupleTimeFilter` 根据给定时间范围筛选四元组，保留时间与查询区间重叠的记录。它支持精确日期、月份、年份、季度、季节以及 `start|end` 区间表达。

#### 📚 `__init__` 函数

```python
def __init__(self, merge_to_input: bool = False):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `merge_to_input` | `bool` | `False` | 为 `True` 时直接覆盖原输入列；否则写入新列 |

#### 💡 `run` 函数

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

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | 输入输出存储对象 |
| `input_key` | `str` | `"tuple"` | 待筛选四元组列 |
| `output_key` | `str` | `"filtered_tuple"` | 输出列名 |
| `query_time_start` | `str` | `"Q1 2021"` | 查询起始时间 |
| `query_time_end` | `str` | `"2023"` | 查询结束时间 |

如果一行不是列表、某个四元组没有合法 `<time>` 字段，或其时间和查询区间不重叠，该条记录就不会出现在输出中。

#### 🤖 示例用法

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

输入示例：

```json
{
  "tuple": [
    "<subj> Elon Musk <obj> SpaceX <rel> founded <time> 2002",
    "<subj> Tesla <obj> Powerwall home battery system <rel> introduced <time> 2015",
    "<subj> Elon Musk <obj> Time Magazine's 'Person of the Year' <rel> recognized as <time> 2021"
  ]
}
```

输出示例：

```json
{
  "filtered_tuple": [
    "<subj> Tesla <obj> Powerwall home battery system <rel> introduced <time> 2015",
    "<subj> Elon Musk <obj> Time Magazine's 'Person of the Year' <rel> recognized as <time> 2021"
  ]
}
```
