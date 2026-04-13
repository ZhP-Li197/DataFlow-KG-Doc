---
title: KGAttributeTripleQAGeneration
createTime: 2026/04/11 12:00:00
permalink: /zh/kg_operators/general_kg/generate/kg_attri_triple_qa_generator/
---

## 📚 概述
`KGAttributeTripleQAGeneration` 用于根据属性三元组或属性描述生成问答对。算子依赖大模型生成结构化 `QA_pairs`，支持单实体问答，以及多实体的基础型、数值型、集合型问答。

该算子默认读取 `triple` 列，并将结果写入 `QA_pairs` 列。内部会根据 `qa_type` 自动选择对应 Prompt 模板，并在模型返回后通过正则提取 JSON，再读取其中的 `QA_pairs` 字段；如果解析失败，则当前样本返回空列表。

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

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象，用于生成 QA 对。 |
| `seed` | `int` | `0` | 用于初始化内部随机数生成器。 |
| `lang` | `str` | `"en"` | Prompt 使用的语言。 |
| `qa_type` | `str` | `"single"` | 生成模式，可选 `single`、`multi_base`、`multi_num`、`multi_set`。 |

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "triple",
    output_key: str = "QA_pairs",
):
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，检查输入列是否存在、输出列是否冲突，然后把 `input_key` 对应的数据批量送入 `process_batch()`。`process_batch()` 为每行构建提示词，调用 `llm_serving.generate_from_input()` 获取结果，并通过 `_parse_llm_response()` 从模型返回中解析 `QA_pairs`。最后结果会写回 `output_key` 指定的列。

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | DataFrame 的读取与写回对象。 |
| `input_key` | `str` | `"triple"` | 输入属性三元组列名。 |
| `output_key` | `str` | `"QA_pairs"` | 输出问答对列名。 |

## 🤖 示例用法
```python
from dataflow.operators.general_kg.generate.kg_attri_triple_qa_generator import (
    KGAttributeTripleQAGeneration,
)

operator = KGAttributeTripleQAGeneration(
    llm_serving=llm_serving,
    lang="en",
    qa_type="multi_num",
)

operator.run(
    storage=storage,
    input_key="triple",
    output_key="QA_pairs",
)
```

默认输入输出格式如下：

| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `triple` | `List[str]` | 输入属性三元组列表；测试数据中通常为 `<entity> ... <attribute> ... <value> ...` 形式的字符串列表。 |
| `QA_pairs` | `List[Dict]` | 生成的问答对列表。 |

示例输入：

```json
[
  {
    "triple": [
      "<entity> Henry <attribute> nationality <value> Canadian",
      "<entity> Henry <attribute> profession <value> musician",
      "<entity> Maple Leaves <attribute> debut_album <value> Polar Lights"
    ]
  }
]
```

示例输出：

```json
[
  {
    "triple": [
      "<entity> Henry <attribute> nationality <value> Canadian",
      "<entity> Henry <attribute> profession <value> musician",
      "<entity> Maple Leaves <attribute> debut_album <value> Polar Lights"
    ],
    "QA_pairs": [
      {
        "question": "What is Henry's profession?",
        "answer": "Henry is a musician."
      }
    ]
  }
]
```

相关文件：

- 算子实现：`DataFlow-KG/dataflow/operators/general_kg/generate/kg_attri_triple_qa_generator.py`
- Prompt 定义：`DataFlow-KG/dataflow/prompts/core_kg/attri_triple.py`
