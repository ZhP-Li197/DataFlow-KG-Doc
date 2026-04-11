---
title: KGTripleExtraction
createTime: 2026/04/11 12:00:00
permalink: /zh/kg_operators/general_kg/generate/kg_triple_extractor/
---

## 📚 概述
`KGTripleExtraction` 用于从原始文本中抽取知识图谱三元组。它会结合文本内容和候选实体列表，调用大模型抽取结构化三元组，并将结果写回 DataFrame，供后续图谱构建或推理使用。

算子支持两类抽取模板：`triple_type="attribute"` 时使用属性四元组抽取 Prompt，`triple_type="relation"` 时使用关系三元组抽取 Prompt。和实体抽取算子类似，它也包含文本质量过滤逻辑，未通过预处理的文本会直接返回空三元组列表。

## ✒️ __init__ 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    triple_type: str = "attribute",
    lang: str = "en",
    num_q: int = 5
):
    ...
```

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象。 |
| `seed` | `int` | `0` | 内部随机数种子。 |
| `triple_type` | `str` | `"attribute"` | 抽取类型，可选 `attribute` 或 `relation`。 |
| `lang` | `str` | `"en"` | Prompt 语言。 |
| `num_q` | `int` | `5` | 预留参数，当前实现中未直接使用。 |

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "raw_chunk",
    input_key_meta: str = "entity",
    output_key: str = "triple"
):
    ...
```

`run` 会读取 DataFrame，检查输入文本列、实体列和输出列，然后将文本与实体列表打包送入 `process_batch()`。在 `_construct_examples()` 中，每条文本先经过 `_preprocess_text()` 过滤，之后根据 `triple_type` 对应的 Prompt 调用模型，并用 `_parse_llm_response()` 提取返回 JSON 中的 `triple` 字段。最终所有抽取结果会写入 `output_key`。

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | DataFrame 存储对象。 |
| `input_key` | `str` | `"raw_chunk"` | 输入原始文本列名。 |
| `input_key_meta` | `str` | `"entity"` | 输入实体列表列名。 |
| `output_key` | `str` | `"triple"` | 输出三元组列名。 |

## 🤖 示例用法
```python
from dataflow.operators.general_kg.generate.kg_triple_extractor import (
    KGTripleExtraction,
)

operator = KGTripleExtraction(
    llm_serving=llm_serving,
    triple_type="relation",
    lang="en",
)

operator.run(
    storage=storage,
    input_key="raw_chunk",
    input_key_meta="entity",
    output_key="triple",
)
```

默认输入输出格式如下：

| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `raw_chunk` | `str` | 输入原始文本。 |
| `entity` | `str` | 输入候选实体字符串；测试数据中通常是逗号分隔的实体名。 |
| `triple` | `List[str]` | 抽取出的结构化三元组字符串列表。 |

示例输入：

```json
[
  {
    "raw_chunk": "Marie Curie was born in Warsaw and won the Nobel Prize.",
    "entity": "Marie Curie, Warsaw, Nobel Prize"
  }
]
```

示例输出：

```json
[
  {
    "raw_chunk": "Marie Curie was born in Warsaw and won the Nobel Prize.",
    "entity": "Marie Curie, Warsaw, Nobel Prize",
    "triple": [
      "<subj> Marie Curie <obj> Warsaw <rel> born_in",
      "<subj> Marie Curie <obj> Nobel Prize <rel> award"
    ]
  }
]
```

相关文件：

- 算子实现：`DataFlow-KG/dataflow/operators/general_kg/generate/kg_triple_extractor.py`
- Prompt 定义：`DataFlow-KG/dataflow/prompts/core_kg/rel_triple_generate.py`
- 属性 Prompt：`DataFlow-KG/dataflow/prompts/core_kg/attri_triple.py`
