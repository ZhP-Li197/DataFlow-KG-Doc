---
title: KGTupleNormalization
createTime: 2026/04/11 13:00:00
permalink: /zh/kg_operators/general_kg/refine/kg_tuple_normalization/
---

## 📚 概述
`KGTupleNormalization` 用于规范化知识图谱三元组或 tuple。它同时支持属性型三元组和关系型三元组，会根据输入内容自动选择对应 Prompt，对属性名或关系名做归一化和标准化处理。

这个算子默认优先使用传入的输入列；若未显式指定，也支持自动在 DataFrame 中查找 `triple` 或 `tuple`。输出列会根据输入列自动设为 `normalized_triple` 或 `normalized_tuple`，并在模型返回失败时回退为空字符串。

## ✒️ `__init__` 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    attribute_prompt: Union[KGAttributeNormalizationPrompt, DIYPromptABC] = None,
    relation_prompt: Union[KGAttributeNormalizationPrompt, DIYPromptABC] = None,
    num_q: int = 5
):
    ...
```

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象。 |
| `seed` | `int` | `0` | 内部随机数种子。 |
| `lang` | `str` | `"en"` | Prompt 语言。 |
| `attribute_prompt` | `Union[KGAttributeNormalizationPrompt, DIYPromptABC]` | `None` | 属性三元组规范化 Prompt。 |
| `relation_prompt` | `Union[KGAttributeNormalizationPrompt, DIYPromptABC]` | `None` | 关系三元组规范化 Prompt。 |
| `num_q` | `int` | `5` | 预留参数。 |

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "triple",
    output_key: str = "normalized_triple",
):
    ...
```

`run` 会读取 DataFrame，并通过 `_validate_dataframe()` 自动确定真实输入列和输出列。`process_batch()` 内部首先用 `_detect_triple_type()` 判断当前数据是属性型还是关系型三元组，然后对每一行构建 Prompt、调用模型，并从返回 JSON 中提取 `normalized_triple`。最终规范化结果写回 DataFrame。

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | DataFrame 存储对象。 |
| `input_key` | `str` | `"triple"` | 输入三元组列名。 |
| `output_key` | `str` | `"normalized_triple"` | 期望输出列名；实际会根据输入列自动调整。 |

## 🤖 示例用法
```python
from dataflow.operators.general_kg.refinement.kg_tuple_normalization import (
    KGTupleNormalization,
)

operator = KGTupleNormalization(
    llm_serving=llm_serving,
    lang="en",
)

operator.run(
    storage=storage,
    input_key="triple",
    output_key="normalized_triple",
)
```

默认输入输出格式如下：

| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `triple` / `tuple` | `List[str]` | 输入属性型或关系型三元组。 |
| `normalized_triple` / `normalized_tuple` | `str` / `List[str]` | 规范化后的三元组结果。 |

示例输入：

```json
[
  {
    "triple": [
      "<subj> A <obj> B <rel> was born in",
      "<subj> C <obj> D <rel> born_in"
    ]
  }
]
```

示例输出：

```json
[
  {
    "normalized_triple": [
      "<subj> A <obj> B <rel> born_in",
      "<subj> C <obj> D <rel> born_in"
    ]
  }
]
```

相关文件：

- 算子实现：`DataFlow-KG/dataflow/operators/general_kg/refinement/kg_tuple_normalization.py`
