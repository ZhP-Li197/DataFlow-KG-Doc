---
title: KGSubgraphConnectivityEvaluator
createTime: 2026/04/10 15:40:44
permalink: /zh/kg_operators/general_kg/eval/kg_subgraph_connectivity_eval/
---

## 📚 概述
`KGSubgraphConnectivityEvaluator` 是一个用于评估知识图谱子图连通性指标的评估类算子。
它会读取每一行中的子图三元组列表，构建无向图后分别计算点连通度、边连通度和全局效率，并将结果写回 DataFrame。

这个算子的几个关键特点如下：

- 无需 `LLMServingABC`，是纯图计算算子，不依赖大模型
- 使用 NetworkX 计算 `node_connectivity`、`edge_connectivity`、`global_efficiency` 三项连通性指标
- 三元组解析时忽略关系类型，仅关注实体间的连接结构
- 输入单元格必须为 Python 列表；非列表类型的行将输出零值回退
- 当节点数不超过 1 时，三项指标均回退为 `0` / `0.0`

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
    output_key1: str = "vertex_connectivity",
    output_key2: str = "edge_connectivity",
    output_key3: str = "global_efficiency"
):
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，校验 `input_key` 列存在，随后逐行取出子图三元组列表并构建无向图。对每个图分别调用 NetworkX 的 `node_connectivity`、`edge_connectivity`、`global_efficiency` 函数计算三项连通性指标，结果分别写入 `output_key1`、`output_key2`、`output_key3` 指定的列。若某项计算抛出异常，则该指标回退为 `0` / `0.0`。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将评估结果写回。 |
| `input_key` | `str` | `"subgraph"` | 输入子图列名。每个单元格应为 `List[str]` 格式的三元组列表。 |
| `output_key1` | `str` | `"vertex_connectivity"` | 点连通度输出列名。 |
| `output_key2` | `str` | `"edge_connectivity"` | 边连通度输出列名。 |
| `output_key3` | `str` | `"global_efficiency"` | 全局效率输出列名。 |

---

## 🤖 示例用法
```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.general_kg.eval.kg_subgraph_connectivity_eval import (
    KGSubgraphConnectivityEvaluator,
)

operator = KGSubgraphConnectivityEvaluator()
operator.run(
    storage=storage,
    input_key="subgraph",
    output_key1="vertex_connectivity",
    output_key2="edge_connectivity",
    output_key3="global_efficiency",
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `subgraph` | `List[str]` | 输入子图三元组列表，格式为 `<subj> ... <obj> ... <rel> ...`。 |
| `vertex_connectivity` | `int` | 点连通度，即至少需要删除多少个节点才能使图不连通。 |
| `edge_connectivity` | `int` | 边连通度，即至少需要删除多少条边才能使图不连通。 |
| `global_efficiency` | `float` | 全局效率，衡量图中节点间信息传播的平均效率，取值范围 `[0.0, 1.0]`。 |

---

#### 示例输入
```json
[
  {
    "subgraph": [
      "<subj> Henry <obj> Lucy <rel> is_inspired_by",
      "<subj> Lucy <obj> Tom <rel> collaborates_with",
      "<subj> Tom <obj> Henry <rel> mentors"
    ]
  }
]
```

#### 示例输出
```json
[
  {
    "subgraph": ["..."],
    "vertex_connectivity": 1,
    "edge_connectivity": 1,
    "global_efficiency": 0.8333
  }
]
```

---

#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/general_kg/eval/kg_subgraph_connectivity_eval.py`
- 依赖库：[NetworkX](https://networkx.org/)