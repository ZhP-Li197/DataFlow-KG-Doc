---
title: CSKGTripleExtraction
createTime: 2026/04/01 16:55:00
permalink: /zh/kg_operators/commonsense_kg/generate/cskg_triple_extractor/
---

## 📚 概述
`CSKGTripleExtraction` 是一个用于常识知识图谱三元组抽取的生成类算子。
它读取原始文本，对文本做基础质量检查和预处理后，调用大模型抽取常识三元组，并将结构化结果写回 DataFrame，供后续问答生成、图谱构建或推理任务继续使用。

这个算子的几个关键特点如下：

- 依赖 `LLMServingABC` 提供三元组抽取能力
- 根据 `triple_type` 在关系三元组 Prompt 和属性三元组 Prompt 之间切换
- 默认读取 `raw_chunk` 列，默认输出到 `triple`
- 抽取前会做文本预处理和质量筛选，不合格文本会直接返回空结果
- 当前实现内部固定使用默认 Prompt，不暴露 `prompt_template` 参数

---

## ✒️ __init__ 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    triple_type: str = "relation",
    lang: str = "en",
    num_q: int = 5
):
    ...
```

#### `__init__` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象。算子通过 `generate_from_input` 执行三元组抽取。 |
| `seed` | `int` | `0` | 用于初始化内部随机数生成器。当前主流程中未进一步使用随机行为。 |
| `triple_type` | `str` | `"relation"` | 三元组类型。`"relation"` 使用关系三元组 Prompt，`"attribute"` 使用属性三元组 Prompt。 |
| `lang` | `str` | `"en"` | Prompt 语言。算子会根据该值初始化对应的默认 Prompt。 |
| `num_q` | `int` | `5` | 预留参数。当前实现中仅保存为实例属性，未参与抽取逻辑。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "raw_chunk",
    output_key: str = "triple"
):
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，检查输入列是否存在以及输出列是否会产生覆盖冲突。随后算子会把输入文本列表交给内部批处理逻辑：每段文本先经过清洗与质量检查，合格文本会被送入对应 Prompt 和 LLM 做抽取，不合格文本则直接返回空三元组结果。模型响应会被解析为 JSON，并提取其中的 `triple` 字段，最终结果写回到 `output_key` 指定的列中。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将抽取结果写回。 |
| `input_key` | `str` | `"raw_chunk"` | 输入文本列名。 |
| `output_key` | `str` | `"triple"` | 输出列名，用于保存抽取出的三元组结果。 |

---

## 🤖 示例用法
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.commonsense_kg.generate.cskg_triple_extractor import (
    CSKGTripleExtraction,
)

operator = CSKGTripleExtraction(
    llm_serving=llm_serving,
    triple_type="relation",
    lang="en",
)
operator.run(
    storage=storage,
    input_key="raw_chunk",
    output_key="triple",
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `raw_chunk` | `str` | 输入原始文本。 |
| `triple` | `list` | 抽取出的三元组结果列表。若文本不通过质量检查或模型解析失败，则为 `[]`。 |

---

#### 示例输入
```json
[
  {
    "raw_chunk": "Tom uses an umbrella when it rains because he wants to stay dry. The umbrella protects him from the rain."
  }
]
```

#### 示例输出
```json
[
  {
    "raw_chunk": "Tom uses an umbrella when it rains because he wants to stay dry. The umbrella protects him from the rain.",
    "triple": [
        "<subj> Tom <obj> umbrella <rel> uses",
    ]
  }
]
```

---


#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/commonsense_kg/generate/cskg_triple_extractor.py`
- 默认 Prompt：`DataFlow-KG/dataflow/prompts/diverse_kg/cskg.py`
- 存储实现：`DataFlow-KG/dataflow/utils/storage.py`

