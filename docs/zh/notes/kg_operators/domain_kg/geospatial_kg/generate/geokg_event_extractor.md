---
title: GeoKGEventExtraction
createTime: 2026/04/13 09:00:00
permalink: /zh/kg_operators/domain_kg/geospatial_kg/generate/geokg_event_extractor/
---

## 📚 概述

`GeoKGEventExtraction` 用于从地理文本中抽取事件多元组。虽然输出列默认名是 `tuple`，但其中存放的其实是事件条目，标准格式为：

`<event> 事件描述 <location> 地点 <time> 时间 <...> 可选字段`

每条结果至少包含 `<event>`、`<location>` 和 `<time>`。如果文本中没有明确时间，Prompt 约定 `<time>` 填 `NA`。

## ✒️ `__init__` 函数

```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    prompt_template: Union[GeoKGEventExtractorPrompt, DIYPromptABC] = None,
):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象 |
| `seed` | `int` | `0` | 随机种子 |
| `lang` | `str` | `"en"` | Prompt 语言 |
| `prompt_template` | `Union[GeoKGEventExtractorPrompt, DIYPromptABC]` | `None` | 自定义 Prompt；为空时使用默认地理事件抽取 Prompt |

## 💡 `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "raw_chunk",
    output_key: str = "tuple",
):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | 输入输出存储对象 |
| `input_key` | `str` | `"raw_chunk"` | 输入文本列名 |
| `output_key` | `str` | `"tuple"` | 事件多元组输出列名 |

算子会校验 `input_key` 必须存在，且 `output_key` 不能与已有列冲突。模型原始返回 JSON 中的键为 `"tuple"`，解析后按行写回 dataframe。

## 🤖 示例用法

```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.geospatial_kg.generate.geokg_event_extractor import (
    GeoKGEventExtraction,
)

storage = DummyStorage()
storage.set_data([
    {
        "raw_chunk": "On 2025-03-03, an earthquake struck Tokyo and disrupted rail service."
    }
])

op = GeoKGEventExtraction(llm_serving=llm_serving, lang="en")
op.run(storage=storage)
```

#### 输入示例

```json
{
  "raw_chunk": "On 2025-03-03, an earthquake struck Tokyo and disrupted rail service."
}
```

#### 输出示例

```json
{
  "tuple": [
    "<event> earthquake struck Tokyo <location> Tokyo <time> 2025-03-03 <effect> rail service disrupted"
  ]
}
```


