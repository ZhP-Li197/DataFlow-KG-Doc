---
title: GeoKGEventConsistenceFilter
createTime: 2026/04/13 09:00:00
permalink: /zh/kg_operators/domain_kg/geospatial_kg/filter/geokg_event_consistence_filtering/
---

## 📚 概述

`GeoKGEventConsistenceFilter` 根据一致性分数过滤事件条目。它要求输入中同时存在事件条目列和分数列，默认分别是 `tuple` 和 `consistency_scores`。

如果 `merge_to_input=True`，过滤结果会直接覆盖原输入列；否则写入新的 `filtered_tuple` 列。

## ✒️ `__init__` 函数

```python
def __init__(self, merge_to_input: bool = False):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `merge_to_input` | `bool` | `False` | 是否将过滤结果直接写回原输入列 |

## 💡 `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "tuple",
    score_key: str = "consistency_scores",
    output_key: str = "filtered_tuple",
    min_score: float = 0.95,
    max_score: float = 1.0,
):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | 输入输出存储对象 |
| `input_key` | `str` | `"tuple"` | 待过滤条目列名 |
| `score_key` | `str` | `"consistency_scores"` | 一致性分数列名 |
| `output_key` | `str` | `"filtered_tuple"` | 输出列名 |
| `min_score` | `float` | `0.95` | 最低保留分数 |
| `max_score` | `float` | `1.0` | 最高保留分数 |

过滤时按 `zip(triple_list, score_list)` 对齐处理，因此条目列表和分数列表应保持同长度。

## 🤖 示例用法

```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.geospatial_kg.filter.geokg_event_consistence_filtering import (
    GeoKGEventConsistenceFilter,
)

storage = DummyStorage()
storage.set_data([
    {
        "tuple": [
            "<event> earthquake struck Tokyo <location> Tokyo <time> 2025-03-03",
            "<event> flood warning in Osaka <location> Osaka <time> 2025-03-04"
        ],
        "consistency_scores": [0.98, 0.72]
    }
])

op = GeoKGEventConsistenceFilter()
op.run(storage=storage, min_score=0.9)
```

#### 输入示例

```json
{
  "tuple": [
    "<event> earthquake struck Tokyo <location> Tokyo <time> 2025-03-03",
    "<event> flood warning in Osaka <location> Osaka <time> 2025-03-04"
  ],
  "consistency_scores": [0.98, 0.72]
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


