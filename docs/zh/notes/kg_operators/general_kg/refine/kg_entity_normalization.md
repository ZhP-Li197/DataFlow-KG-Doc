---
title: KGEntityNormalization
createTime: 2026/04/11 13:00:00
permalink: /zh/kg_operators/general_kg/refine/kg_entity_normalization/
---

## 📚 概述
`KGEntityNormalization` 用于对已抽取实体做规范化和去重。它不负责实体抽取，而是把不同写法、同义表达或别名映射到统一的 canonical 名称，再把结果按原始行回填。

这个算子的处理分为两段：首先把整列实体合并成全局候选集合，交给模型生成“变体到标准名”的归一化映射；随后再用该映射回写每一行实体列表，并在行内去重。默认输入列为 `entity`，输出列为 `normalized_entity`。

## ✒️ `__init__` 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    prompt_template: Union[KGEntityNormalizationPrompt, DIYPromptABC] = None,
    num_q: int = 5
):
    ...
```

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象。 |
| `seed` | `int` | `0` | 内部随机数种子。 |
| `lang` | `str` | `"en"` | Prompt 语言。 |
| `prompt_template` | `Union[KGEntityNormalizationPrompt, DIYPromptABC]` | `None` | 自定义规范化 Prompt。 |
| `num_q` | `int` | `5` | 预留参数。 |

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "entity",
    output_key: str = "normalized_entity",
):
    ...
```

`run` 会读取 DataFrame，并把输入列所有行先交给 `process_batch()`。`process_batch()` 内部会通过 `_text2merged_list()` 合并并去重所有实体，再使用 `_construct_examples()` 调用模型生成归一化字典。之后 `_normalize_chunks()` 会把变体映射回每一行原始实体，并对每行结果再次去重，最终写回 `normalized_entity`。

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | DataFrame 存储对象。 |
| `input_key` | `str` | `"entity"` | 输入实体列名。 |
| `output_key` | `str` | `"normalized_entity"` | 输出规范化实体列名。 |

## 🤖 示例用法
```python
from dataflow.operators.general_kg.refinement.kg_entity_normalization import (
    KGEntityNormalization,
)

operator = KGEntityNormalization(
    llm_serving=llm_serving,
    lang="en",
)

operator.run(
    storage=storage,
    input_key="entity",
    output_key="normalized_entity",
)
```

默认输入输出格式如下：

| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `entity` | `str` | 输入实体字符串；当前测试数据里通常为逗号分隔的实体列表。 |
| `normalized_entity` | `str` | 规范化后的实体字符串。 |

示例输入：

```json
[
  {
    "entity": "IBM, International Business Machines, Watson"
  }
]
```

示例输出：

```json
[
  {
    "normalized_entity": "IBM, Watson"
  }
]
```

相关文件：

- 算子实现：`DataFlow-KG/dataflow/operators/general_kg/refinement/kg_entity_normalization.py`
