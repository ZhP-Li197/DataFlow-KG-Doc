---
title: KGRelationTripleInference
createTime: 2026/04/11 12:00:00
permalink: /zh/kg_operators/general_kg/generate/kg_rel_triple_inference/
---

## 📚 概述
`KGRelationTripleInference` 用于根据已有关系三元组推理新的隐含三元组。它会把输入三元组送入大模型，请模型补全潜在但未显式给出的关系事实，并将结果输出到新列中。

如果 `with_text=True`，算子会连同 `raw_chunk` 文本一起参与推理；如果 `merge_to_input=True`，推理得到的新三元组还会被去重后合并回原始 `triple` 列。模型返回内容应包含 `inferred_triple` 字段；解析失败时，该行输出空列表。

## ✒️ `__init__` 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    with_text: bool = False,
    merge_to_input: bool = False,
):
    ...
```

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象。 |
| `seed` | `int` | `0` | 内部随机数种子。 |
| `lang` | `str` | `"en"` | Prompt 语言。 |
| `with_text` | `bool` | `False` | 是否在推理时同时使用 `raw_chunk` 文本。 |
| `merge_to_input` | `bool` | `False` | 是否将推理结果去重后合并回原输入列。 |

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "triple",
    output_key: str = "inferred_triple",
):
    ...
```

`run` 会读取 DataFrame，检查 `input_key` 存在且 `output_key` 尚未占用，然后收集三元组列表。如果启用了 `with_text`，它还会额外读取 `raw_chunk` 列。`process_batch()` 会逐行构建 Prompt 并调用模型，随后用 `_parse_llm_response()` 提取 `inferred_triple`。最后结果写入 `output_key`；若开启 `merge_to_input`，则会按出现顺序去重并回写原始三元组列。

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | DataFrame 存储对象。 |
| `input_key` | `str` | `"triple"` | 输入关系三元组列名。 |
| `output_key` | `str` | `"inferred_triple"` | 输出推理三元组列名。 |

## 🤖 示例用法
```python
from dataflow.operators.general_kg.generate.kg_rel_triple_inference import (
    KGRelationTripleInference,
)

operator = KGRelationTripleInference(
    llm_serving=llm_serving,
    lang="en",
    with_text=False,
    merge_to_input=False,
)

operator.run(
    storage=storage,
    input_key="triple",
    output_key="inferred_triple",
)
```

默认输入输出格式如下：

| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `triple` | `List[str]` | 输入关系三元组列表。 |
| `raw_chunk` | `str` | 可选文本上下文，仅在 `with_text=True` 时使用。 |
| `inferred_triple` | `List[str]` | 模型推理得到的新三元组。 |

示例输入：

```json
[
  {
    "triple": [
      "<subj> Paris <obj> France <rel> capital_of",
      "<subj> France <obj> Europe <rel> located_in"
    ]
  }
]
```

示例输出：

```json
[
  {
    "triple": [
      "<subj> Paris <obj> France <rel> capital_of",
      "<subj> France <obj> Europe <rel> located_in"
    ],
    "inferred_triple": [
      "<subj> Paris <obj> Europe <rel> located_in"
    ]
  }
]
```

相关文件：

- 算子实现：`DataFlow-KG/dataflow/operators/general_kg/generate/kg_rel_triple_inference.py`
- Prompt 定义：`DataFlow-KG/dataflow/prompts/core_kg/rel_triple_generate.py`
