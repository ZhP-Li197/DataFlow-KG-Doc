---
title: KGQAConcisenessEvaluator
createTime: 2026/04/10 10:00:00
permalink: /zh/kg_operators/general_kg/eval/kg_qa_concise_eval/
---

## 📚 概述
`KGQAConcisenessEvaluator` 是一个用于评估知识图谱 QA 对简洁性的评估类算子。
它会读取每一行中的 QA 问答对列表，调用大模型对这些 QA 对的简洁性进行打分，并将评分结果写回 DataFrame。

这个算子的几个关键特点如下：

- 依赖 `LLMServingABC` 提供大模型评估能力
- 默认使用 `KGQAConcisenessPrompt` 构造提示词
- 默认读取 `QA_pairs` 列，默认输出到 `conciseness_scores`
- 支持输入单元格为 Python 列表，也支持输入为可反序列化的 JSON 字符串
- 当模型调用失败、返回非法 JSON 或输入为空时，当前行会回退为 `[]`

---

## ✒️ __init__ 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    lang: str = "en"
):
    ...
```

#### `__init__` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象。算子通过 `generate_from_input` 对 QA 对的简洁性进行评分。 |
| `lang` | `str` | `"en"` | Prompt 语言。构造函数会创建 `KGQAConcisenessPrompt(lang)`。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "QA_pairs",
    output_key: str = "conciseness_scores"
):
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，并逐行取出 `input_key` 指定的列，重新组织成内部统一使用的 `{"QA_pairs": ...}` 结构。随后算子调用 `process_batch()` 对每一行进行评估：若单元格内容是字符串，会先尝试按 JSON 解析；若为空或解析失败，则该行输出空列表。对于有效 QA 对列表，算子会构造系统提示词和用户提示词，要求模型仅返回包含 `conciseness_scores` 的 JSON。最终结果会写回 `output_key` 指定的列。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将评估结果写回。 |
| `input_key` | `str` | `"QA_pairs"` | 输入 QA 对列名。每个单元格通常应为 `List[Dict]`，也可为 JSON 字符串。 |
| `output_key` | `str` | `"conciseness_scores"` | 输出评分列名，用于保存每个 QA 对对应的简洁性分数列表。 |

---

## 🤖 示例用法
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.general_kg.eval.kg_qa_concise_eval import (
    KGQAConcisenessEvaluator,
)


operator = KGQAConcisenessEvaluator(
    llm_serving=llm_serving,
    lang="en",
)
operator.run(
    storage=storage,
    input_key="QA_pairs",
    output_key="conciseness_scores",
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `QA_pairs` | `List[Dict]` / `str` | 输入 QA 问答对列表，或可被解析为列表的 JSON 字符串。 |
| `conciseness_scores` | `List[float]` | 与输入 QA 对按位置对齐的简洁性评分列表。 |

---

#### 示例输入
```json
[
  {
    "QA_pairs": [
      {"question": "What is the capital of France?", "answer": "Paris."},
      {"question": "Who invented the telephone?", "answer": "Alexander Graham Bell invented the telephone in 1876, and he was born in Edinburgh, Scotland, and later moved to Canada and the United States where he conducted most of his work."}
    ]
  }
]
```

#### 示例输出
```json
[
  {
    "QA_pairs": [
      {"question": "What is the capital of France?", "answer": "Paris."},
      {"question": "Who invented the telephone?", "answer": "Alexander Graham Bell invented the telephone in 1876, and he was born in Edinburgh, Scotland, and later moved to Canada and the United States where he conducted most of his work."}
    ],
    "conciseness_scores": [0.95, 0.32]
  }
]
```

---

#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/general_kg/eval/kg_qa_concise_eval.py`
- 默认 Prompt：`DataFlow-KG/dataflow/prompts/general_kg/rel_triple_eval.py`
- 下游过滤算子：`DataFlow-KG/dataflow/operators/general_kg/filter/kg_qa_concise_filtering.py`