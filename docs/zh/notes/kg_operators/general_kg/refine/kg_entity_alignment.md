---
title: KGGraphEntityAligner
createTime: 2026/04/11 13:00:00
permalink: /zh/kg_operators/general_kg/refine/kg_entity_alignment/
---

## 📚 概述
`KGGraphEntityAligner` 用于对齐两个知识图谱中的实体。它会从两个图谱的三元组字符串中抽取实体名称，使用模糊字符串匹配生成候选对齐，并为 KG1 中的每个实体选择相似度最高的 KG2 实体作为结果。

这个算子不依赖大模型，而是使用 `fuzzywuzzy.fuzz.ratio` 做本地字符串相似度计算，因此适合图谱合并、实体归并等轻量级场景。默认读取 `triples_kg1` 和 `triples_kg2`，输出到 `entity_alignment`。

## ✒️ __init__ 函数
```python
def __init__(self, top_k: int = 5, threshold: int = 70):
    ...
```

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `top_k` | `int` | `5` | 为 KG1 中每个实体保留的最大候选数量。 |
| `threshold` | `int` | `70` | 最低相似度阈值，范围通常为 `0-100`。 |

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

`run` 会从 `storage` 中读取 DataFrame，并默认按单行任务处理。内部流程包括三步：先通过 `_extract_entities()` 从 `<subj>`、`<obj>`、`<entity>` 标签中抽取唯一实体；再用 `_generate_candidates()` 对两个图谱中的实体做两两模糊匹配，并筛选出高于 `threshold` 的前 `top_k` 个候选；最后由 `_align_entities()` 选出每个 KG1 实体的最佳匹配，并写回 `output_key`。

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | DataFrame 存储对象。 |
| `input_key_kg1` | `str` | `"triples_kg1"` | KG1 三元组列名。 |
| `input_key_kg2` | `str` | `"triples_kg2"` | KG2 三元组列名。 |
| `output_key` | `str` | `"entity_alignment"` | 输出实体对齐结果列名。 |

## 🤖 示例用法
```python
from dataflow.operators.general_kg.refinement.kg_entity_alignment import (
    KGGraphEntityAligner,
)

operator = KGGraphEntityAligner(
    top_k=3,
    threshold=85,
)

operator.run(
    storage=storage,
    input_key_kg1="triples_kg1",
    input_key_kg2="triples_kg2",
    output_key="entity_alignment",
)
```

默认输入输出格式如下：

| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `triples_kg1` | `List[str]` | KG1 三元组字符串列表。 |
| `triples_kg2` | `List[str]` | KG2 三元组字符串列表。 |
| `entity_alignment` | `List[Dict]` | 对齐结果，每项包含 `entity_kg1`、`entity_kg2` 和 `similarity`。 |

示例输入：

```json
[
  {
    "triples_kg1": [
      "<subj> Apple Inc. <rel> founded by <obj> Steve Jobs",
      "<entity> iPhone 15"
    ],
    "triples_kg2": [
      "<subj> Apple <rel> is headquartered in <obj> Cupertino",
      "<entity> IPHONE 15"
    ]
  }
]
```

示例输出：

```json
[
  {
    "entity_alignment": [
      {
        "entity_kg1": "iPhone 15",
        "entity_kg2": "IPHONE 15",
        "similarity": 100
      }
    ]
  }
]
```

相关文件：

- 算子实现：`DataFlow-KG/dataflow/operators/general_kg/refinement/kg_entity_alignment.py`
