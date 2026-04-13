---
title: KGReasoningPathLengthEvaluator
createTime: 2026/04/01 16:20:00
permalink: /zh/kg_operators/graph_reasoning/eval/reasoning_path_length_eval/
---

## 📚 概述
`KGReasoningPathLengthEvaluator` 是一个用于知识图谱多跳路径长度评估的评估类算子。
它读取已有的多跳路径结果 `mpath`，计算每条路径包含的三元组数，并将长度结果按相同嵌套结构写回 DataFrame，常用于后续长度过滤或路径分析。

这个算子的几个关键特点如下：

- 不依赖 LLM，而是基于路径结构本身做本地统计
- 默认读取 `mpath` 列，默认输出到 `mpath_length`
- 输出结构与输入路径结构完全对齐
- 对非法路径项会回退为长度 `0`
- 对非法行级输入会为整行写入空列表 `[]`

---

## ✒️ __init__ 函数
```python
def __init__(self):
    ...
```

#### `__init__` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| - | - | - | 当前算子不需要额外初始化参数。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "mpath",
    output_key: str = "mpath_length",
) -> List[str]:
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，并检查 `input_key` 指定的路径列是否存在。随后逐行处理 `mpath`：对每一行中的每个实体对子组，算子会遍历其中的多条路径，并以路径中三元组的数量作为长度值，最终生成与原路径嵌套结构完全一致的长度结果。计算完成后，结果会写回到 `output_key` 指定的列中。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将长度评估结果写回。 |
| `input_key` | `str` | `"mpath"` | 输入路径列名。通常来自上游路径搜索算子。 |
| `output_key` | `str` | `"mpath_length"` | 输出列名，用于保存每条路径的长度。 |

---

## 🤖 示例用法
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.graph_reasoning.eval.reasoning_path_length_eval import (
    KGReasoningPathLengthEvaluator,
)

operator = KGReasoningPathLengthEvaluator()
operator.run(
    storage=storage,
    input_key="mpath",
    output_key="mpath_length",
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `mpath` | `List[List[List[str]]]` | 输入多跳路径结果，按实体对分组。 |
| `mpath_length` | `List[List[int]]` | 与 `mpath` 对齐的长度结果。每条路径被替换为对应的三元组数量。 |

---

#### 示例输入
```json
[
  {
    "mpath": [
      [
        [
          "<subj> Alice Smith <obj> Graph Neural Networks for Scientific Discovery <rel> author_of",
          "<subj> Graph Neural Networks for Scientific Discovery <obj> KDD 2024 <rel> published_at"
        ],
        [
          "<subj> Alice Smith <obj> Peking University <rel> affiliated_with",
          "<subj> Peking University <obj> Beijing <rel> located_in",
          "<subj> Beijing <obj> China <rel> part_of"
        ]
      ]
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
        [
          "<subj> Alice Smith <obj> Graph Neural Networks for Scientific Discovery <rel> author_of",
          "<subj> Graph Neural Networks for Scientific Discovery <obj> KDD 2024 <rel> published_at"
        ],
        [
          "<subj> Alice Smith <obj> Peking University <rel> affiliated_with",
          "<subj> Peking University <obj> Beijing <rel> located_in",
          "<subj> Beijing <obj> China <rel> part_of"
        ]
      ]
    ],
    "mpath_length": [
      [2, 3]
    ]
  }
]
```

---

#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/graph_reasoning/eval/reasoning_path_length_eval.py`
- 下游过滤算子：`DataFlow-KG/dataflow/operators/graph_reasoning/filter/reasoning_path_length_filtering.py`
- 存储实现：`DataFlow-KG/dataflow/utils/storage.py`
