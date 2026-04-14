---
title: KGTupleTextGeneration
createTime: 2026/04/11 12:00:00
permalink: /zh/kg_operators/general_kg/generate/kg_tuple2text/
---

## 📚 概述
`KGTupleTextGeneration` 用于把知识图谱三元组或 tuple 列表转换成自然语言文本。它会读取每一行中的结构化三元组，调用大模型生成描述性段落，并把文本结果写回 DataFrame。

这个算子默认优先读取显式传入的输入列；如果没有设置，它也支持在 DataFrame 中自动寻找 `triple` 或 `tuple` 列。模型输出不会再做 JSON 解析，而是直接作为 `description` 文本保存。

## ✒️ `__init__` 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
):
    ...
```

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象。 |
| `seed` | `int` | `0` | 内部随机数种子。 |
| `lang` | `str` | `"en"` | Prompt 语言。 |

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key_meta: str = "triple",
    output_key_meta: str = "description"
):
    ...
```

`run` 会先设置输入输出列名，读取 DataFrame 并调用 `_validate_dataframe()`。该校验函数会优先使用显式指定的输入列，否则自动选择 `triple` 或 `tuple`。接着 `process_batch()` 会逐行构造 Prompt、调用模型，并把模型原始文本结果去除首尾空白后作为 `description`。最后结果写回 `output_key_meta` 指定列。

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | DataFrame 存储对象。 |
| `input_key_meta` | `str` | `"triple"` | 输入三元组列名。 |
| `output_key_meta` | `str` | `"description"` | 输出自然语言描述列名。 |

## 🤖 示例用法
```python
from dataflow.operators.general_kg.generate.kg_tuple2text import (
    KGTupleTextGeneration,
)

operator = KGTupleTextGeneration(
    llm_serving=llm_serving,
    lang="en",
)

operator.run(
    storage=storage,
    input_key_meta="triple",
    output_key_meta="description",
)
```

默认输入输出格式如下：

| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `triple` / `tuple` | `List[str]` | 输入三元组或 tuple 列表。 |
| `description` | `str` | 模型生成的自然语言段落。 |

示例输入：

```json
[
  {
    "triple": [
      "<subj> Ada Lovelace <obj> Charles Babbage <rel> collaborated_with",
      "<subj> Ada Lovelace <obj> analytical engine <rel> wrote_about"
    ]
  }
]
```

示例输出：

```json
[
  {
    "description": "Ada Lovelace collaborated with Charles Babbage and wrote about the analytical engine."
  }
]
```

相关文件：

- 算子实现：`DataFlow-KG/dataflow/operators/general_kg/generate/kg_tuple2text.py`
- Prompt 定义：`DataFlow-KG/dataflow/prompts/core_kg/rel_triple_generate.py`
