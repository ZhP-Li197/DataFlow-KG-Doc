---
title: KGRelationTuplePathGenerator
createTime: 2026/04/10 15:40:44
permalink: /zh/kg_operators/general_kg/sample/kg_rel_tuple_path_sampling/
---

## 📚 概述
`KGRelationTuplePathGenerator` 是一个用于从关系三元组中生成无向 k-hop 路径的采样类算子。
它会将输入三元组构建为无向图，通过 DFS 枚举长度为 k 的路径，并对路径进行去重后输出。

这个算子的几个关键特点如下：

- 无需 `LLMServingABC`，是纯图路径枚举算子，不依赖大模型
- 路径枚举忽略边方向，基于无向图进行 DFS，通过方向无关的规范化形式去重
- 支持通过 `max_paths_per_group` 限制每组最大路径数量
- 当 DataFrame 为多行时，自动合并所有行的三元组后统一处理；单行时直接使用该行数据
- 输出不保持原 DataFrame 的行结构，而是每条路径作为新的一行输出
- 输出列名由 `k` 和 `output_key_meta` 动态拼接，如 `k=2` 时输出列为 `2_hop_paths`

---

## ✒️ __init__ 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC = None,
    seed: int = 0,
    lang: str = "en",
    k: int = 2,
    max_paths_per_group: int = 100,
):
    ...
```

#### `__init__` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | `None` | 本算子不使用大模型，该参数仅为兼容接口预留，传入后不生效。 |
| `seed` | `int` | `0` | 随机种子，用于初始化内部随机数生成器。 |
| `lang` | `str` | `"en"` | 语言设置，当前版本未影响实际处理逻辑。 |
| `k` | `int` | `2` | 路径跳数。算子枚举长度恰好为 `k` 条边的路径。 |
| `max_paths_per_group` | `int` | `100` | 每组最多输出的路径数量上限。超出后截断。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "triple",
    output_key_meta: str = "hop_paths",
):
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，按优先级确定输入列（`input_key` → `triple` → `tuple`）。随后根据 DataFrame 行数决定处理方式：单行时直接使用，多行时合并所有三元组后统一处理。算子将合并后的三元组构建为无向图，对每个起始节点执行 DFS 枚举长度为 `k` 的路径，路径以 `||` 分隔的原始三元组字符串表示，并通过规范化去重。最终每条路径作为新 DataFrame 的一行写出，输出列名为 `{k}_{output_key_meta}`（如 `2_hop_paths`）。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将路径结果写入新 DataFrame 后输出。 |
| `input_key` | `str` | `"triple"` | 输入三元组列名。同时兼容 `triple` 和 `tuple` 列名的回退逻辑。 |
| `output_key_meta` | `str` | `"hop_paths"` | 输出列名后缀。实际输出列名为 `{k}_{output_key_meta}`，如 `2_hop_paths`。 |

---

## 🤖 示例用法
```python
from dataflow.operators.general_kg.sample.kg_rel_tuple_path_sampling import (
    KGRelationTuplePathGenerator,
)

operator = KGRelationTuplePathGenerator(
    seed=42,
    k=2,
    max_paths_per_group=200,
)
operator.run(
    storage=storage,
    input_key="triple",
    output_key_meta="hop_paths",
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `{k}_hop_paths` | `str` | 每行为一条 k-hop 路径，由路径上各边的原始三元组字符串以 ` \|\| ` 连接组成。 |

---

#### 示例输入
```json
[
  {
    "triple": [
      "<subj> Henry <obj> Maria <rel> is_trained_by",
      "<subj> Maria <obj> Jazz <rel> specializes_in",
      "<subj> Henry <obj> Pop <rel> specializes_in"
    ]
  }
]
```

#### 示例输出（`k=2`）
```json
[
  {"2_hop_paths": "<subj> Henry <obj> Maria <rel> is_trained_by || <subj> Maria <obj> Jazz <rel> specializes_in"},
  {"2_hop_paths": "<subj> Henry <obj> Maria <rel> is_trained_by || <subj> Henry <obj> Pop <rel> specializes_in"}
]
```

---

#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/general_kg/sample/kg_rel_tuple_path_sampling.py`