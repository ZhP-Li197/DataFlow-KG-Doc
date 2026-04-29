---
title: KGGraphRAGSubgraphRetrieval
createTime: 2026/04/01 12:30:00
permalink: /zh/kg_operators/graph_rag/generate/graphrag_prompt_generator/
---

## 📚 概述
`KGGraphRAGSubgraphRetrieval` 是一个用于 Graph RAG 子图检索与提示词构造的生成类算子。
它根据问题、已抽取实体和知识图谱三元组，为每个问题构造一个包含局部子图事实的回答 Prompt，供后续答案生成算子直接使用。

这个算子的几个关键特点如下：

- 不依赖 LLM，而是基于规则完成子图检索和 Prompt 组装
- 主要面向“一行包含多个问题”的输入格式
- 从 `triple` 列构建图结构，并以无向图方式做 `k` 跳 BFS 检索
- 默认输出列为 `subgraph_prompt`
- 当前实现实际读取 `question`、`entities`、`triple` 三列，不依赖 `relations` 列

---

## ✒️ `__init__` 函数
```python
def __init__(self, hop: int = 1):
    ...
```

#### `__init__` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `hop` | `int` | `1` | 子图检索的跳数。算子会围绕种子实体做 `k` 跳 BFS，收集命中的三元组并写入 Prompt。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    output_key: str = "subgraph_prompt",
) -> List[List[str]]:
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，校验必需列是否存在，然后逐行处理数据。对于每一行，算子会取出问题列表、实体列表和三元组列表，按问题和实体的数量做对齐；随后围绕每个问题对应的实体集合，从 `triple` 中做 `k` 跳子图检索，并把检索到的事实组装成英文 Prompt。最后，算子将每行生成的 Prompt 列表写回到输出列。

在内部流程上，算子会先把三元组解析为 `<subj> ... <obj> ... <rel> ...` 结构，再构建实体目录与邻接表。种子实体优先来自抽取结果中与知识图谱实体目录相交的部分；若完全没有匹配实体，但图中存在实体，则会退化为取目录中的第一个实体继续构造 Prompt。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将生成的 Prompt 写回。 |
| `output_key` | `str` | `"subgraph_prompt"` | 输出列名。当前实现会按照该参数把结果写入 DataFrame。 |

---

## 🤖 示例用法
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.graph_rag.generate.graphrag_prompt_generator import (
    KGGraphRAGSubgraphRetrieval,
)

operator = KGGraphRAGSubgraphRetrieval(hop=1)
operator.run(
    storage=storage,
    output_key="subgraph_prompt",
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `question` | `List[str]` | 一行内的多个问题。当前实现主要按这种格式处理。 |
| `entities` | `List[List[str]]` | 与每个问题对齐的实体列表。每个问题对应一个实体子列表。 |
| `triple` | `List[str]` | 原始知识图谱三元组列表，格式应接近 `<subj> ... <obj> ... <rel> ...`。 |
| `subgraph_prompt` | `List[str]` | 为每个问题生成的 Prompt 列表。 |

---

#### 示例输入
```json
[
  {
    "question": ["Which institution is Alice Smith affiliated with?"],
    "entities": [["Alice Smith"]],
    "triple": [
      "<subj> Alice Smith <obj> Peking University <rel> affiliated_with",
      "<subj> Bob Lee <obj> Tsinghua University <rel> affiliated_with"
    ]
  }
]
```

#### 示例输出
```json
[
  {
    "question": ["Which institution is Alice Smith affiliated with?"],
    "entities": [["Alice Smith"]],
    "triple": [
      "<subj> Alice Smith <obj> Peking University <rel> affiliated_with",
      "<subj> Bob Lee <obj> Tsinghua University <rel> affiliated_with"
    ],
    "subgraph_prompt": [
      "You are given a question and relevant knowledge graph facts.\nUse ONLY the provided facts to answer the question.\n\nQuestion:\nWhich institution is Alice Smith affiliated with?\n\nSubgraph centered at [Alice Smith]:\n- <subj> Alice Smith <obj> Peking University <rel> affiliated_with\n\nAnswer the question based on the above knowledge graph subgraphs."
    ]
  }
]
```

---
#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/graph_rag/generate/graphrag_prompt_generator.py`
- 上游实体抽取算子：`DataFlow-KG/dataflow/operators/graph_rag/generate/graphrag_query_extractor.py`
- 存储实现：`DataFlow-KG/dataflow/utils/storage.py`
