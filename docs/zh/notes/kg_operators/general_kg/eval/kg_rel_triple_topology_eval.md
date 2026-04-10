---
title: KGRelationTripleTopologyEvaluator
createTime: 2026/04/10 15:40:44
permalink: /zh/kg_operators/general_kg/eval/kg_rel_triple_topology_eval/
---

## 📚 概述
`KGRelationTripleTopologyEvaluator` 是一个用于评估知识图谱拓扑结构特征的评估类算子。
它会读取每一行中的三元组列表，基于 NetworkX 构建无向图，并计算一系列图拓扑指标写回 DataFrame。

这个算子的几个关键特点如下：

- 无需 `LLMServingABC`，是纯图计算算子，不依赖大模型
- 使用 NetworkX 构建无向图并计算拓扑指标
- 一次运行同时输出 6 个指标列：`lcc_ratio`、`structure_avg_degree`、`fragmentation_score`、`num_components`、`node_count`、`edge_count`
- 支持输入单元格为 Python 列表，也支持输入为可反序列化的 JSON 字符串
- 当输入为空或解析失败时，输出退化值（节点数/边数为 0，碎片化得分为 1.0）

---

## ✒️ __init__ 函数
```python
def __init__(self):
    ...
```

#### `__init__` 参数说明

本算子无需任何构造参数，直接实例化即可。

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "triple"
):
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，逐行取出 `input_key` 指定的三元组列表，若为字符串则先尝试 JSON 解析。随后调用 `process_batch()` 对每一行构建无向图并计算拓扑指标：最大连通分量比例（`lcc_ratio`）、平均度数（`structure_avg_degree`）、碎片化分数（`fragmentation_score`）、连通分量数（`num_components`）、节点数（`node_count`）、边数（`edge_count`），共 6 列结果固定写回 DataFrame。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将评估结果写回。 |
| `input_key` | `str` | `"triple"` | 输入三元组列名。每个单元格应为 `List[str]`，也可为 JSON 字符串。 |

---

## 🤖 示例用法
```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.general_kg.eval.kg_rel_triple_topology_eval import (
    KGRelationTripleTopologyEvaluator,
)

operator = KGRelationTripleTopologyEvaluator()
operator.run(
    storage=storage,
    input_key="triple",
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `lcc_ratio` | `float` | 最大连通分量节点数占总节点数的比例，取值范围 `[0.0, 1.0]`。 |
| `structure_avg_degree` | `float` | 图的平均节点度数，计算公式为 `2 * edge_count / node_count`。 |
| `fragmentation_score` | `float` | 图的碎片化程度，计算公式为 `(num_components - 1) / (node_count - 1)`，取值范围 `[0.0, 1.0]`。 |
| `num_components` | `int` | 图中连通分量的数量。 |
| `node_count` | `int` | 图中节点（实体）的总数。 |
| `edge_count` | `int` | 图中边（关系）的总数。 |

---

#### 示例输入
```json
[
  {
    "triple": [
      "<subj> Alice <obj> Bob <rel> knows",
      "<subj> Bob <obj> Carol <rel> worksWith",
      "<subj> Dave <obj> Eve <rel> knows"
    ]
  }
]
```

#### 示例输出
```json
[
  {
    "triple": ["..."],
    "lcc_ratio": 0.6,
    "structure_avg_degree": 1.3333,
    "fragmentation_score": 0.25,
    "num_components": 2,
    "node_count": 5,
    "edge_count": 2
  }
]
```

---

#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/general_kg/eval/kg_rel_triple_topology_eval.py`
- 依赖库：[NetworkX](https://networkx.org/)