---
title: TKGRelationTupleDialogueQAGeneration
createTime: 2026/04/07 09:00:00
permalink: /zh/kg_operators/temporal_kg/generate/tkg_rel_4tuple_conversation_generator/
---

#### 📚 概述

`TKGRelationTupleDialogueQAGeneration` 基于多跳时序路径生成多轮对话式问答数据。它会读取类似 `2_hop_paths` 这样的列，并把生成结果写入 `multi_turn_dialogues`。

#### 📚 `__init__` 函数

```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    lang: str = "en",
    k: int = 2,
    min_turns: int = 4
):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 用于生成多轮对话的模型服务 |
| `lang` | `str` | `"en"` | 提示词语言 |
| `k` | `int` | `2` | 读取的跳数；默认会消费 `2_hop_paths` |
| `min_turns` | `int` | `4` | 会被截断为 `min(min_turns, k)`；当前实现中未进一步约束输出轮数 |

#### 💡 `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage,
    input_key_meta: str = "hop_paths",
    output_key: str = "multi_turn_dialogues"
) -> List[str]:
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | 输入输出存储对象 |
| `input_key_meta` | `str` | `"hop_paths"` | 与 `k` 组合成真实输入列名，如 `2_hop_paths` |
| `output_key` | `str` | `"multi_turn_dialogues"` | 写回多轮对话的列名 |

输出列中的每一项都是列表，列表中的元素结构通常为 `{"path": ..., "dialogue": [...]}`。

#### 🤖 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.temporal_kg.generate.tkg_rel_4tuple_conversation_generator import TKGRelationTupleDialogueQAGeneration

storage = FileStorage(
    first_entry_file_name="dataflow/data_for_operator_testing/tkg_rel_qa.json",
    cache_path="./cache",
    file_name_prefix="tkg_dialogue",
    cache_type="json",
).step()

op = TKGRelationTupleDialogueQAGeneration(
    llm_serving=llm_serving,
    k=2,
    lang="en"
)
op.run(storage=storage, input_key_meta="hop_paths", output_key="multi_turn_dialogues")
```

输入示例：

```json
{
  "2_hop_paths": "<subj> Elon Musk <obj> SpaceX <rel> founded <time> 2002 || <subj> SpaceX <obj> ISS <rel> first commercial spacecraft docking with <time> 2012"
}
```

输出示例：

```json
{
  "multi_turn_dialogues": [
    {
      "path": "<subj> Elon Musk <obj> SpaceX <rel> founded <time> 2002 || <subj> SpaceX <obj> ISS <rel> first commercial spacecraft docking with <time> 2012",
      "dialogue": [
        {"role": "user", "content": "Which company founded by Elon Musk later docked with the ISS?"},
        {"role": "assistant", "content": "It was SpaceX, which Elon Musk founded in 2002 and which later achieved the first commercial spacecraft docking with the ISS in 2012."}
      ]
    }
  ]
}
```
