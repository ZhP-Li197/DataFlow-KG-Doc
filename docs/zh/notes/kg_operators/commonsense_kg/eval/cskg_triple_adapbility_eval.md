---
title: CSKGTripleAdapbilityEvaluator
createTime: 2026/04/01 18:20:00
permalink: /zh/kg_operators/commonsense_kg/eval/cskg_triple_adapbility_eval/
---

## 📚 概述
`CSKGTripleAdapbilityEvaluator` 是一个用于常识知识图谱三元组适应性评估的评估类算子。
它会读取每一行中的三元组列表，调用大模型判断这些三元组是否更偏向可跨场景复用的通用常识，并将评分结果写回 DataFrame。

这个算子的几个关键特点如下：

- 依赖 `LLMServingABC` 提供大模型评估能力
- 默认使用 `CSKGTripleAdaptabilityPrompt` 构造提示词
- 默认读取 `triple` 列，默认输出到 `adaptability_scores`
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
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象。算子通过 `generate_from_input` 对三元组适应性进行评分。 |
| `lang` | `str` | `"en"` | Prompt 语言。构造函数会创建 `CSKGTripleAdaptabilityPrompt(lang)`。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "triple",
    output_key: str = "adaptability_scores"
):
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，并逐行取出 `input_key` 指定的列，重新组织成内部统一使用的 `{"triple": ...}` 结构。随后算子调用 `process_batch()` 对每一行进行评估：若单元格内容是字符串，会先尝试按 JSON 解析；若为空或解析失败，则该行输出空列表。对于有效三元组列表，算子会构造系统提示词和用户提示词，要求模型仅返回包含 `adaptability_scores` 的 JSON。最终结果会写回 `output_key` 指定的列。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将评估结果写回。 |
| `input_key` | `str` | `"triple"` | 输入三元组列名。每个单元格通常应为 `List[str]`，也可为 JSON 字符串。 |
| `output_key` | `str` | `"adaptability_scores"` | 输出评分列名，用于保存每个三元组对应的适应性分数列表。 |

---

## 🤖 示例用法
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.commonsense_kg.eval.cskg_triple_adapbility_eval import (
    CSKGTripleAdapbilityEvaluator,
)


operator = CSKGTripleAdapbilityEvaluator(
    llm_serving=llm_serving,
    lang="en",
)
operator.run(
    storage=storage,
    input_key="triple",
    output_key="adaptability_scores",
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `triple` | `List[str]` / `str` | 输入三元组列表，或可被解析为列表的 JSON 字符串。 |
| `adaptability_scores` | `List[float]` | 与输入三元组按位置对齐的适应性评分列表。 |

---

#### 示例输入
```json
[
  {
    "triple": [
      "<subj> bird <rel> CapableOf <obj> fly",
      "<subj> Tom <rel> visited <obj> museum yesterday"
    ]
  }
]
```

#### 示例输出
```json
[
  {
    "triple": [
      "<subj> bird <rel> CapableOf <obj> fly",
      "<subj> Tom <rel> visited <obj> museum yesterday"
    ],
    "adaptability_scores": [0.96, 0.18]
  }
]
```

---


#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/commonsense_kg/eval/cskg_triple_adapbility_eval.py`
- 默认 Prompt：`DataFlow-KG/dataflow/prompts/diverse_kg/cskg.py`
- 下游过滤算子：`DataFlow-KG/dataflow/operators/commonsense_kg/filter/cskg_triple_adapbility_filtering.py`


