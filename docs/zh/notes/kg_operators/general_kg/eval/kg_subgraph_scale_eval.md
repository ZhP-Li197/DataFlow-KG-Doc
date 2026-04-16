---
title: KGSubgraphScaleEvaluator
createTime: 2026/04/10 15:40:44
permalink: /zh/kg_operators/general_kg/eval/kg_subgraph_scale_eval/
---

## 📚 概述
`KGSubgraphScaleEvaluator` 是一个用于统计知识图谱子图结构规模指标的评估类算子。
它会读取每一行中的子图三元组列表，统计节点数、边数和图密度，并将结果写回 DataFrame。

这个算子的几个关键特点如下：

- 无需 `LLMServingABC`，是纯统计算子，不依赖大模型
- 通过正则表达式解析 `<subj> ... <obj> ... <rel> ...` 格式的三元组
- 密度计算公式为 `num_edges / (num_nodes × (num_nodes - 1))`，节点数不超过 1 时密度为 `0.0`
- 输入单元格必须为 Python 列表；非列表类型的行将输出零值回退
- 不要求输出列预先不存在，直接覆盖写入

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
    output_key1: str = "num_nodes",
    output_key2: str = "num_edges",
    output_key3: str = "density"
):
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，校验 `input_key` 列存在，随后逐行取出子图三元组列表。对每行的每条三元组，用正则表达式解析出主体和客体后统计唯一节点集合与边列表，再计算图密度，结果分别写入 `output_key1`、`output_key2`、`output_key3` 指定的列。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将统计结果写回。 |
| `input_key` | `str` | `"subgraph"` | 输入子图列名。每个单元格应为 `List[str]` 格式的三元组列表。 |
| `output_key1` | `str` | `"num_nodes"` | 节点数输出列名。 |
| `output_key2` | `str` | `"num_edges"` | 边数输出列名。 |
| `output_key3` | `str` | `"density"` | 图密度输出列名。 |

---

## 🤖 示例用法
```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.general_kg.eval.kg_subgraph_scale_eval import (
    KGSubgraphScaleEvaluator,
)

operator = KGSubgraphScaleEvaluator()
operator.run(
    storage=storage,
    input_key="subgraph",
    output_key1="num_nodes",
    output_key2="num_edges",
    output_key3="density",
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `subgraph` | `List[str]` | 输入子图三元组列表，格式为 `<subj> ... <obj> ... <rel> ...`。 |
| `num_nodes` | `int` | 子图中唯一实体（节点）的数量。 |
| `num_edges` | `int` | 子图中关系（边）的数量，允许重复边存在。 |
| `density` | `float` | 子图密度，衡量实际边数占最大可能边数的比例。节点数不超过 1 时为 `0.0`。 |

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
    "num_nodes": 3,
    "num_edges": 3,
    "density": 0.5
  }
]
```

---

#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/general_kg/eval/kg_subgraph_scale_eval.py`