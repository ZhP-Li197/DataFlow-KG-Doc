---
title: KGRelationTripletDialogueQAGeneration
createTime: 2026/04/11 12:00:00
permalink: /zh/kg_operators/general_kg/generate/kg_rel_triple_conversation_generator/
---

## 📚 概述
`KGRelationTripletDialogueQAGeneration` 用于把多跳知识图谱路径转换成多轮对话式问答。它面向路径级输入，通过大模型把一条路径改写成若干轮连续对话，并把每条路径对应的对话结果保存下来。

算子的输入列名由 `k` 和 `input_key_meta` 拼接而成，例如 `k=3` 时默认读取 `3_hop_paths`。模型返回内容需要是带有 `dialogue.turns` 结构的 JSON；算子会去掉代码块标记后直接解析，如果解析成功，就把该路径和对应对话一起写入输出列表。

## ✒️ __init__ 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    lang: str = "en",
    k: int = 3,
    min_turns: int = 4
):
    ...
```

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象。 |
| `lang` | `str` | `"en"` | Prompt 语言。 |
| `k` | `int` | `3` | 多跳路径的 hop 数，同时影响输入列名。 |
| `min_turns` | `int` | `4` | 最少轮数约束，内部会被限制为不超过 `k`。当前代码中该值主要作为配置保留。 |

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage,
    input_key_meta: str = "hop_paths",
    output_key: str = "multi_turn_dialogues"
) -> List[str]:
    ...
```

`run` 会先根据 `k` 和 `input_key_meta` 计算真实输入列名，例如 `3_hop_paths`，再读取 DataFrame 并校验列存在性。之后它会逐行调用 `_generate_dialogue_for_path()`：该方法构建多轮对话生成 Prompt，调用模型，并从返回 JSON 中读取 `response["dialogue"]["turns"]`。每一行最终输出为一个列表，列表中的元素形如 `{"path": 原路径, "dialogue": 多轮对话}`。

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | DataFrame 存储对象。 |
| `input_key_meta` | `str` | `"hop_paths"` | 输入列名后缀，最终列名为 `"{k}_{input_key_meta}"`。 |
| `output_key` | `str` | `"multi_turn_dialogues"` | 输出多轮对话列名。 |

## 🤖 示例用法
```python
from dataflow.operators.general_kg.generate.kg_rel_triple_conversation_generator import (
    KGRelationTripletDialogueQAGeneration,
)

operator = KGRelationTripletDialogueQAGeneration(
    llm_serving=llm_serving,
    lang="en",
    k=3,
)

operator.run(
    storage=storage,
    input_key_meta="hop_paths",
    output_key="multi_turn_dialogues",
)
```

默认输入输出格式如下：

| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `3_hop_paths` | `str` / `List[str]` | 输入的 3-hop 路径描述。 |
| `multi_turn_dialogues` | `List[Dict]` | 每条路径对应的多轮对话结果。 |

示例输入：

```json
[
  {
    "3_hop_paths": "<subj> A <obj> B <rel> founded_by; <subj> B <obj> C <rel> located_in; <subj> C <obj> D <rel> part_of"
  }
]
```

示例输出：

```json
[
  {
    "multi_turn_dialogues": [
      {
        "path": "<subj> A <obj> B <rel> founded_by; <subj> B <obj> C <rel> located_in; <subj> C <obj> D <rel> part_of",
        "dialogue": [
          {"role": "user", "content": "Who founded A?"},
          {"role": "assistant", "content": "A was founded by B."},
          {"role": "user", "content": "Where is B located?"},
          {"role": "assistant", "content": "B is located in C."}
        ]
      }
    ]
  }
]
```

相关文件：

- 算子实现：`DataFlow-KG/dataflow/operators/general_kg/generate/kg_rel_triple_conversation_generator.py`
- Prompt 定义：`DataFlow-KG/dataflow/prompts/core_kg/rel_triple_generate.py`
