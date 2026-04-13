---
title: KGReasoningPathLengthFilter
createTime: 2026/04/01 15:45:00
permalink: /zh/kg_operators/graph_reasoning/filter/reasoning_path_length_filtering/
---

## 📚 概述
`KGReasoningPathLengthFilter` 是一个用于知识图谱多跳路径长度过滤的过滤类算子。
它根据上游计算得到的路径长度信息，从 `mpath` 中筛选出长度位于指定区间内的路径，并将过滤结果写回 DataFrame。

这个算子的几个关键特点如下：

- 不依赖 LLM，而是基于已有路径长度做规则过滤
- 默认读取 `mpath` 和 `mpath_length` 两列
- 默认输出列为 `filtered_mpath`
- 保持原始“按实体对分组”的嵌套结构，只移除不符合长度范围的路径
- 长度区间由初始化时的 `min_length` 和 `max_length` 控制

---

## ✒️ `__init__` 函数
```python
def __init__(self, min_length: int = 1, max_length: int = 10):
    ...
```

#### `__init__` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `min_length` | `int` | `1` | 路径长度下界。只有长度不小于该值的路径才会被保留。 |
| `max_length` | `int` | `10` | 路径长度上界。只有长度不大于该值的路径才会被保留。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    mpath_key: str = "mpath",
    length_key: str = "mpath_length",
    output_path_key: str = "filtered_mpath",
) -> List[str]:
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，并检查 `mpath` 和 `mpath_length` 两列是否存在。随后逐行处理样本：对于每一行，算子会遍历每个实体对对应的路径集合，并根据同位置的长度列表筛选路径。只有长度落在 `[min_length, max_length]` 区间内的路径会被保留，过滤后的路径列表仍按原始实体对结构输出。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将过滤结果写回。 |
| `mpath_key` | `str` | `"mpath"` | 输入路径列名，通常来自上游路径搜索算子。 |
| `length_key` | `str` | `"mpath_length"` | 输入路径长度列名，通常来自上游路径长度评估算子。 |
| `output_path_key` | `str` | `"filtered_mpath"` | 输出列名，用于保存长度过滤后的路径结果。 |

---

## 🤖 示例用法
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.graph_reasoning.filter.reasoning_path_length_filtering import (
    KGReasoningPathLengthFilter,
)

operator = KGReasoningPathLengthFilter(min_length=2, max_length=2)
operator.run(
    storage=storage,
    mpath_key="mpath",
    length_key="mpath_length",
    output_path_key="filtered_mpath",
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `mpath` | `List[List[List[str]]]` | 输入多跳路径结果，按实体对分组。 |
| `mpath_length` | `List[List[int]]` | 与 `mpath` 对齐的路径长度结果。 |
| `filtered_mpath` | `List[List[List[str]]]` | 过滤后的路径结果，结构与 `mpath` 保持同级分组。 |

---

#### 示例输入
```json
[
  {
    "mpath": [
      [
        ["t1", "t2"],
        ["t1", "t2", "t3"]
      ]
    ],
    "mpath_length": [
      [2, 3]
    ]
  }
]
```

#### 示例输出
```json
[
  {
    "mpath": [
      [
        ["t1", "t2"],
        ["t1", "t2", "t3"]
      ]
    ],
    "mpath_length": [
      [2, 3]
    ],
    "filtered_mpath": [
      [
        ["t1", "t2"]
      ]
    ]
  }
]
```

---

#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/graph_reasoning/filter/reasoning_path_length_filtering.py`
- 上游评估算子：`DataFlow-KG/dataflow/operators/graph_reasoning/eval/reasoning_path_length_eval.py`
- 存储实现：`DataFlow-KG/dataflow/utils/storage.py`

