---
title: KGReasoningPathSearch
createTime: 2026/04/01 15:00:00
permalink: /zh/kg_operators/graph_reasoning/generate/reasoning_path_search/
---

## 📚 概述
`KGReasoningPathSearch` 是一个用于知识图谱多跳路径搜索的生成类算子。
它根据图谱三元组和目标实体对，搜索连接实体对的所有简单路径，并将结果按实体对分组写回 DataFrame，供后续关系推理等算子继续使用。

这个算子的几个关键特点如下：

- 不依赖 LLM，而是基于图搜索完成路径推理
- 使用无向图建图，因此一条三元组可双向参与路径搜索
- 默认输出列为 `mpath`
- 兼容两种目标实体输入格式：新的 `List[List[str]]` 格式和旧的字符串/列表兼容格式
- 路径结果按“实体对 -> 多条路径 -> 每条路径由多个三元组组成”的层级组织

---

## ✒️ __init__ 函数
```python
def __init__(self, max_hop: int = 10):
    ...
```

#### `__init__` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `max_hop` | `int` | `10` | 路径搜索的最大跳数。超过该跳数的路径不会继续扩展。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "triple",
    output_key: str = "mpath",
) -> List[str]:
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，检查必需列是否存在，然后逐行处理样本。对于每一行，算子会读取三元组列表并构建无向邻接表，再根据 `target_entity` 的格式决定如何解析目标实体对：如果是新的 `List[List[str]]` 格式，则逐个实体对搜索路径；如果是兼容旧格式的字符串或列表，则先展开所有目标实体，再枚举两两组合搜索路径。最终结果会以嵌套列表的形式写入 `output_key`。

内部搜索逻辑采用 BFS，枚举 `src` 到 `tgt` 的所有简单路径，每条路径保存为三元组字符串列表。只要一条路径到达目标节点且非空，就会被加入结果集。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将路径搜索结果写回。 |
| `input_key` | `str` | `"triple"` | 三元组输入列名。当前实现实际校验的是 `triplet` 列，因此若直接使用默认值，需确认数据列名与实现一致。 |
| `output_key` | `str` | `"mpath"` | 输出列名，用于保存多跳路径结果。 |

---

## 🤖 示例用法
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.graph_reasoning.generate.reasoning_path_search import (
    KGReasoningPathSearch,
)

operator = KGReasoningPathSearch(max_hop=3)
operator.run(
    storage=storage,
    input_key="triplet",
    output_key="mpath",
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `triplet` | `List[str]` | 输入知识图谱三元组列表。 |
| `target_entity` | `str` / `List[str]` / `List[List[str]]` | 目标实体输入。推荐使用 `List[List[str]]`，其中每个元素表示一个实体对。 |
| `mpath` | `List[List[List[str]]]` | 路径搜索结果。最外层按实体对分组，中间层是多条路径，内层是路径中的三元组序列。 |

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
    "mpath": [
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
- 算子实现：`DataFlow-KG/dataflow/operators/graph_reasoning/generate/reasoning_path_search.py`
- 下游关系生成算子：`DataFlow-KG/dataflow/operators/graph_reasoning/generate/reasoning_rel_generator.py`
- 存储实现：`DataFlow-KG/dataflow/utils/storage.py`

