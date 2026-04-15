---
title: KGRelationTripleSubgraphQAGeneration
createTime: 2026/04/11 12:00:00
permalink: /zh/kg_operators/general_kg/generate/kg_rel_triple_subgraph_qa_generator/
---

## 📚 概述
`KGRelationTripleSubgraphQAGeneration` 用于从知识图谱子图生成多实体问答。它面向一组相关三元组构成的子图，通过大模型生成数值型或集合型 QA 对。

算子支持两种模式：`qa_type="num"` 使用数值型 Prompt，`qa_type="set"` 使用集合型 Prompt。默认读取 `subgraph` 列，输出到 `QA_pairs`；模型返回内容会被解析为包含 `QA_pairs` 字段的 JSON，如果解析失败，当前样本回退为空列表。

## ✒️ __init__ 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    qa_type: str = "num",
    num_q: int = 5
):
    ...
```

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象。 |
| `seed` | `int` | `0` | 内部随机数种子。 |
| `lang` | `str` | `"en"` | Prompt 语言。 |
| `qa_type` | `str` | `"num"` | 问答类型，可选 `num` 或 `set`。 |
| `num_q` | `int` | `5` | 预留的问答数量参数。 |

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "subgraph",
    output_key: str = "QA_pairs"
):
    ...
```

`run` 会从 `storage` 读取 DataFrame，检查 `input_key` 是否存在、`output_key` 是否冲突，然后把每个子图送入 `process_batch()`。在批处理中，算子会逐条构建 Prompt、调用模型、解析 JSON 中的 `QA_pairs`，最后把每行生成结果写回 `output_key`。

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | DataFrame 存储对象。 |
| `input_key` | `str` | `"subgraph"` | 输入子图列名。 |
| `output_key` | `str` | `"QA_pairs"` | 输出问答对列名。 |

## 🤖 示例用法
```python
from dataflow.operators.general_kg.generate.kg_rel_triple_subgraph_qa_generator import (
    KGRelationTripleSubgraphQAGeneration,
)

operator = KGRelationTripleSubgraphQAGeneration(
    llm_serving=llm_serving,
    lang="en",
    qa_type="set",
)

operator.run(
    storage=storage,
    input_key="subgraph",
    output_key="QA_pairs",
)
```

默认输入输出格式如下：

| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `subgraph` | `str` / `List[str]` | 输入子图三元组。 |
| `QA_pairs` | `List[Dict]` | 生成的多实体问答对。 |

示例输入：

```json
[
  {
    "subgraph": [
      "<subj> A <obj> B <rel> works_at",
      "<subj> C <obj> B <rel> works_at",
      "<subj> B <obj> D <rel> located_in"
    ]
  }
]
```

示例输出：

```json
[
  {
    "subgraph": [
      "<subj> A <obj> B <rel> works_at",
      "<subj> C <obj> B <rel> works_at",
      "<subj> B <obj> D <rel> located_in"
    ],
    "QA_pairs": [
      {
        "Question": "Who works at the company located in D?",
        "answer": "A, C"
      },
      {
        "Question": "Which company is worked at by A and C?",
        "answer": "B"
      }
    ]
  }
]
```

相关文件：

- 算子实现：`DataFlow-KG/dataflow/operators/general_kg/generate/kg_rel_triple_subgraph_qa_generator.py`
- Prompt 定义：`DataFlow-KG/dataflow/prompts/core_kg/rel_triple_generate.py`
