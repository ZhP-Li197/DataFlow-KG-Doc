---
title: KGTripleDisambiguation
createTime: 2026/04/11 13:00:00
permalink: /zh/kg_operators/general_kg/refine/kg_triple_disambiguation/
---

## 📚 概述
`KGTripleDisambiguation` 用于对歧义三元组做自动消歧。它同时支持属性三元组和关系三元组，适合处理图谱合并后 `ambiguous` 列里带有多个候选值的情况。

算子默认读取 `merged_triples` 列中的 `ambiguous` 字段，并把消歧结果写到 `resolved`。它会先判断每条歧义 triple 是属性型还是关系型，再调用对应 Prompt，让模型从候选值中选择最合理的一项。

## ✒️ __init__ 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    attribute_prompt: Union[KGAttributeTripleDisambiguationPrompt, DIYPromptABC] = None,
    relation_prompt: Union[KGEntityRelationTripleDisambiguationPrompt, DIYPromptABC] = None,
):
    ...
```

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象。 |
| `seed` | `int` | `0` | 内部随机数种子。 |
| `lang` | `str` | `"en"` | Prompt 语言。 |
| `attribute_prompt` | `Union[KGAttributeTripleDisambiguationPrompt, DIYPromptABC]` | `None` | 属性三元组消歧 Prompt。 |
| `relation_prompt` | `Union[KGEntityRelationTripleDisambiguationPrompt, DIYPromptABC]` | `None` | 关系三元组消歧 Prompt。 |

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "merged_triples",
    input_key_meta: str = "ambiguous",
    output_key: str = "resolved",
):
    ...
```

`run` 会读取 DataFrame，并从每一行 `merged_triples` 字典中取出 `ambiguous` 列表。对每条歧义 triple，`_resolve_single()` 会先用 `_detect_triple_type()` 判断是属性三元组还是关系三元组，再用相应 Prompt 请求模型返回 `resolved_attribute` 或 `resolved_relation`。若解析失败或模型没有给出结果，则回退为原始歧义 triple。

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | DataFrame 存储对象。 |
| `input_key` | `str` | `"merged_triples"` | 输入合并后三元组字典列名。 |
| `input_key_meta` | `str` | `"ambiguous"` | 输入字典中包含歧义三元组的键名。 |
| `output_key` | `str` | `"resolved"` | 输出消歧后三元组列名。 |

## 🤖 示例用法
```python
from dataflow.operators.general_kg.refinement.kg_triple_disambiguation import (
    KGTripleDisambiguation,
)

operator = KGTripleDisambiguation(
    llm_serving=llm_serving,
    lang="en",
)

operator.run(
    storage=storage,
    input_key="merged_triples",
    input_key_meta="ambiguous",
    output_key="resolved",
)
```

默认输入输出格式如下：

| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `merged_triples` | `Dict[str, List[str]]` | 合并后三元组字典，其中应包含 `ambiguous`。 |
| `resolved` | `List[str]` | 消歧后的三元组列表。 |

示例输入：

```json
[
  {
    "merged_triples": {
      "ambiguous": [
        "<entity> Paris <attribute> country <value> France | USA"
      ]
    }
  }
]
```

示例输出：

```json
[
  {
    "resolved": [
      "<entity> Paris <attribute> country <value> France"
    ]
  }
]
```

相关文件：

- 算子实现：`DataFlow-KG/dataflow/operators/general_kg/refinement/kg_triple_disambiguation.py`
