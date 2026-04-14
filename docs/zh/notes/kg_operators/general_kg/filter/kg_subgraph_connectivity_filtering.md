---
title: KGSubgraphConnectivityFilter
createTime: 2026/04/10 15:40:44
permalink: /zh/kg_operators/general_kg/filter/kg_subgraph_connectivity_filtering/
---

## 📚 概述
`KGSubgraphConnectivityFilter` 是一个用于根据连通性得分筛选知识图谱子图的过滤类算子。
它会读取子图列和对应的连通性得分列，对整行进行阈值过滤，保留得分在指定范围内的行并写回 DataFrame。

这个算子的几个关键特点如下：

- 无需 `LLMServingABC`，是纯阈值过滤算子，不依赖大模型
- 过滤粒度为**行级别**：满足条件的行整体保留，不满足的行整体删除（而非逐元素过滤）
- 不新增输出列，直接将过滤后的 DataFrame 写回存储
- 通常配合 `KGSubgraphConnectivityEvaluator` 输出的 `vertex_connectivity`、`edge_connectivity`、`global_efficiency` 等列使用
- `output_key` 参数在本算子中指定**得分列名**（即用于过滤判断的列），而非新增列名

---

## ✒️ `__init__` 函数
```python
def __init__(self, merge_to_input: bool = False):
    ...
```

#### `__init__` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `merge_to_input` | `bool` | `False` | 预留参数，当前版本未在主流程中实际使用。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "subgraph",
    output_key: str = "density",
    min_score: float = 0.3,
    max_score: float = 1.0,
):
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，校验 `input_key` 和 `output_key`（得分列）均存在，随后对 `output_key` 列应用 `min_score ≤ score ≤ max_score` 的条件，过滤掉不满足条件的行，将保留行的完整 DataFrame 写回存储。

> 注意：`output_key` 在本算子中语义为**用于过滤判断的得分列名**，而非新增的输出列名。算子不新增任何列。实际使用时建议将 `output_key` 替换为 `KGSubgraphConnectivityEvaluator` 输出的具体连通性指标列名，如 `global_efficiency`。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将过滤后的行写回。 |
| `input_key` | `str` | `"subgraph"` | 子图列名，用于校验该列存在，不直接参与过滤逻辑。 |
| `output_key` | `str` | `"density"` | 用于过滤判断的连通性得分列名，建议传入 `KGSubgraphConnectivityEvaluator` 的输出列，如 `global_efficiency`、`vertex_connectivity`、`edge_connectivity`。 |
| `min_score` | `float` | `0.3` | 保留行的最低得分阈值（含）。 |
| `max_score` | `float` | `1.0` | 保留行的最高得分阈值（含）。 |

---

## 🤖 示例用法
```python
from dataflow.operators.general_kg.filter.kg_subgraph_connectivity_filtering import (
    KGSubgraphConnectivityFilter,
)

operator = KGSubgraphConnectivityFilter()
operator.run(
    storage=storage,
    input_key="subgraph",
    output_key="global_efficiency",
    min_score=0.5,
    max_score=1.0,
)
```

---

#### 默认输出格式

本算子不新增列，直接输出满足条件的行子集。

| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `subgraph` | `List[str]` | 保留行的子图三元组列表（原样保留）。 |
| `global_efficiency`（或其他连通性指标列） | `float` / `int` | 用于过滤判断的连通性得分（原样保留）。 |

---

#### 示例输入
```json
[
  {"subgraph": ["..."], "global_efficiency": 0.83},
  {"subgraph": ["..."], "global_efficiency": 0.20},
  {"subgraph": ["..."], "global_efficiency": 0.95}
]
```

#### 示例输出（`output_key="global_efficiency"`, `min_score=0.5`）
```json
[
  {"subgraph": ["..."], "global_efficiency": 0.83},
  {"subgraph": ["..."], "global_efficiency": 0.95}
]
```

---

#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/general_kg/filter/kg_subgraph_connectivity_filtering.py`
- 上游评估算子：`DataFlow-KG/dataflow/operators/general_kg/eval/kg_subgraph_connectivity_eval.py`