---
title: KGQANaturalEvaluator
createTime: 2026/04/10 15:40:36
permalink: /zh/kg_operators/general_kg/eval/kg_qa_natural_eval/
---

## 📚 概述
`KGQANaturalEvaluator` 是一个用于评估知识图谱 QA 对自然流畅性的评估类算子。
它会读取每一行中的 QA 问答对列表，调用大模型对这些 QA 对的自然性进行打分，并将评分结果写回 DataFrame。

这个算子的几个关键特点如下：

- 依赖 `LLMServingABC` 提供大模型评估能力
- 默认使用 `KGQANaturalnessPrompt` 构造提示词
- 默认读取 `QA_pairs` 列，默认输出到 `naturalness_scores`
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
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象。算子通过 `generate_from_input` 对 QA 对的自然性进行评分。 |
| `lang` | `str` | `"en"` | Prompt 语言。构造函数会创建 `KGQANaturalnessPrompt(lang)`。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "QA_pairs",
    output_key: str = "naturalness_scores"
):
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，并逐行取出 `input_key` 指定的列，重新组织成内部统一使用的 `{"QA_pairs": ...}` 结构。随后算子调用 `process_batch()` 对每一行进行评估：若单元格内容是字符串，会先尝试按 JSON 解析；若为空或解析失败，则该行输出空列表。对于有效 QA 对列表，算子会构造系统提示词和用户提示词，要求模型仅返回包含 `naturalness_scores` 的 JSON。最终结果会写回 `output_key` 指定的列。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将评估结果写回。 |
| `input_key` | `str` | `"QA_pairs"` | 输入 QA 对列名。每个单元格通常应为 `List[Dict]`，也可为 JSON 字符串。 |
| `output_key` | `str` | `"naturalness_scores"` | 输出评分列名，用于保存每个 QA 对对应的自然性分数列表。 |

---

## 🤖 示例用法
```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.general_kg.eval.kg_qa_natural_eval import (
    KGQANaturalEvaluator,
)

operator = KGQANaturalEvaluator(
    llm_serving=llm_serving,
    lang="en",
)
operator.run(
    storage=storage,
    input_key="QA_pairs",
    output_key="naturalness_scores",
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `QA_pairs` | `List[Dict]` / `str` | 输入 QA 问答对列表，或可被解析为列表的 JSON 字符串。 |
| `naturalness_scores` | `List[float]` | 与输入 QA 对按位置对齐的自然性评分列表。 |

---

#### 示例输入
```json
[
  {
    "QA_pairs": [
      {"question": "Where does the sun rise?", "answer": "The sun rises in the east."},
      {"question": "Capital France what is?", "answer": "Paris is it."}
    ]
  }
]
```

#### 示例输出
```json
[
  {
    "QA_pairs": [
      {"question": "Where does the sun rise?", "answer": "The sun rises in the east."},
      {"question": "Capital France what is?", "answer": "Paris is it."}
    ],
    "naturalness_scores": [0.94, 0.21]
  }
]
```

---

#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/general_kg/eval/kg_qa_natural_eval.py`
- 默认 Prompt：`DataFlow-KG/dataflow/prompts/core_kg/rel_triple_eval.py`