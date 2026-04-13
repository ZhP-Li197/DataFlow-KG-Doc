---
title: KGEntityDisambiguation
createTime: 2026/04/11 13:00:00
permalink: /zh/kg_operators/general_kg/refine/kg_entity_disambiguation/
---

## 📚 概述
`KGEntityDisambiguation` 用于对文本中的歧义实体进行消歧。它结合原始文本上下文和候选实体列表，让大模型输出每个实体更明确、更规范的表达形式。

算子默认读取 `raw_chunk` 和 `entity` 两列，输出到 `disambiguated_entity`。在调用模型前，文本会先经过长度、句子数和特殊字符比例等质量检查；如果文本不合格，会传入空字符串作为上下文。

## ✒️ __init__ 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    prompt_template: Union[KGEntityDisambiguationPrompt, DIYPromptABC] = None,
    num_q: int = 5
):
    ...
```

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象。 |
| `seed` | `int` | `0` | 内部随机数种子。 |
| `lang` | `str` | `"en"` | Prompt 语言。 |
| `prompt_template` | `Union[KGEntityDisambiguationPrompt, DIYPromptABC]` | `None` | 自定义消歧 Prompt。 |
| `num_q` | `int` | `5` | 预留参数。 |

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "raw_chunk",
    input_key_meta: str = "entity",
    output_key: str = "disambiguated_entity"
):
    ...
```

`run` 会读取 DataFrame，检查原文列、实体列和输出列，然后逐行调用 `process_batch()`。在处理过程中，文本先经过 `_preprocess_text()`，随后使用 `KGEntityDisambiguationPrompt` 构造提示词并请求模型。当前实现直接把模型原始回复写入 `disambiguated_entity`，没有再做额外 JSON 解析。

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | DataFrame 存储对象。 |
| `input_key` | `str` | `"raw_chunk"` | 输入原始文本列名。 |
| `input_key_meta` | `str` | `"entity"` | 输入实体列表列名。 |
| `output_key` | `str` | `"disambiguated_entity"` | 输出消歧结果列名。 |

## 🤖 示例用法
```python
from dataflow.operators.general_kg.refinement.kg_entity_disambiguation import (
    KGEntityDisambiguation,
)

operator = KGEntityDisambiguation(
    llm_serving=llm_serving,
    lang="en",
)

operator.run(
    storage=storage,
    input_key="raw_chunk",
    input_key_meta="entity",
    output_key="disambiguated_entity",
)
```

默认输入输出格式如下：

| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `raw_chunk` | `str` | 输入原始文本。 |
| `entity` | `str` / `List[str]` | 待消歧实体；测试数据中更常见的是逗号分隔字符串。 |
| `disambiguated_entity` | `str` | 模型返回的原始消歧结果字符串。 |

示例输入：

```json
[
  {
    "raw_chunk": "Jordan won six NBA championships with the Bulls.",
    "entity": "Jordan, Bulls"
  }
]
```

示例输出：

```json
[
  {
    "disambiguated_entity": "Michael Jordan, Chicago Bulls"
  }
]
```

相关文件：

- 算子实现：`DataFlow-KG/dataflow/operators/general_kg/refinement/kg_entity_disambiguation.py`
