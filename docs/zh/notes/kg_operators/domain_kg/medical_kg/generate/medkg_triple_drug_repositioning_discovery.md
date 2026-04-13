---
title: MedKGTripleDrugRepositioningDiscovery
createTime: 2026/04/11 10:20:00
permalink: /zh/kg_operators/domain_kg/medical_kg/generate/medkg_triple_drug_repositioning_discovery/
---

## 📚 概述
`MedKGTripleDrugRepositioningDiscovery` 是一个用于药物重定位路径发现与回答生成的生成类算子。
它会基于用户查询和医学三元组图谱先检索候选路径，再调用大模型挑选最能支持药物重定位判断的路径，并输出解释性回答。

这个算子的几个关键特点如下：

- 依赖 `LLMServingABC` 提供最终重定位解释生成能力
- 默认使用 `MedKGDrugRepositioningPrompt`
- 默认读取 `query` 与 `triple`
- 默认输出 `reposition_path` 与 `reposition_answer`
- 会优先保留包含常见医学关键关系的候选路径

---

## ✒️ __init__ 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    max_hop: int = 3,
    max_candidate_paths: int = 20,
    prompt_template=None,
):
    ...
```

#### `__init__` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象。 |
| `seed` | `int` | `0` | 用于初始化内部随机数生成器。 |
| `lang` | `str` | `"en"` | 默认 Prompt 语言。 |
| `max_hop` | `int` | `3` | 图搜索允许的最大跳数。 |
| `max_candidate_paths` | `int` | `20` | 候选路径保留上限。 |
| `prompt_template` | `Any` | `None` | 自定义 Prompt；为空时使用 `MedKGDrugRepositioningPrompt(lang=self.lang)`。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key_query: str = "query",
    input_key_triple: str = "triple",
    output_key_path: str = "reposition_path",
    output_key_answer: str = "reposition_answer",
):
    ...
```

`run` 会先读取 DataFrame，并检查查询列、三元组列及目标输出列。随后算子逐行构建无向图、从查询中匹配相关实体、并从最相关的前两个种子实体出发收集多跳路径。与药物作用机制算子不同，这里还会使用一组内置的 `preferred_relations` 对候选路径打分，使包含 `treats`、`binds`、`affects`、`indicates` 等关系的路径优先保留。最终保留下来的候选路径会被送入 Prompt，生成 `reposition_path` 和 `reposition_answer`。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow 数据存储对象。 |
| `input_key_query` | `str` | `"query"` | 用户查询列名。 |
| `input_key_triple` | `str` | `"triple"` | 输入三元组列名。 |
| `output_key_path` | `str` | `"reposition_path"` | 输出重定位路径列名。 |
| `output_key_answer` | `str` | `"reposition_answer"` | 输出重定位说明列名。 |

---

## 🤖 示例用法
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.medical_kg.generate.medkg_triple_drug_repositioning_discovery import (
    MedKGTripleDrugRepositioningDiscovery,
)

# Step 1: 假设 llm_serving 已按项目方式初始化

# Step 2: 准备输入数据
dataframe = pd.DataFrame(
    [
        {
            "query": "Can this kinase inhibitor be repurposed for lung cancer?",
            "triple": [
                "<subj> Gefitinib <obj> EGFR <rel> binds",
                "<subj> EGFR <obj> non-small cell lung cancer <rel> associates",
                "<subj> Gefitinib <obj> tumor growth <rel> affects"
            ]
        }
    ]
)

storage = DummyStorage()
storage.set_data(dataframe)

operator = MedKGTripleDrugRepositioningDiscovery(
    llm_serving=llm_serving,
    lang="en",
)
operator.run(
    storage=storage,
    input_key_query="query",
    input_key_triple="triple",
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `query` | `str` | 输入用户查询。 |
| `triple` | `List[str]` | 输入医学三元组列表。 |
| `reposition_path` | `List[str]` | 被模型选中的药物重定位支持路径。 |
| `reposition_answer` | `str` | 基于候选路径生成的重定位说明。 |

---

#### 示例输入
```json
[
  {
    "query": "Can this kinase inhibitor be repurposed for lung cancer?",
    "triple": [
      "<subj> Gefitinib <obj> EGFR <rel> binds",
      "<subj> EGFR <obj> non-small cell lung cancer <rel> associates",
      "<subj> Gefitinib <obj> tumor growth <rel> affects"
    ]
  }
]
```

#### 示例输出
```json
[
  {
    "query": "Can this kinase inhibitor be repurposed for lung cancer?",
    "triple": [
      "<subj> Gefitinib <obj> EGFR <rel> binds",
      "<subj> EGFR <obj> non-small cell lung cancer <rel> associates",
      "<subj> Gefitinib <obj> tumor growth <rel> affects"
    ],
    "reposition_path": [
      "<subj> Gefitinib <obj> EGFR <rel> binds || <subj> EGFR <obj> non-small cell lung cancer <rel> associates"
    ],
    "reposition_answer": "The candidate paths suggest Gefitinib may be repurposed for non-small cell lung cancer through EGFR-related evidence."
  }
]
```

---
#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/domain_kg/medical_kg/generate/medkg_triple_drug_repositioning_discovery.py`
- 默认 Prompt：`DataFlow-KG/dataflow/prompts/diverse_kg/medkg.py`
- 相关算子：`DataFlow-KG/dataflow/operators/domain_kg/medical_kg/generate/medkg_triple_drug_action_mechanism_discovery.py`


