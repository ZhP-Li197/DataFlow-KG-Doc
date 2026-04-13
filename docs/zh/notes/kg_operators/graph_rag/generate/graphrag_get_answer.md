---
title: KGGraphRAGGetAnswer
createTime: 2026/04/01 12:40:00
permalink: /zh/kg_operators/graph_rag/generate/graphrag_get_answer/
---

## 📚 概述
`KGGraphRAGGetAnswer` 是一个用于 Graph RAG 答案生成的生成类算子。
它读取问题列和子图 Prompt 列，调用大模型基于子图事实生成最终答案，并把结果写回到 DataFrame 中。

这个算子的几个关键特点如下：

- 依赖 `LLMServingABC` 提供大模型推理能力
- 默认读取 `question` 和 `subgraph_prompt` 两列
- 默认输出列为 `answer`
- 同时支持单条问题/单条 Prompt，以及一行多问题/多 Prompt 的输入形式
- 当前实现里的系统提示词是固定英文文本，`lang` 参数仅保存为实例属性，未参与生成逻辑

---

## ✒️ `__init__` 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    lang: str = "en",
):
    ...
```

#### `__init__` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象。算子通过 `generate_from_input` 基于子图 Prompt 生成答案。 |
| `lang` | `str` | `"en"` | 语言参数。当前实现会保存该值，但生成时仍使用固定英文 system prompt。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_keys: List[str] = ["question", "subgraph_prompt"],
    output_key: str = "answer",
) -> List[str]:
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，校验输入列与输出列，再逐行读取问题和对应的子图 Prompt。若一行中 `question` 和 `subgraph_prompt` 都是字符串，算子会直接调用 LLM 生成单条答案；若两者都是列表，算子会先对齐长度，再对每个 Prompt 逐个生成答案，最终得到一行对应的答案列表。处理完成后，结果会写回到 `output_key` 指定的列中。

在答案生成阶段，算子真正送入 LLM 的内容是 `subgraph_prompt`，并附带固定的 system prompt：要求模型只能基于提供的事实作答。生成完成后，算子会用正则去掉 Markdown 代码块，并做首尾空白清理；如果 LLM 调用失败，则回退为空字符串。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将答案结果写回。 |
| `input_keys` | `List[str]` | `["question", "subgraph_prompt"]` | 输入列名列表。默认第一个是问题列，第二个是子图 Prompt 列。 |
| `output_key` | `str` | `"answer"` | 输出答案列名。当前实现会按照该参数写回结果。 |

---

## 🤖 示例用法
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.graph_rag.generate.graphrag_get_answer import (
    KGGraphRAGGetAnswer,
)


operator = KGGraphRAGGetAnswer(
    llm_serving=llm_serving,
    lang="en",
)
operator.run(
    storage=storage,
    input_keys=["question", "subgraph_prompt"],
    output_key="answer",
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `question` | `str` / `List[str]` | 输入问题列。可为单条问题，也可为一行多问题。 |
| `subgraph_prompt` | `str` / `List[str]` | 上游子图检索算子生成的 Prompt。算子实际基于该列调用 LLM。 |
| `answer` | `str` / `List[str]` / `None` | 生成的答案结果。若输入形状异常，当前实现会写入 `None`。 |

---

#### 示例输入
```json
[
  {
    "question": "Who trained Henry?",
    "subgraph_prompt": "You are given a question and relevant knowledge graph facts. Use ONLY the provided facts to answer the question. Question: Who trained Henry? Subgraph centered at [Henry]: - <subj> Henry <obj> Maria Rodriguez <rel> is_trained_by"
  }
]
```

#### 示例输出
```json
[
  {
    "question": "Who trained Henry?",
    "subgraph_prompt": "You are given a question and relevant knowledge graph facts. Use ONLY the provided facts to answer the question. Question: Who trained Henry? Subgraph centered at [Henry]: - <subj> Henry <obj> Maria Rodriguez <rel> is_trained_by",
    "answer": "Maria Rodriguez"
  }
]
```

---

#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/graph_rag/generate/graphrag_get_answer.py`
- 上游子图 Prompt 算子：`DataFlow-KG/dataflow/operators/graph_rag/generate/graphrag_prompt_generator.py`
- 存储实现：`DataFlow-KG/dataflow/utils/storage.py`


