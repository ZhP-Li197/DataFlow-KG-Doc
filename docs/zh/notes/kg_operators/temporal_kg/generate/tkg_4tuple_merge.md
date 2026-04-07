---
title: TKGTupleMerger
createTime: 2026/04/07 09:00:00
permalink: /zh/kg_operators/temporal_kg/generate/tkg_4tuple_merge/
---

#### 📚 概述

`TKGTupleMerger` 用于合并两个时序图谱的四元组集合，并把结果拆分为 `unambiguous` 和 `ambiguous` 两部分。它既支持关系四元组，也支持属性四元组；如果 `entity_alignment` 给出了实体对齐关系，还会先把 KG2 的实体映射到 KG1 再合并。

#### 📚 `__init__` 函数

```python
def __init__(self):
    ...
```

该算子没有额外初始化参数，适合直接实例化后使用。

#### 💡 `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key_kg1: str = "triples_kg1",
    input_key_kg2: str = "triples_kg2",
    input_key_alignment: str = "entity_alignment",
    output_key: str = "merged_quads"
):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | 输入输出存储对象 |
| `input_key_kg1` | `str` | `"triples_kg1"` | 第一个图谱的四元组列 |
| `input_key_kg2` | `str` | `"triples_kg2"` | 第二个图谱的四元组列 |
| `input_key_alignment` | `str` | `"entity_alignment"` | 实体对齐结果列 |
| `output_key` | `str` | `"merged_quads"` | 合并结果列 |

输出列的值是一个字典，通常形如 `{"unambiguous": [...], "ambiguous": [...]}`。`ambiguous` 中多个候选四元组会用全角分隔符 `锝?` 连接。

#### 🤖 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.temporal_kg.generate.tkg_4tuple_merge import TKGTupleMerger

storage = FileStorage(
    first_entry_file_name="dataflow/data_for_operator_testing/tkg_merge.json",
    cache_path="./cache",
    file_name_prefix="tkg_merge",
    cache_type="json",
).step()

op = TKGTupleMerger()
op.run(
    storage=storage,
    input_key_kg1="triples_kg1",
    input_key_kg2="triples_kg2",
    input_key_alignment="entity_alignment",
    output_key="merged_quads"
)
```

输入示例：

```json
{
  "triples_kg1": [
    "<subj> E1 <obj> E2 <rel> relA <time> 2026-03-01"
  ],
  "triples_kg2": [
    "<subj> E1 <obj> E2 <rel> relB <time> 2026-03-01"
  ],
  "entity_alignment": [
    {"entity_kg1": "E1", "entity_kg2": "E1"},
    {"entity_kg1": "E2", "entity_kg2": "E2"}
  ]
}
```

输出示例：

```json
{
  "merged_quads": {
    "unambiguous": [],
    "ambiguous": [
      "<subj> E1 <obj> E2 <rel> relA <time> 2026-03-01 锝?<subj> E1 <obj> E2 <rel> relB <time> 2026-03-01"
    ]
  }
}
```
