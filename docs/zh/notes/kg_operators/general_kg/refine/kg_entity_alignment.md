---
title: KGGraphEntityAligner
createTime: 2026/04/10 19:00:00
permalink: /zh/kg_operators/core_kg/alignment/kg_entity_alignment/
---

## 📚 概述
`KGGraphEntityAligner` 是一个用于对齐两个独立知识图谱（KG）中实体的算子。
它接收两个图谱的三元组/元组字符串列表作为输入，通过提取其中的实体提及，并利用模糊字符串匹配（Fuzzy String Matching）算法计算相似度，从而找出并在两个图谱之间对齐相同的实体。

该算子的几个关键特点如下：

- **非大模型依赖**：与基于 LLM 的生成算子不同，它基于 `fuzzywuzzy` 库的 `fuzz.ratio` 进行本地字符串级相似度计算，执行速度快。
- **特定标签解析**：依赖于格式化的输入字符串，使用正则表达式提取带有 `<subj>`、`<obj>` 或 `<entity>` 标签的内容作为候选实体。
- **Top-K 与阈值过滤**：允许设置匹配的最低相似度阈值（`threshold`），并从保留的最多 `top_k` 个候选项中挑选最佳对齐结果。
- 默认分别读取 `triples_kg1` 和 `triples_kg2` 列，结果输出到 `entity_alignment` 列。

---

## ✒️ __init__ 函数
```python
def __init__(
    self,
    top_k: int = 5,
    threshold: int = 70
):
    ...
```

#### `__init__` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `top_k` | `int` | `5` | 为源图谱（KG1）中的每个实体保留的最大候选匹配数量，随后会从中选取相似度最高的一个。 |
| `threshold` | `int` | `70` | 最小相似度分数阈值（0-100）。只有模糊匹配分数大于等于该值的候选实体才会被考虑。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key_kg1: str = "triples_kg1",
    input_key_kg2: str = "triples_kg2",
    output_key: str = "entity_alignment"
):
    ...
```

`run` 函数从 `storage` 中读取 DataFrame（目前假定为单行数据），提取两个图谱的三元组列表。
运行流程分为三步：
1. **实体提取 (`_extract_entities`)**：使用正则 `r"<标签>\s*([^<]+)"` 遍历列表，从 `<subj>`、`<obj>`、`<entity>` 后提取出独立的实体集合。
2. **候选生成 (`_generate_candidates`)**：嵌套遍历两个图谱的实体集合，计算大小写不敏感的模糊匹配分数（如 `"APPLE"` 和 `"Apple Inc."`），过滤掉低于 `threshold` 的匹配，并保留前 `top_k` 个候选项。
3. **实体对齐 (`_align_entities`)**：在候选字典中，为 KG1 的每个实体选出分数最高的 KG2 实体，构建最终的对齐映射。
最终对齐结果会被包装为列表并写回 `output_key` 列。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow 数据存储对象。算子从中读取数据并写入对齐结果。 |
| `input_key_kg1` | `str` | `"triples_kg1"` | 第一个知识图谱（源图谱）的三元组字符串列表所在列名。 |
| `input_key_kg2` | `str` | `"triples_kg2"` | 第二个知识图谱（目标图谱）的三元组字符串列表所在列名。 |
| `output_key` | `str` | `"entity_alignment"` | 输出列名，用于保存实体对齐结果列表。 |

---

## 🤖 示例用法
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.core_kg.alignment.kg_entity_alignment import (
    KGGraphEntityAligner,
)

# 初始化算子，设置更高的阈值以保证对齐准确率
operator = KGGraphEntityAligner(
    top_k=3,
    threshold=85
)

operator.run(
    storage=storage,
    input_key_kg1="triples_kg1",
    input_key_kg2="triples_kg2",
    output_key="entity_alignment",
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `triples_kg1` | `List[str]` | KG1 的三元组/元组字符串列表，需包含 `<subj>`, `<obj>` 等标记。 |
| `triples_kg2` | `List[str]` | KG2 的三元组/元组字符串列表。 |
| `entity_alignment` | `List[Dict]` | 对齐结果列表，每个字典包含 `entity_kg1`, `entity_kg2` 和 `similarity`（分数）。 |

---

#### 示例输入
```json
[
  {
    "triples_kg1": [
      "<subj> Apple Inc. <rel> founded by <obj> Steve Jobs",
      "<entity> iPhone 15"
    ],
    "triples_kg2": [
      "<subj> Apple <rel> is headquartered in <obj> Cupertino",
      "<subj> Steven Paul Jobs <rel> died in <obj> 2011",
      "<entity> IPHONE 15"
    ]
  }
]
```

#### 示例输出
```json
[
  {
    "triples_kg1": [
      "<subj> Apple Inc. <rel> founded by <obj> Steve Jobs",
      "<entity> iPhone 15"
    ],
    "triples_kg2": [
      "<subj> Apple <rel> is headquartered in <obj> Cupertino",
      "<subj> Steven Paul Jobs <rel> died in <obj> 2011",
      "<entity> IPHONE 15"
    ],
    "entity_alignment": [
      {
        "entity_kg1": "Apple Inc.",
        "entity_kg2": "Apple",
        "similarity": 67
      },
      {
        "entity_kg1": "iPhone 15",
        "entity_kg2": "IPHONE 15",
        "similarity": 100
      }
    ]
  }
]
```
*(注：如果初始 `threshold` 设置为 70，则上述例子中的 `Apple Inc.` 与 `Apple`（相似度 67）将不会出现在最终对齐结果中，需视实际数据调整阈值)*

---

#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/core_kg/alignment/kg_entity_alignment.py`