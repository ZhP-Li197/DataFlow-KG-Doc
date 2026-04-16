---
title: CSKGTripleConceptGeneralization
createTime: 2026/04/01 17:35:00
permalink: /zh/kg_operators/commonsense_kg/refine/cskg_triple_concept_generalization/
---

## 📚 概述
`CSKGTripleConceptGeneralization` 是一个用于常识三元组概念泛化的优化类算子。
它读取已有三元组，调用大模型将更具体的常识三元组泛化为更抽象、更通用的概念级三元组，并将泛化结果写回 DataFrame，适合用于知识归纳、概念抽象和泛化能力增强场景。

这个算子的几个关键特点如下：

- 依赖 `LLMServingABC` 提供概念泛化能力
- 默认使用 `CSKGConceptGeneralizationPrompt` 构造提示词
- 默认读取 `triple` 列，默认输出到 `gen_triple`
- 不再做文本质量筛选，而是直接对已有三元组列表调用模型
- 当前实现内部固定使用默认 Prompt，不暴露 `prompt_template` 参数

## ✒️ `__init__` 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    num_q: int = 5
):
    ...
```

#### `__init__` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象。算子通过 `generate_from_input` 执行概念泛化。 |
| `seed` | `int` | `0` | 用于初始化内部随机数生成器。当前主流程中未进一步使用随机行为。 |
| `lang` | `str` | `"en"` | Prompt 语言。算子会初始化 `CSKGConceptGeneralizationPrompt(lang=lang)`。 |
| `num_q` | `int` | `5` | 预留参数。当前实现中仅保存为实例属性，未参与泛化逻辑。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "triple",
    output_key: str = "gen_triple"
):
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，检查输入列是否存在以及输出列是否会与现有列冲突。随后算子会把输入三元组列表交给内部批处理逻辑：每一行的三元组会通过 `CSKGConceptGeneralizationPrompt` 生成提示词，送入大模型做概念泛化。模型响应会被解析为 JSON，并提取 `gen_triple` 字段，最终结果写回到 `output_key` 指定的列中。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将泛化结果写回。 |
| `input_key` | `str` | `"triple"` | 输入三元组列名。 |
| `output_key` | `str` | `"gen_triple"` | 输出列名，用于保存概念泛化后的三元组结果。 |

---

## 🤖 示例用法
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.commonsense_kg.refine.cskg_triple_concept_generalization import (
    CSKGTripleConceptGeneralization,
)


operator = CSKGTripleConceptGeneralization(
    llm_serving=llm_serving,
    lang="en",
)
operator.run(
    storage=storage,
    input_key="triple",
    output_key="gen_triple",
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `triple` | `list` | 输入三元组列表。 |
| `gen_triple` | `list` | 概念泛化后的三元组列表。若模型解析失败，则为 `[]`。 |

---

#### 示例输入
```json
[
  {
    "triple": [
      "<subj> Tom <obj> umbrella <rel> uses"
    ]
  }
]
```

#### 示例输出
```json
[
  {
    "triple": [
      "<subj> Tom <obj> umbrella <rel> uses"
    ],
    "gen_triple": [
      "<subj> person <obj> protective_item <rel> uses"
    ]
  }
]
```

---

#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/commonsense_kg/refine/cskg_triple_concept_generalization.py`
- 默认 Prompt：`DataFlow-KG/dataflow/prompts/diverse_kg/cskg.py`
- 上游三元组抽取算子：`DataFlow-KG/dataflow/operators/commonsense_kg/generate/cskg_triple_extractor.py`


