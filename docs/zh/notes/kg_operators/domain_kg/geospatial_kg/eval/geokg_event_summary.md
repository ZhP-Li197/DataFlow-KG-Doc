---
title: GeoKGTupleAttributeFrequencyEvaluator
createTime: 2026/04/13 09:00:00
permalink: /zh/kg_operators/domain_kg/geospatial_kg/eval/geokg_event_summary/
---

## 📚 概述

`GeoKGTupleAttributeFrequencyEvaluator` 用于统计地理事件条目中的属性标签频次和频率，例如 `<Time>`、`<Location>`、`<effect>` 等。它不会按原 dataframe 行数输出，而是把整个输入聚合成一行统计结果。

输出默认有两列：

- `attribute_counts`
- `attribute_frequencies`

## ✒️ `__init__` 函数

```python
def __init__(self):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| 无 | - | - | 构造时仅初始化属性标签匹配正则 |

## 💡 `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "tuple",
    output_key: str = "attribute_counts",
    output_key_meta: str = "attribute_frequencies",
) -> List[str]:
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | 输入输出存储对象 |
| `input_key` | `str` | `"tuple"` | 事件条目列名 |
| `output_key` | `str` | `"attribute_counts"` | 属性计数字典输出列名 |
| `output_key_meta` | `str` | `"attribute_frequencies"` | 属性频率字典输出列名 |

频率的计算方式是 `属性出现次数 / 总条目数`。算子最终写回的是一个只含一行的新 dataframe。

## 🤖 示例用法

```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.geospatial_kg.eval.geokg_event_summary import (
    GeoKGTupleAttributeFrequencyEvaluator,
)

storage = DummyStorage()
storage.set_data([
    {
        "tuple": [
            "<event> earthquake struck Tokyo <location> Tokyo <time> 2025-03-03 <effect> rail disrupted",
            "<event> flood warning in Osaka <location> Osaka <time> 2025-03-04"
        ]
    }
])

op = GeoKGTupleAttributeFrequencyEvaluator()
op.run(storage=storage)
```

#### 输入示例

```json
{
  "tuple": [
    "<event> earthquake struck Tokyo <location> Tokyo <time> 2025-03-03 <effect> rail disrupted",
    "<event> flood warning in Osaka <location> Osaka <time> 2025-03-04"
  ]
}
```

#### 输出示例

```json
{
  "attribute_counts": {
    "event": 2,
    "location": 2,
    "time": 2,
    "effect": 1
  },
  "attribute_frequencies": {
    "event": 1.0,
    "location": 1.0,
    "time": 1.0,
    "effect": 0.5
  }
}
```


