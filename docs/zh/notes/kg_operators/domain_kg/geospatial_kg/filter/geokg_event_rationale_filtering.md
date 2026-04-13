---
title: GeoKGEventRationaleFilter
createTime: 2026/04/13 09:00:00
permalink: /zh/kg_operators/domain_kg/geospatial_kg/filter/geokg_event_rationale_filtering/
---

## 📚 概述

`GeoKGEventRationaleFilter` 根据合理性分数过滤事件条目。输入中需要同时提供事件条目列和分数列，默认分别是 `tuple` 和 `rationale_scores`。

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
    score_key: str = "rationale_scores",
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
| `score_key` | `str` | `"rationale_scores"` | 合理性分数列名 |
| `output_key` | `str` | `"filtered_tuple"` | 输出列名 |
| `min_score` | `float` | `0.95` | 最低保留分数 |
| `max_score` | `float` | `1.0` | 最高保留分数 |

算子按 `zip(triple_list, score_list)` 对齐过滤，所以分数列表必须和事件条目一一对应。

## 🤖 示例用法

```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.geospatial_kg.filter.geokg_event_rationale_filtering import (
    GeoKGEventRationaleFilter,
)

storage = DummyStorage()
storage.set_data([
    {
        "tuple": [
            "<event> wildfire spread near Sydney <location> Sydney <time> 2025-01",
            "<event> snowfall in tropical Darwin <location> Darwin <time> 2025-01"
        ],
        "rationale_scores": [0.97, 0.12]
    }
])

op = GeoKGEventRationaleFilter()
op.run(storage=storage, min_score=0.9)
```

#### 输入示例

```json
{
  "tuple": [
    "<event> wildfire spread near Sydney <location> Sydney <time> 2025-01",
    "<event> snowfall in tropical Darwin <location> Darwin <time> 2025-01"
  ],
  "rationale_scores": [0.97, 0.12]
}
```

#### 输出示例

```json
{
  "filtered_tuple": [
    "<event> wildfire spread near Sydney <location> Sydney <time> 2025-01"
  ]
}
```


