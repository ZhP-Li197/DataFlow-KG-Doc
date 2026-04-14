---
title: GeoKGEventTupleLocationFilter
createTime: 2026/04/13 09:00:00
permalink: /zh/kg_operators/domain_kg/geospatial_kg/filter/geokg_event_location_filtering/
---

## 📚 概述

`GeoKGEventTupleLocationFilter` 根据事件条目中的 `<location>` 字段过滤结果。它会从每条事件字符串里解析地点名称，并做大小写不敏感的包含匹配。

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
    location_name: str = "China"
):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | 输入输出存储对象 |
| `input_key` | `str` | `"tuple"` | 事件条目列名 |
| `output_key` | `str` | `"filtered_tuple"` | 输出列名 |
| `location_name` | `str` | `"China"` | 用于筛选的地点关键词 |

只有当 `<location>` 字段包含 `location_name` 时，该条目才会被保留。

## 🤖 示例用法

```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.geospatial_kg.filter.geokg_event_location_filtering import (
    GeoKGEventTupleLocationFilter,
)

storage = DummyStorage()
storage.set_data([
    {
        "tuple": [
            "<event> flood warning issued <location> China <time> 2025-06",
            "<event> earthquake reported <location> Japan <time> 2025-06"
        ]
    }
])

op = GeoKGEventTupleLocationFilter()
op.run(storage=storage, location_name="China")
```

#### 输入示例

```json
{
  "tuple": [
    "<event> flood warning issued <location> China <time> 2025-06",
    "<event> earthquake reported <location> Japan <time> 2025-06"
  ]
}
```

#### 输出示例

```json
{
  "filtered_tuple": [
    "<event> flood warning issued <location> China <time> 2025-06"
  ]
}
```


