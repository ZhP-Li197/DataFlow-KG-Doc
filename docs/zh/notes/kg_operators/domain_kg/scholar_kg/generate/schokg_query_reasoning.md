---
title: SchoKGQueryReasoningOperator
createTime: 2026/04/11 10:50:00
permalink: /zh/kg_operators/domain_kg/scholar_kg/generate/schokg_query_reasoning/
---

## 📚 概述
`SchoKGQueryReasoningOperator` 是一个用于学者知识图谱问答推理的生成类算子。
它会根据查询和学者图谱三元组自动搜索候选路径，再由大模型选择最能支撑回答的路径并生成最终回答。

这个算子的几个关键特点如下：

- 依赖 `LLMServingABC` 提供推理回答生成能力
- 默认使用 `SchoKGQueryReasoningPrompt`
- 默认读取 `query` 和 `triple`
- 默认输出 `reasoning_path` 与 `reasoning_answer`
- 候选路径先由代码搜索，再由模型做路径选择与摘要

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
| `max_hop` | `int` | `3` | 图搜索最大跳数。 |
| `max_candidate_paths` | `int` | `20` | 候选路径截断上限。 |
| `prompt_template` | `Any` | `None` | 自定义 Prompt 模板；为空时使用 `SchoKGQueryReasoningPrompt(lang=self.lang)`。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key_query: str = "query",
    input_key_triple: str = "triple",
    output_key_path: str = "reasoning_path",
    output_key_answer: str = "reasoning_answer",
):
    ...
```

`run` 会先读取 DataFrame，并验证输入输出列状态。随后算子会逐行解析三元组，构建无向图，并从查询中匹配相关实体。它会优先在前四个最相关实体之间寻找连接路径；如果没有找到路径，再退回到从前两个种子实体出发收集路径。得到候选路径后，算子会按与查询的词项重叠和路径长度进行排序，保留前 `max_candidate_paths` 条，再调用 Prompt 生成 `reasoning_path` 和 `reasoning_answer`。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow 数据存储对象。 |
| `input_key_query` | `str` | `"query"` | 输入查询列名。 |
| `input_key_triple` | `str` | `"triple"` | 输入三元组列名。 |
| `output_key_path` | `str` | `"reasoning_path"` | 输出推理路径列名。 |
| `output_key_answer` | `str` | `"reasoning_answer"` | 输出推理回答列名。 |

---

## 🤖 示例用法
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.scholar_kg.generate.schokg_query_reasoning import (
    SchoKGQueryReasoningOperator,
)

# Step 1: 假设 llm_serving 已按项目方式初始化

# Step 2: 准备输入数据
dataframe = pd.DataFrame(
    [
        {
            "query": "Which university is Geoffrey Hinton affiliated with?",
            "triple": [
                "<subj> Geoffrey Hinton <obj> University of Toronto <rel> affiliated_with",
                "<subj> Geoffrey Hinton <obj> deep learning <rel> studies"
            ]
        }
    ]
)

storage = DummyStorage()
storage.set_data(dataframe)

operator = SchoKGQueryReasoningOperator(
    llm_serving=llm_serving,
    lang="en",
)
operator.run(storage=storage)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `query` | `str` | 输入用户查询。 |
| `triple` | `List[str]` | 输入学者图谱三元组列表。 |
| `reasoning_path` | `List[str]` | 模型选中的推理路径列表。 |
| `reasoning_answer` | `str` | 基于路径生成的最终回答。 |

---

#### 示例输入
```json
[
  {
    "query": "Which university is Geoffrey Hinton affiliated with?",
    "triple": [
      "<subj> Geoffrey Hinton <obj> University of Toronto <rel> affiliated_with",
      "<subj> Geoffrey Hinton <obj> deep learning <rel> studies"
    ]
  }
]
```

#### 示例输出
```json
[
  {
    "query": "Which university is Geoffrey Hinton affiliated with?",
    "triple": [
      "<subj> Geoffrey Hinton <obj> University of Toronto <rel> affiliated_with",
      "<subj> Geoffrey Hinton <obj> deep learning <rel> studies"
    ],
    "reasoning_path": [
      "<subj> Geoffrey Hinton <obj> University of Toronto <rel> affiliated_with"
    ],
    "reasoning_answer": "Geoffrey Hinton is affiliated with the University of Toronto."
  }
]
```

---
#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/domain_kg/scholar_kg/generate/schokg_query_reasoning.py`
- 默认 Prompt：`DataFlow-KG/dataflow/prompts/diverse_kg/schokg.py`
- 相关算子：`DataFlow-KG/dataflow/operators/domain_kg/scholar_kg/generate/schokg_recommend.py`


