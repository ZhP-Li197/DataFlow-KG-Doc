---
title: GeoKGEventRationaleEvaluator
createTime: 2026/04/13 09:00:00
permalink: /zh/kg_operators/domain_kg/geospatial_kg/eval/geokg_event_rationale_eval/
---

## 📚 概述

`GeoKGEventRationaleEvaluator` 用于评估地理事件条目的合理性。输入列默认是 `tuple`，输出列默认是 `rationale_scores`，输出分数和输入条目逐项对齐。

如果输入为空，或模型返回值解析失败，该行输出空列表。

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
    output_key: str = "rationale_scores"
):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | 输入输出存储对象 |
| `input_key` | `str` | `"tuple"` | 待评测事件条目列名 |
| `output_key` | `str` | `"rationale_scores"` | 合理性分数输出列名 |

模型返回的 JSON 键必须是 `"rationale_scores"`。常见输出是与每条事件条目对齐的 `float` 列表。

## 🤖 示例用法

```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.geospatial_kg.eval.geokg_event_rationale_eval import (
    GeoKGEventRationaleEvaluator,
)

storage = DummyStorage()
storage.set_data([
    {
        "tuple": [
            "<event> wildfire spread near Sydney <location> Sydney <time> 2025-01",
            "<event> flood warning issued in Brisbane <location> Brisbane <time> 2025-01-09"
        ]
    }
])

op = GeoKGEventRationaleEvaluator(llm_serving=llm_serving, lang="en")
op.run(storage=storage)
```

#### 输入示例

```json
{
  "tuple": [
    "<event> wildfire spread near Sydney <location> Sydney <time> 2025-01",
    "<event> flood warning issued in Brisbane <location> Brisbane <time> 2025-01-09"
  ]
}
```

#### 输出示例

```json
{
  "rationale_scores": [0.97, 0.96]
}
```


