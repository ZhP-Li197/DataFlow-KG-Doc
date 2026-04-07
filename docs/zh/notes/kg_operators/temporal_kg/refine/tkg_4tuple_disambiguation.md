---
title: TKGTupleDisambiguation
createTime: 2026/04/07 09:00:00
permalink: /zh/kg_operators/temporal_kg/refine/tkg_4tuple_disambiguation/
---

#### 📚 概述

`TKGTupleDisambiguation` 用于对合并结果中的歧义四元组做二次判别。它会从 `merged_tuples` 中取出 `ambiguous` 候选，自动区分属性型和关系型表达，然后调用对应提示模板输出最终 `resolved` 结果。

#### 📚 `__init__` 函数

```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    attribute_prompt: Union[KGAttributeTripleDisambiguationPrompt, DIYPromptABC] = None,
    relation_prompt: Union[TKGRelationDisambiguationPrompt, DIYPromptABC] = None,
):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 用于歧义消解的模型服务 |
| `seed` | `int` | `0` | 随机种子 |
| `lang` | `str` | `"en"` | 提示词语言 |
| `attribute_prompt` | `Prompt` | `None` | 自定义属性型消解提示；为空时使用默认模板 |
| `relation_prompt` | `Prompt` | `None` | 自定义关系型消解提示；为空时使用默认模板 |

#### 💡 `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "merged_tuples",
    input_key_meta: str = "ambiguous",
    output_key: str = "resolved",
):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | 输入输出存储对象 |
| `input_key` | `str` | `"merged_tuples"` | 合并结果列 |
| `input_key_meta` | `str` | `"ambiguous"` | 指向待消解候选列表的字典键 |
| `output_key` | `str` | `"resolved"` | 写回消解结果的列名 |

如果某条候选无法解析模型输出，算子会退回原始候选文本，而不会直接丢弃该项。

#### 🤖 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.temporal_kg.refinement.tkg_4tuple_disambiguation import TKGTupleDisambiguation

storage = FileStorage(
    first_entry_file_name="dataflow/data_for_operator_testing/tkg_merge.json",
    cache_path="./cache",
    file_name_prefix="tkg_disamb",
    cache_type="json",
).step()

op = TKGTupleDisambiguation(llm_serving=llm_serving, lang="en")
op.run(
    storage=storage,
    input_key="merged_tuples",
    input_key_meta="ambiguous",
    output_key="resolved"
)
```

输入示例：

```json
{
  "merged_tuples": {
    "ambiguous": [
      "<subj> E1 <obj> E2 <rel> relA <time> 2026-03-01 锝?<subj> E1 <obj> E2 <rel> relB <time> 2026-03-01"
    ]
  }
}
```

输出示例：

```json
{
  "resolved": [
    "<subj> E1 <obj> E2 <rel> relA <time> 2026-03-01"
  ]
}
```
