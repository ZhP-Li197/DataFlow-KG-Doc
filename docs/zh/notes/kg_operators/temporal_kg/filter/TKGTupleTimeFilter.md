---
title: TKGTupleTimeFilter
createTime: 2026/03/18 00:00:00
icon: material-symbols-light:filter-alt-outline
permalink: /zh/kg_operators/temporal_kg/filter/tkgtupletimefilter/
---

## 📚 概述

[TKGTupleTimeFilter](https://github.com/ZhP-Li197/DataFlow-KG/tree/main/dataflow/operators/temporal_kg/filter/tkg_4tuple_time_sampling.py) 是一个基于时间约束对时序知识图谱四元组进行过滤的算子。它根据用户指定的查询时间范围，筛选出时间落在该区间内的四元组。该算子同时支持关系四元组和属性四元组两种格式，能够解析精确日期、月份、年份、季度、季节以及时间区间等多种时间表达。过滤结果可以写入新列，也可以通过参数设置直接覆盖原输入列，便于灵活地集成到不同的数据处理流程中。

## ✒️ `__init__`函数

```python
def __init__(self, merge_to_input: bool = False):
```

### `init`参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| **merge_to_input** | bool | False | 若为 True，过滤结果覆盖输入列；若为 False，写入新的输出列。 |

### Prompt模板说明

| Prompt 模板名称 | 主要用途 | 适用场景 | 特点说明 |
| --- | --- | --- | --- |

## 💡 `run`函数

```python
def run(self, storage: DataFlowStorage, input_key: str = "tuple", output_key: str = "filtered_tuple", query_time_start: str = "Q1 2021", query_time_end: str = "2023"):
```

#### `参数`

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| **storage** | DataFlowStorage | 必需 | 数据流存储实例，负责读取与写入数据。 |
| **input_key** | str | "tuple" | 输入列名，对应四元组列表字段。 |
| **output_key** | str | "filtered_tuple" | 输出列名，对应过滤后的四元组列表字段（`merge_to_input=False` 时使用）。 |
| **query_time_start** | str | "Q1 2021" | 查询时间范围的起始时间，支持多种格式。 |
| **query_time_end** | str | "2023" | 查询时间范围的结束时间，支持多种格式。 |

## 🤖 示例用法

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

#### 🧾 默认输出格式（Output Format）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| tuple | List[str] | 输入的原始四元组列表（保留）。 |
| filtered_tuple | List[str] | 过滤后满足时间约束的四元组列表。 |

**示例输入：**

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

**示例输出（query_time_start="2005", query_time_end="2016"）：**

```json
{
  "tuple": ["...（同上）"],
  "filtered_tuple": [
    "⟨subj⟩ Elon Musk ⟨obj⟩ Tesla Motors ⟨rel⟩ took over as CEO ⟨time⟩ 2008",
    "⟨subj⟩ Tesla ⟨obj⟩ Powerwall home battery system ⟨rel⟩ introduced ⟨time⟩ 2015"
  ]
}
```