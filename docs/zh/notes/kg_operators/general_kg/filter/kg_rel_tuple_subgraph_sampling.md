---
title: KGEntityBasedSubgraphSampling
createTime: 2026/04/10 15:40:44
permalink: /zh/kg_operators/general_kg/sample/kg_rel_tuple_subgraph_sampling/
---

## 📚 概述
`KGEntityBasedSubgraphSampling` 是一个用于从知识图谱中按实体采样子图的采样类算子。
它支持 BFS、随机游走（Random Walk）和基于跳数（Hop）三种采样策略，以图中各实体为起始点分别采样子图，并将每个实体的采样结果作为一行输出。

这个算子的几个关键特点如下：

- 无需实际调用 `LLMServingABC`（构造时需传入但不使用）
- 支持三种子图采样策略：`bfs`（广度优先）、`hop`（k-hop 邻域）、`rw`（随机游走）
- 默认对图中**所有实体**分别采样，每个实体生成一行输出；可通过 `start_entity` 指定实体列表
- 当 DataFrame 为多行时，自动合并所有行的三元组后统一处理；单行时直接使用该行数据
- 输出 DataFrame 行数等于采样的实体数量，与输入行数无关

---

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
| `llm_serving` | `LLMServingABC` | - | 接口兼容参数，算子内部不调用大模型，但构造时需传入。 |
| `seed` | `int` | `0` | 随机种子，用于随机游走策略中的邻居选择。 |
| `lang` | `str` | `"en"` | 语言设置，当前版本未影响实际处理逻辑。 |
| `num_q` | `int` | `5` | 预留参数，当前版本未在主流程中实际使用。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "triple",
    output_key: str = "subgraph",
    sampling_type: str = "hop",
    start_entity: Optional[str] = None,
    M: int = 5,
    hop: int = 2,
    num_walks: int = 5,
    walk_length: int = 3
):
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，按优先级确定输入列（`input_key` → `triple` → `tuple`），随后合并所有三元组。根据 `start_entity` 确定采样起点（为 `None` 时使用图中所有实体），对每个起点按 `sampling_type` 指定的策略采样子图。三种策略的说明如下：`bfs` 从起点出发进行广度优先扩展，最多采集 `M` 条三元组；`hop` 采集起点 `hop` 跳以内的所有三元组；`rw` 执行 `num_walks` 次、每次长度为 `walk_length` 的随机游走并收集沿途三元组。每个实体的采样结果作为新 DataFrame 的一行写出。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将采样结果写入新 DataFrame 后输出。 |
| `input_key` | `str` | `"triple"` | 输入三元组列名。同时兼容 `triple` 和 `tuple` 列名的回退逻辑。 |
| `output_key` | `str` | `"subgraph"` | 输出子图列名。每行存储该实体对应的采样三元组列表。 |
| `sampling_type` | `str` | `"hop"` | 采样策略，可选 `"bfs"`、`"hop"`、`"rw"` 三种。 |
| `start_entity` | `List[str]` / `None` | `None` | 采样起始实体列表。为 `None` 时使用图中所有实体。 |
| `M` | `int` | `5` | BFS 策略下最多采集的三元组数量上限。 |
| `hop` | `int` | `2` | Hop 策略下采集的跳数范围。 |
| `num_walks` | `int` | `5` | 随机游走策略下的游走次数。 |
| `walk_length` | `int` | `3` | 随机游走策略下每次游走的步长。 |

---

## 🤖 示例用法
```python
from dataflow.operators.general_kg.sample.kg_rel_tuple_subgraph_sampling import (
    KGEntityBasedSubgraphSampling,
)

operator = KGEntityBasedSubgraphSampling(
    llm_serving=llm_serving,
    seed=42,
)
operator.run(
    storage=storage,
    input_key="triple",
    output_key="subgraph",
    sampling_type="hop",
    hop=2,
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `subgraph` | `List[str]` | 该实体对应的采样子图三元组列表，每行对应一个起始实体。 |

---

#### 示例输入
```json
[
  {
    "triple": [
      "<subj> Alice <obj> Bob <rel> knows",
      "<subj> Bob <obj> Carol <rel> worksWith",
      "<subj> Carol <obj> Dave <rel> manages"
    ]
  }
]
```

#### 示例输出（`sampling_type="hop"`, `hop=1`, 以 Alice 为起点）
```json
[
  {
    "subgraph": [
      "<subj> Alice <obj> Bob <rel> knows"
    ]
  }
]
```

---

#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/general_kg/sample/kg_rel_tuple_subgraph_sampling.py`