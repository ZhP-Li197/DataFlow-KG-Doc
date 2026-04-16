---
title: KGRAGAnswerTokenCount
createTime: 2026/04/01 14:00:00
permalink: /zh/kg_operators/graph_rag/eval/graphrag_answer_token_eval/
---

## 📚 概述
`KGRAGAnswerTokenCount` 是一个用于统计 Graph RAG 答案 token 数量的评估类算子。
它读取答案列，基于指定模型对应的 `tiktoken` 编码器统计每条答案的 token 数，并将统计结果写回 DataFrame，常用于后续长度约束分析或过滤步骤。

这个算子的几个关键特点如下：

- 不依赖 LLM，而是依赖 `tiktoken` 做本地 token 统计
- 初始化时通过 `model_name` 选择对应 tokenizer
- 默认读取 `answer` 列，默认输出到 `answer_token_count`
- 同时支持单条答案 `str` 和一行多答案 `List[str]`
- 统计结果会保持与输入结构一致：单条输出 `int`，多条输出 `List[int]`

---

## ✒️ `__init__` 函数
```python
def __init__(
    self,
    model_name: str = "gpt-4o",
):
    ...
```

#### `__init__` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `model_name` | `str` | `"gpt-4o"` | 用于选择 `tiktoken` 编码器的模型名。算子通过 `tiktoken.encoding_for_model(model_name)` 初始化 tokenizer。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    answer_key: str = "answer",
    output_key: str = "answer_token_count",
):
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，检查答案列是否存在以及输出列是否已存在。随后逐行处理 `answer_key`：如果单元格是字符串，则直接统计该字符串的 token 数；如果单元格是列表，则对列表中的每个答案分别统计 token 数，并把结果作为列表写入输出列。最终，算子将统计结果写回 DataFrame。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将 token 统计结果写回。 |
| `answer_key` | `str` | `"answer"` | 输入答案列名。每个单元格支持 `str` 或 `List[str]`。 |
| `output_key` | `str` | `"answer_token_count"` | 输出列名，用于保存 token 数统计结果。 |

---

## 🤖 示例用法
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.graph_rag.eval.graphrag_answer_token_eval import (
    KGRAGAnswerTokenCount,
)

operator = KGRAGAnswerTokenCount(model_name="gpt-4o")
operator.run(
    storage=storage,
    answer_key="answer",
    output_key="answer_token_count",
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `answer` | `str` / `List[str]` | 输入答案列。可为单条答案，也可为一行多答案。 |
| `answer_token_count` | `int` / `List[int]` | 与输入结构对应的 token 数统计结果。 |

---

#### 示例输入
```json
[
  {
    "answer": "Maria Rodriguez"
  }
]
```

#### 示例输出
```json
[
  {
    "answer": "Maria Rodriguez",
    "answer_token_count": 2
  }
]
```

---

#### 可选补充
#### 注意事项
- 输入 DataFrame 中必须存在 `answer_key` 指定的列，否则会抛出 `ValueError`。
- 如果 `output_key` 已存在，算子会直接报错，避免覆盖已有结果。
- 当前实现仅支持 `str` 和 `List[str]` 两种输入形态，其他类型会触发 `ValueError`。
- token 统计依赖 `tiktoken` 对指定模型的编码规则，因此不同 `model_name` 下的统计结果可能不同。
- 若传入的模型名不被 `tiktoken.encoding_for_model` 支持，初始化阶段就可能失败。

#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/graph_rag/eval/graphrag_answer_token_eval.py`
- 相关过滤算子：`DataFlow-KG/dataflow/operators/graph_rag/filter/graphrag_answer_token_filtering.py`
- 存储实现：`DataFlow-KG/dataflow/utils/storage.py`

