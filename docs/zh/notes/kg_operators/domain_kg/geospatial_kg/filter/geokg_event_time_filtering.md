---
title: GeoKGEventTupleTimeFilter
createTime: 2026/04/13 09:00:00
permalink: /zh/kg_operators/domain_kg/geospatial_kg/filter/geokg_event_time_filtering/
---

## 📚 概述

`GeoKGEventTupleTimeFilter` 根据事件条目中的 `<time>` 字段过滤结果。它支持多种时间格式，包括：

- `YYYY-MM-DD`
- `Month YYYY`
- `YYYY`
- `QX YYYY`
- `YYYY-MM-DD|YYYY-MM-DD`

如果 `merge_to_input=True`，结果会覆盖原输入列；否则写入新的 `filtered_tuple` 列。

## ✒️ `__init__` 函数

```python
def __init__(self, merge_to_input: bool = False):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `merge_to_input` | `bool` | `False` | 是否直接覆盖原输入列 |

## 💡 `run` 函数

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
| `input_key` | `str` | `"tuple"` | 事件条目列名 |
| `output_key` | `str` | `"filtered_tuple"` | 输出列名 |
| `query_time_start` | `str` | `"Q1 2021"` | 查询时间范围起点 |
| `query_time_end` | `str` | `"2023"` | 查询时间范围终点 |

算子会把事件时间解析成区间，再和查询区间做重叠判断。没有 `<time>` 或无法解析的条目不会被保留。

## 🤖 示例用法

```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.geospatial_kg.filter.geokg_event_time_filtering import (
    GeoKGEventTupleTimeFilter,
)

storage = DummyStorage()
storage.set_data([
    {
        "tuple": [
            "<event> earthquake struck Tokyo <location> Tokyo <time> 2025-03-03",
            "<event> flood warning in Osaka <location> Osaka <time> 2023-06-01"
        ]
    }
])

op = GeoKGEventTupleTimeFilter()
op.run(storage=storage, query_time_start="2025-01-01", query_time_end="2025-12-31")
```

#### 输入示例

```json
{
  "tuple": [
    "<event> earthquake struck Tokyo <location> Tokyo <time> 2025-03-03",
    "<event> flood warning in Osaka <location> Osaka <time> 2023-06-01"
  ]
}
```

#### 输出示例

```json
{
  "filtered_tuple": [
    "<event> earthquake struck Tokyo <location> Tokyo <time> 2025-03-03"
  ]
}
```


