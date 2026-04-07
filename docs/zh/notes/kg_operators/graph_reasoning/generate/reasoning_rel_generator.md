---
title: KGReasoningRelationGeneration
createTime: 2026/04/01 15:20:00
icon: material-symbols:deployed-code-outline
permalink: /zh/kg_operators/graph_reasoning/generate/reasoning_rel_generator/
---

## 📚 概述
`KGReasoningRelationGeneration` 是一个用于知识图谱关系推理生成的生成类算子。
它基于目标实体对和多跳路径，调用大模型推断这些实体对之间可能成立的关系三元组，并将推理结果写回 DataFrame。

这个算子的几个关键特点如下：

- 依赖 `LLMServingABC` 提供关系推理能力
- 默认使用 `KGReasoningRelationInferencePrompt` 构造提示词
- 默认读取 `target_entity` 和 `mpath` 两列
- 默认输出列为 `inferred_triplets`
- 可通过 `restrict_to_path_rel` 限制模型只从路径中已出现的关系集合里做推断

---

## ✒️ __init__ 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    restrict_to_path_rel: bool = True,
    lang: str = "en"
):
    ...
```

## `__init__` 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象。算子通过 `generate_from_input` 生成实体对之间的候选关系三元组。 |
| `restrict_to_path_rel` | `bool` | `True` | 是否将候选关系限制为路径中已出现的关系集合。若为 `False`，Prompt 中会传递“无关系限制”的信号。 |
| `lang` | `str` | `"en"` | Prompt 的语言。算子会初始化 `KGReasoningRelationInferencePrompt(lang=lang)`。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage,
    target_key: str = "target_entity",
    path_key: str = "mpath",
    output_key: str = "inferred_triplets"
) -> List[str]:
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，并检查目标实体列和路径列是否存在。随后逐行处理数据：算子会读取当前样本中的实体对列表和路径列表，并按索引一一对应。对于每个实体对，先从 `target_entity` 中解析出主语和宾语，再从对应的路径集合中提取候选关系，最后调用 LLM 输出该实体对可能成立的关系三元组列表。所有实体对的推理结果会组成行级结果，并写入输出列。

LLM 返回结果后，算子会尝试直接将响应解析为 JSON 数组；如果解析失败或模型调用失败，则该实体对的推理结果回退为空列表。

## `run` 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将关系推理结果写回。 |
| `target_key` | `str` | `"target_entity"` | 输入目标实体列名。每个元素通常形如 `[["Henry, Berlin"], ["Henry, Rome"]]`。 |
| `path_key` | `str` | `"mpath"` | 输入路径列名。其结构需要与目标实体对顺序对齐。 |
| `output_key` | `str` | `"inferred_triplets"` | 输出列名，用于保存推理得到的关系三元组列表。 |

---

## 🤖 示例用法
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.graph_reasoning.generate.reasoning_rel_generator import (
    KGReasoningRelationGeneration,
)

llm_serving = YourLLMServing(...)

operator = KGReasoningRelationGeneration(
    llm_serving=llm_serving,
    restrict_to_path_rel=True,
    lang="en",
)
operator.run(
    storage=storage,
    target_key="target_entity",
    path_key="mpath",
    output_key="inferred_triplets",
)
```

---

## 默认输出格式

| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `target_entity` | `List[List[str]]` | 目标实体对列表。每个元素通常包装为一个仅含单字符串的列表。 |
| `mpath` | `List[List[List[str]]]` | 与实体对按顺序对齐的路径集合。 |
| `inferred_triplets` | `List[List[str]]` | 每个实体对推理得到的关系三元组列表。 |

---

### 示例输入

```json
[
  {
    "target_entity": [["Henry, Berlin"]],
    "mpath": [
      [
        [
          "<subj> Henry <obj> Maria Rodriguez <rel> is_trained_by",
          "<subj> Maria Rodriguez <obj> Berlin <rel> lives_in"
        ]
      ]
    ]
  }
]
```

### 示例输出

```json
[
  {
    "target_entity": [["Henry, Berlin"]],
    "mpath": [
      [
        [
          "<subj> Henry <obj> Maria Rodriguez <rel> is_trained_by",
          "<subj> Maria Rodriguez <obj> Berlin <rel> lives_in"
        ]
      ]
    ],
    "inferred_triplets": [
      [
        "<subj> Henry <obj> Berlin <rel> trained_in_city"
      ]
    ]
  }
]
```

---

### 相关链接

- 算子实现：`DataFlow-KG/dataflow/operators/graph_reasoning/generate/reasoning_rel_generator.py`
- 默认 Prompt：`DataFlow-KG/dataflow/prompts/application_kg/graph_reasoning.py`
- 上游路径搜索算子：`DataFlow-KG/dataflow/operators/graph_reasoning/generate/reasoning_path_search.py`
