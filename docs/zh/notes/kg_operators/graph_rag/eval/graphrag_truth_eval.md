---
title: KGGraphRAGAnswerLLMEvaluation
createTime: 2026/04/01 14:30:00
permalink: /zh/kg_operators/graph_rag/eval/graphrag_truth_eval/
---

## 📚 概述
`KGGraphRAGAnswerLLMEvaluation` 是一个用于 Graph RAG 答案正确性评估的评估类算子。
它读取模型答案和标准答案，调用另一个大模型进行判定，并输出每条答案是否正确的布尔结果。

这个算子的几个关键特点如下：

- 依赖 `LLMServingABC` 提供 LLM 判定能力
- 默认读取 `answer` 和 `truth` 两列
- 默认输出列为 `is_correct`
- 支持单条答案评估，也支持一行内多答案与多标准答案的批量评估
- 当前实现里的判定 prompt 与 system prompt 都是固定英文文本，`lang` 参数仅保存为实例属性，未参与判定逻辑

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
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象。算子通过 `generate_from_input` 对模型答案与标准答案的一致性做判定。 |
| `lang` | `str` | `"en"` | 语言参数。当前实现会保存该值，但实际判定仍使用固定英文提示词。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_keys: List[str] = ["answer", "truth"],
    output_key: str = "is_correct",
) -> List[str]:
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，并检查答案列、标准答案列以及输出列状态。随后逐行处理：若某一行的 `answer` 和 `truth` 都是字符串，则直接调用 LLM 判断是否正确；若两者都是列表，则会先补齐到相同长度，再逐对调用 LLM 返回布尔结果列表。处理完成后，算子会把结果写回到 `output_key` 指定的列中。

在内部判定时，算子会构造固定英文 Prompt，要求模型判断生成答案是否包含标准答案中的关键信息。模型返回后，算子会用简单的字符串规则解析：结果文本中只要包含 `true` 就判为 `True`，否则如果包含 `false` 判为 `False`；若输出含义不明确或 LLM 调用失败，则回退为 `False`。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将正确性判定结果写回。 |
| `input_keys` | `List[str]` | `["answer", "truth"]` | 输入列名列表。默认第一个是答案列，第二个是标准答案列。 |
| `output_key` | `str` | `"is_correct"` | 输出列名，用于保存布尔判定结果。 |

---

## 🤖 示例用法
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.graph_rag.eval.graphrag_truth_eval import (
    KGGraphRAGAnswerLLMEvaluation,
)


operator = KGGraphRAGAnswerLLMEvaluation(
    llm_serving=llm_serving,
    lang="en",
)
operator.run(
    storage=storage,
    input_keys=["answer", "truth"],
    output_key="is_correct",
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `answer` | `str` / `List[str]` | 模型生成答案列。 |
| `truth` | `str` / `List[str]` | 标准答案列。 |
| `is_correct` | `bool` / `List[bool]` / `None` | 正确性判定结果。若输入类型不匹配，当前实现会为该行写入 `None`。 |

---

#### 示例输入
```json
[
  {
    "answer": "Maria Rodriguez",
    "truth": "Maria Rodriguez"
  }
]
```

#### 示例输出
```json
[
  {
    "answer": "Maria Rodriguez",
    "truth": "Maria Rodriguez",
    "is_correct": true
  }
]
```

---

#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/graph_rag/eval/graphrag_truth_eval.py`
- 上游答案生成算子：`DataFlow-KG/dataflow/operators/graph_rag/generate/graphrag_get_answer.py`
- 存储实现：`DataFlow-KG/dataflow/utils/storage.py`


