---
title: HRKGTripleCompletenessFilter
createTime: 2026/04/13 00:00:00
permalink: /zh/kg_operators/hyper_relation_kg/filter/hrkg_rel_triple_completeness_filtering/
---

## 📚 概述

[HRKGTripleCompletenessFilter](https://github.com/ZhP-Li197/DataFlow-KG/tree/main/dataflow/operators/hyper_relation_kg/filter/hrkg_rel_triple_completeness_filtering.py) 是一个基于完整性分数的超关系知识图谱三元组过滤算子。它过滤完整性分数在用户指定范围内的元组。算子按位置对齐三元组和分数，仅保留满足 `min_score <= score <= max_score` 的元组。过滤结果可通过参数写入新列或覆盖输入列，以便灵活集成到不同的流水线中。

## ✒️ `__init__`函数

```python
def __init__(self, merge_to_input: bool = False):
```

#### 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `merge_to_input` | `bool` | `False` | 如果为 `True`，过滤结果覆盖输入列；如果为 `False`，写入新的输出列。 |

#### Prompt 模板

此算子基于规则，不使用 LLM Prompt 模板。

## 💡 `run`函数

`run` 从 `storage` 读取 DataFrame，验证其同时包含 `input_key` 列和 `score_key` 列。然后遍历每一行，按位置对齐三元组列表和分数列表，仅保留满足 `min_score <= score <= max_score` 的元组。当 `merge_to_input=True` 时，过滤结果覆盖原始 `input_key` 列；否则写入 `output_key`。如果某行的三元组列或分数列不是列表，则该行写入空列表。函数返回包含受影响列名的列表。

```python
def run(self, storage: DataFlowStorage, input_key: str = "tuple", score_key: str = "completeness_scores", output_key: str = "filtered_tuple", min_score: float = 0.95, max_score: float = 1.0):
```

#### 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | 必填 | DataFlow 存储实例，负责数据读写。 |
| `input_key` | `str` | `"tuple"` | 输入列名，对应三元组列表字段。 |
| `score_key` | `str` | `"completeness_scores"` | 分数列名，对应对齐的分数列表字段。 |
| `output_key` | `str` | `"filtered_tuple"` | 输出列名，对应过滤后的三元组列表字段（当 `merge_to_input=False` 时使用）。 |
| `min_score` | `float` | `0.95` | 最低分数阈值（包含）。 |
| `max_score` | `float` | `1.0` | 最高分数阈值（包含）。 |

## 🤖 示例用法

```python
from dataflow.operators.hyper_relation_kg.filter import HRKGTripleCompletenessFilter
from dataflow.utils.storage import FileStorage

storage = FileStorage(first_entry_file_name="hrkg_completeness.json")

filter_op = HRKGTripleCompletenessFilter(merge_to_input=False)
filter_op.run(
    storage.step(),
    input_key="tuple",
    score_key="completeness_scores",
    output_key="filtered_tuple",
    min_score=0.95,
    max_score=1.0,
)
```

#### 🧾 默认输出格式（Output Format）

| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| **tuple** | **List[str]** | 输入的原始三元组列表（保留）。 |
| **completeness_scores** | **List[float]** | 每个元组对齐的完整性分数。 |
| **filtered_tuple** | **List[str]** | 过滤后的三元组列表，分数在指定范围内。 |

**示例输入：**

```json
{
  "tuple": [
    "<subj> Elon Musk <obj> Announcement <rel> MadeAt <Time> May 15, 2025 <Location> Tesla Gigafactory, Berlin, Germany",
    "<subj> Tesla Model Y <obj> 4680 Battery <rel> WillAdopt <Time> Third quarter of 2025 <Location> European market",
    "<subj> Tesla Model Y <obj> Cruising Range <rel> IncreasedTo <Value> 600 kilometers",
    "<subj> Tesla Model Y <obj> Price <rel> RemainsUnchanged <Value> 49,990 euros"
  ],
  "completeness_scores": [1.0, 0.9, 1.0, 0.95]
}
```

**示例输出（min_score=0.95, max_score=1.0）：**

```json
{
  "tuple": ["...(同上)"],
  "completeness_scores": [1.0, 0.9, 1.0, 0.95],
  "filtered_tuple": [
    "<subj> Elon Musk <obj> Announcement <rel> MadeAt <Time> May 15, 2025 <Location> Tesla Gigafactory, Berlin, Germany",
    "<subj> Tesla Model Y <obj> Cruising Range <rel> IncreasedTo <Value> 600 kilometers",
    "<subj> Tesla Model Y <obj> Price <rel> RemainsUnchanged <Value> 49,990 euros"
  ]
}
```

---

#### 相关链接

- 算子实现：`DataFlow-KG/dataflow/operators/hyper_relation_kg/filter/hrkg_rel_triple_completeness_filtering.py`
- 上游算子：`DataFlow-KG/dataflow/operators/hyper_relation_kg/eval/hrkg_rel_triple_consistency_eval.py`
