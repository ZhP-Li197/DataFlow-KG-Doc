---
title: KGAttributeTripleQAGeneration
createTime: 2026/04/10 18:44:44
permalink: /zh/kg_operators/core_kg/attri_triple/kg_attri_triple_qa_generator/
---

## 📚 概述
`KGAttributeTripleQAGeneration` 是一个用于基于知识图谱实体属性信息生成问答对（QA pairs）的算子。
它会读取输入数据中的属性三元组或属性集合，调用大语言模型（LLM），根据指定的生成类型构造涉及单个或多个实体的 QA 对，并将结果写回 DataFrame。

这个算子在构建知识图谱驱动的多跳问答数据集时非常实用，其关键特点如下：

- 依赖 `LLMServingABC` 提供大模型生成能力
- 支持四种问答生成模式：单实体 (`single`)、多实体基础 (`multi_base`)、多实体数值 (`multi_num`) 和多实体集合 (`multi_set`)
- 会根据初始化的 `qa_type` 自动绑定对应的 Prompt 模板
- 默认读取 `triple` 列，默认输出到 `QA_pairs` 列
- 内置正则表达式解析器，能自动从 LLM 回复中提取并反序列化 JSON 结构中的 QA 对列表

---

## ✒️ __init__ 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    qa_type: str = "single",
):
    ...
```

#### `__init__` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象。算子通过 `generate_from_input` 基于属性生成 QA 对。 |
| `seed` | `int` | `0` | 随机种子，用于初始化内部的 `random.Random` 实例，保证一定的可复现性。 |
| `lang` | `str` | `"en"` | Prompt 语言。支持传入不同语言来决定使用的模板语言。 |
| `qa_type` | `str` | `"single"` | QA 生成类型。支持 `single` (单实体), `multi_base` (多实体基础), `multi_num` (多实体数值型), `multi_set` (多实体集合型)。算子会根据该值实例化对应的 Prompt 模板。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "triple",
    output_key: str = "QA_pairs"
):
    ...
```

`run` 函数首先从 `storage` 中读取 DataFrame，并校验必要的列名是否存在。随后，提取 `input_key` 指定列的数据传递给 `process_batch()`。在批量处理时，算子会结合实例化的 `prompt_template` 构建系统与用户提示词，调用大模型生成回复。生成后，内置的 `_parse_llm_response` 方法会使用正则表达式 (`r"\{.*\}"`) 提取 JSON 并获取 `QA_pairs` 字段。最终生成的问答对列表会保存到 `output_key` 指定的列，并写回存储。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow 数据存储对象。算子从中读取 `dataframe` 并将生成的 QA 数据写回。 |
| `input_key` | `str` | `"triple"` | 输入的三元组或属性集合列名。 |
| `output_key` | `str` | `"QA_pairs"` | 输出的 QA 对列名。用于保存生成的问答字典列表。 |

---

## 🤖 示例用法
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.core_kg.attri_triple.kg_attri_triple_qa_generator import (
    KGAttributeTripleQAGeneration,
)

# 以多实体数值型 QA 生成为例
operator = KGAttributeTripleQAGeneration(
    llm_serving=llm_serving,
    lang="en",
    qa_type="multi_num" 
)

operator.run(
    storage=storage,
    input_key="triple",
    output_key="QA_pairs",
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `triple` | `str` / `List` / `Dict` | 输入的属性三元组或实体属性信息（具体格式取决于上游输入和 Prompt 要求）。 |
| `QA_pairs` | `List[Dict]` | 模型基于输入属性生成的 QA 问答对列表。 |

---

#### 示例输入 (以 `multi_num` 为例的伪数据)
```json
[
  {
    "triple": "Entity A has a length of 500 meters. Entity B has a length of 300 meters."
  }
]
```

#### 示例输出
```json
[
  {
    "triple": "Entity A has a length of 500 meters. Entity B has a length of 300 meters.",
    "QA_pairs": [
      {
        "question": "What is the total length of Entity A and Entity B combined?",
        "answer": "The total length is 800 meters."
      },
      {
        "question": "How much longer is Entity A compared to Entity B?",
        "answer": "Entity A is 200 meters longer than Entity B."
      }
    ]
  }
]
```

---

#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/core_kg/attri_triple/kg_attri_triple_qa_generator.py`
- Prompt 模板目录：`DataFlow-KG/dataflow/prompts/core_kg/attri_triple.py`