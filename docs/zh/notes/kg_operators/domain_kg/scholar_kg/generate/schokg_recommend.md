---
title: SchoKGRecommendOperator
createTime: 2026/04/11 11:00:00
permalink: /zh/kg_operators/domain_kg/scholar_kg/generate/schokg_recommend/
---

## 📚 概述
`SchoKGRecommendOperator` 是一个用于学者知识图谱节点推荐的生成类算子。
它会根据用户查询、三元组和实体类型信息先筛出符合目标类型的候选节点及其支持路径，再调用大模型完成最终推荐与理由生成。

这个算子的几个关键特点如下：

- 依赖 `LLMServingABC` 提供推荐结果生成能力
- 默认使用 `SchoKGRecommendPrompt`
- 默认读取 `query`、`triple`、`entity_class`
- 默认输出 `recommended_node` 和 `recommendation_reason`
- 支持通过 `target_type` 指定希望推荐的节点类型

---

## ✒️ __init__ 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    max_hop: int = 3,
    max_candidate_nodes: int = 20,
    max_paths_per_node: int = 3,
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
| `max_candidate_nodes` | `int` | `20` | 候选节点数量上限。 |
| `max_paths_per_node` | `int` | `3` | 每个候选节点最多保留的支持路径数量。 |
| `prompt_template` | `Any` | `None` | 自定义 Prompt 模板；为空时使用 `SchoKGRecommendPrompt(lang=self.lang)`。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key_query: str = "query",
    input_key_triple: str = "triple",
    input_key_class: str = "entity_class",
    target_type: str = "Author",
    output_key_node: str = "recommended_node",
    output_key_reason: str = "recommendation_reason",
):
    ...
```

`run` 会先检查查询列、三元组列、实体类型列以及输出列。之后算子逐行构建图结构和实体类型映射，并从查询中匹配出最相关的实体节点。它会从前两个种子实体出发，搜索多跳路径，并只保留类型匹配 `target_type` 的候选节点。每个候选节点会聚合多条支持路径，随后按支持路径数量、与查询的词项重叠和最短跳数排序。最终，候选节点与支持路径会被送入 Prompt，生成推荐节点列表和推荐理由。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow 数据存储对象。 |
| `input_key_query` | `str` | `"query"` | 输入查询列名。 |
| `input_key_triple` | `str` | `"triple"` | 输入三元组列名。 |
| `input_key_class` | `str` | `"entity_class"` | 输入实体类型列名。该列通常应与三元组逐项对齐。 |
| `target_type` | `str` | `"Author"` | 候选节点的目标类型。 |
| `output_key_node` | `str` | `"recommended_node"` | 输出推荐节点列名。 |
| `output_key_reason` | `str` | `"recommendation_reason"` | 输出推荐理由列名。 |

---

## 🤖 示例用法
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.scholar_kg.generate.schokg_recommend import (
    SchoKGRecommendOperator,
)

# Step 1: 假设 llm_serving 已按项目方式初始化

# Step 2: 准备输入数据
dataframe = pd.DataFrame(
    [
        {
            "query": "Recommend an author working on graph neural networks.",
            "triple": [
                "<subj> Jure Leskovec <obj> graph neural networks <rel> studies",
                "<subj> Jure Leskovec <obj> Stanford University <rel> affiliated_with"
            ],
            "entity_class": [
                ["Author", "Topic"],
                ["Author", "University"]
            ]
        }
    ]
)

storage = DummyStorage()
storage.set_data(dataframe)

operator = SchoKGRecommendOperator(
    llm_serving=llm_serving,
    lang="en",
)
operator.run(
    storage=storage,
    target_type="Author",
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `query` | `str` | 输入用户查询。 |
| `triple` | `List[str]` | 输入学者图谱三元组列表。 |
| `entity_class` | `List[List[str]]` | 与三元组逐项对齐的实体类型列表。 |
| `recommended_node` | `List[str]` | 模型推荐的节点名称列表。 |
| `recommendation_reason` | `str` | 基于支持路径生成的推荐理由。 |

---

#### 示例输入
```json
[
  {
    "query": "Recommend an author working on graph neural networks.",
    "triple": [
      "<subj> Jure Leskovec <obj> graph neural networks <rel> studies",
      "<subj> Jure Leskovec <obj> Stanford University <rel> affiliated_with"
    ],
    "entity_class": [
      ["Author", "Topic"],
      ["Author", "University"]
    ]
  }
]
```

#### 示例输出
```json
[
  {
    "query": "Recommend an author working on graph neural networks.",
    "triple": [
      "<subj> Jure Leskovec <obj> graph neural networks <rel> studies",
      "<subj> Jure Leskovec <obj> Stanford University <rel> affiliated_with"
    ],
    "entity_class": [
      ["Author", "Topic"],
      ["Author", "University"]
    ],
    "recommended_node": ["Jure Leskovec"],
    "recommendation_reason": "Jure Leskovec is directly connected to graph neural networks in the candidate evidence and is therefore a strong recommendation."
  }
]
```

---
#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/domain_kg/scholar_kg/generate/schokg_recommend.py`
- 默认 Prompt：`DataFlow-KG/dataflow/prompts/diverse_kg/schokg.py`
- 相关算子：`DataFlow-KG/dataflow/operators/domain_kg/scholar_kg/generate/schokg_query_reasoning.py`


