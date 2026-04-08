---
title: KGReasoningConstrainedPathSearch
createTime: 2026/04/01 15:10:00
permalink: /zh/kg_operators/graph_reasoning/generate/reasoning_constrained_path_search/
---

## 📚 概述
`KGReasoningConstrainedPathSearch` 是一个用于知识图谱约束路径搜索的生成类算子。
它在普通多跳路径搜索的基础上，增加了必经实体、允许关系、实体类型等约束条件，只保留满足约束的路径结果，适合更精细的图推理场景。

这个算子的几个关键特点如下：

- 不依赖 LLM 完成主流程，核心是带约束的图搜索
- 支持通过 `must_pass_entities`、`allowed_relations`、`required_entity_types` 等参数限制路径
- 默认输出列为 `cons_mpath`
- 兼容新的 `List[List[str]]` 目标实体格式和旧的字符串/列表兼容格式
- 当前实现构建的是有向图，不像 `KGReasoningPathSearch` 那样做双向扩展

---

## ✒️ __init__ 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC = None,
    max_hop: int = 3,
    must_pass_entities: List[str] = None,
    allowed_relations: List[str] = None,
    required_entity_types: List[str] = None,
    entity_type_map: Dict[str, str] = None,
):
    ...
```

#### `__init__` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | `None` | 预留的大模型服务参数。当前实现没有使用该参数参与路径搜索。 |
| `max_hop` | `int` | `3` | 路径搜索的最大跳数。超过该跳数的路径不会继续扩展。 |
| `must_pass_entities` | `List[str]` | `None` | 路径必须经过的实体集合。若设置后，只有包含这些实体的路径才会保留。 |
| `allowed_relations` | `List[str]` | `None` | 允许参与建图和搜索的关系集合。若设置后，其他关系对应的三元组会在建图阶段被过滤掉。 |
| `required_entity_types` | `List[str]` | `None` | 路径中至少要出现一种指定实体类型。 |
| `entity_type_map` | `Dict[str, str]` | `None` | 实体到类型的映射表，用于配合 `required_entity_types` 做约束检查。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage,
    triplet_key: str = "triplet",
    target_key: str = "target_entity",
    output_key: str = "cons_mpath",
):
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，然后逐行读取三元组与目标实体。对于每一行，算子先基于 `triplet_key` 构建图，再根据 `target_entity` 的格式决定如何解析实体对：若为新的 `List[List[str]]` 格式，则逐个实体对做搜索；若为兼容旧格式的字符串或列表，则先展开目标实体，再枚举两两组合。路径搜索通过 DFS 完成，只有同时满足跳数限制和约束条件的路径才会被保留。

约束检查发生在找到一条候选路径之后：如果设置了 `must_pass_entities`，则路径必须覆盖这些实体；如果设置了 `required_entity_types`，则路径上的实体类型集合必须与要求的类型集合有交集。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将带约束的路径搜索结果写回。 |
| `triplet_key` | `str` | `"triplet"` | 输入三元组列名。 |
| `target_key` | `str` | `"target_entity"` | 输入目标实体列名。 |
| `output_key` | `str` | `"cons_mpath"` | 输出列名，用于保存满足约束的多跳路径结果。 |

---

## 🤖 示例用法
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.graph_reasoning.generate.reasoning_constrained_path_search import (
    KGReasoningConstrainedPathSearch,
)

operator = KGReasoningConstrainedPathSearch(
    max_hop=3,
    must_pass_entities=["Maria Rodriguez"],
)
operator.run(
    storage=storage,
    triplet_key="triplet",
    target_key="target_entity",
    output_key="cons_mpath",
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `triplet` | `List[str]` | 输入知识图谱三元组列表。 |
| `target_entity` | `str` / `List[str]` / `List[List[str]]` | 目标实体输入。推荐使用 `List[List[str]]` 表示实体对。 |
| `cons_mpath` | `List[List[List[str]]]` | 满足约束条件的路径结果。最外层按实体对分组，中间层是多条路径，内层是路径中的三元组序列。 |

---

#### 示例输入
```json
[
  {
    "triplet": [
      "<subj> Henry <obj> Maria Rodriguez <rel> is_trained_by",
      "<subj> Maria Rodriguez <obj> Berlin <rel> lives_in"
    ],
    "target_entity": [["Henry, Berlin"]]
  }
]
```

#### 示例输出
```json
[
  {
    "triplet": [
      "<subj> Henry <obj> Maria Rodriguez <rel> is_trained_by",
      "<subj> Maria Rodriguez <obj> Berlin <rel> lives_in"
    ],
    "target_entity": [["Henry, Berlin"]],
    "cons_mpath": [
      [
        [
          "<subj> Henry <obj> Maria Rodriguez <rel> is_trained_by",
          "<subj> Maria Rodriguez <obj> Berlin <rel> lives_in"
        ]
      ]
    ]
  }
]
```

---

#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/graph_reasoning/generate/reasoning_constrained_path_search.py`
- 相关基础路径搜索算子：`DataFlow-KG/dataflow/operators/graph_reasoning/generate/reasoning_path_search.py`
- 存储实现：`DataFlow-KG/dataflow/utils/storage.py`

