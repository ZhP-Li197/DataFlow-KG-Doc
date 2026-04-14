---
title: GeoKGEventConsistenceEvaluator
createTime: 2026/04/13 09:00:00
permalink: /zh/kg_operators/domain_kg/geospatial_kg/eval/geokg_event_consistence_eval/
---

## 📚 概述

`GeoKGEventConsistenceEvaluator` 用于评估地理事件条目的内部一致性。输入列默认是 `tuple`，输出列默认是 `consistency_scores`，结果与输入条目逐项对齐。

如果某一行没有可评估的条目，或者模型返回无法解析的 JSON，该行会输出空列表。

## ✒️ `__init__` 函数

```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    lang: str = "en"
):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象 |
| `lang` | `str` | `"en"` | 评测 Prompt 语言 |

## 💡 `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "tuple",
    output_key: str = "consistency_scores"
):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | 输入输出存储对象 |
| `input_key` | `str` | `"tuple"` | 待评测事件条目列名 |
| `output_key` | `str` | `"consistency_scores"` | 一致性分数输出列名 |

模型返回的 JSON 键必须是 `"consistency_scores"`。典型情况下，每个分数是一个 `float`，并与对应事件条目逐项对齐。

## 🤖 示例用法

```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.geospatial_kg.eval.geokg_event_consistence_eval import (
    GeoKGEventConsistenceEvaluator,
)

storage = DummyStorage()
storage.set_data([
    {
        "tuple": [
            "<event> earthquake struck Tokyo <location> Tokyo <time> 2025-03-03",
            "<event> heavy rainfall in Osaka <location> Osaka <time> 2025-03-04"
        ]
    }
])

op = GeoKGEventConsistenceEvaluator(llm_serving=llm_serving, lang="en")
op.run(storage=storage)
```

#### 输入示例

```json
{
  "tuple": [
    "<event> earthquake struck Tokyo <location> Tokyo <time> 2025-03-03",
    "<event> heavy rainfall in Osaka <location> Osaka <time> 2025-03-04"
  ]
}
```

#### 输出示例

```json
{
  "consistency_scores": [0.98, 0.95]
}
```


