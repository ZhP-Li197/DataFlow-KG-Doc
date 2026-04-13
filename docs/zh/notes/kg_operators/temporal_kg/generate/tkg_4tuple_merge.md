---
title: TKGTupleMerger
createTime: 2026/03/18 00:00:00
permalink: /zh/kg_operators/temporal_kg/generate/tkg_4tuple_merge/
---

## 📚 概述

[TKGTupleMerger](https://github.com/ZhP-Li197/DataFlow-KG/tree/main/dataflow/operators/temporal_kg/generate/tkg_4tuple_merge.py) 是一个将两个知识图谱的四元组进行合并的生成算子。它通过实体对齐信息将两个知识图谱的四元组合并为一个统一的知识图谱，同时支持关系四元组和属性四元组两种格式。合并过程中算子会自动检测四类歧义情况：关系冲突、时间冲突、属性值冲突和属性时间冲突。无歧义的四元组直接合并，有歧义的四元组则将冲突候选项拼接保留，供后续消歧算子处理。

## ✒️ `__init__`函数

```python
def __init__(self):
```

#### `init`参数说明

该算子无初始化参数。



## 💡 `run`函数

`run` 从 `storage` 中读取 DataFrame，从 `input_key_kg1` 和 `input_key_kg2` 指定的两列中提取四元组列表，从 `input_key_alignment` 指定列中提取实体对齐列表。算子自动判断输入是关系四元组还是属性四元组（通过检查第一条四元组是否以 `<subj>` 或 `<entity>` 开头），并调用对应的内部合并方法。最终将结果作为包含 `unambiguous` 和 `ambiguous` 两个键的字典写入 `output_key` 指定列的同一单元格中。函数返回包含 `output_key` 字符串的列表。

```python
def run(self, storage: DataFlowStorage = None, input_key_kg1: str = "triples_kg1", input_key_kg2: str = "triples_kg2", input_key_alignment: str = "entity_alignment", output_key: str = "merged_tuples"):
```

#### `参数`

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| **storage** | DataFlowStorage | None | 数据流存储实例，负责读取与写入数据。 |
| **input_key_kg1** | str | "triples_kg1" | 输入列名，对应第一个知识图谱的四元组列表。 |
| **input_key_kg2** | str | "triples_kg2" | 输入列名，对应第二个知识图谱的四元组列表。 |
| **input_key_alignment** | str | "entity_alignment" | 输入列名，对应实体对齐信息列表。 |
| **output_key** | str | "merged_tuples" | 输出列名，对应合并后的结果。 |

## 🤖 示例用法

```python
from dataflow.operators.temporal_kg.generate import TKGTupleMerger
from dataflow.utils.storage import FileStorage

storage = FileStorage(first_entry_file_name="tkg_merge.json")

merger = TKGTupleMerger()
merger.run(
    storage.step(),
    input_key_kg1="triples_kg1",
    input_key_kg2="triples_kg2",
    input_key_alignment="entity_alignment",
    output_key="merged_tuples",
)
```

#### 🧾 默认输出格式（Output Format）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| merged_tuples | Dict | 合并结果，包含 `unambiguous` 和 `ambiguous` 两个子字段。 |
| merged_tuples.unambiguous | List[str] | 无歧义的合并四元组列表。 |
| merged_tuples.ambiguous | List[str] | 有歧义的四元组，冲突候选用 `｜` 分隔。 |

**示例输入：**

```json
{
  "triples_kg1": [
    "<subj> Elon Musk <obj> SpaceX <rel> founded <time> 2002",
    "<subj> Elon Musk <obj> Tesla Motors <rel> took over as CEO <time> 2008",
    "<subj> SpaceX <obj> ISS <rel> first commercial spacecraft docking with <time> 2012"
  ],
  "triples_kg2": [
    "<subj> Elon Musk <obj> SpaceX <rel> established <time> 2002",
    "<subj> Elon Musk <obj> Tesla Motors <rel> took over as CEO <time> 2006",
    "<subj> Elon Musk <obj> Neuralink <rel> founded <time> 2016"
  ],
  "entity_alignment": [
    {"entity_kg1": "Elon Musk", "entity_kg2": "Elon Musk", "similarity": 100},
    {"entity_kg1": "SpaceX", "entity_kg2": "SpaceX", "similarity": 100},
    {"entity_kg1": "Tesla Motors", "entity_kg2": "Tesla Motors", "similarity": 100}
  ]
}
```

**示例输出：**

```json
{
  "merged_tuples": {
    "unambiguous": [
      "<subj> SpaceX <obj> ISS <rel> first commercial spacecraft docking with <time> 2012",
      "<subj> Elon Musk <obj> Neuralink <rel> founded <time> 2016"
    ],
    "ambiguous": [
      "<subj> Elon Musk <obj> SpaceX <rel> established <time> 2002 ｜ <subj> Elon Musk <obj> SpaceX <rel> founded <time> 2002",
      "<subj> Elon Musk <obj> Tesla Motors <rel> took over as CEO <time> 2006 ｜ <subj> Elon Musk <obj> Tesla Motors <rel> took over as CEO <time> 2008"
    ]
  }
}
```

---

#### 相关链接

- 算子实现：`DataFlow-KG/dataflow/operators/temporal_kg/generate/tkg_4tuple_merge.py`
- 下游算子：`DataFlow-KG/dataflow/operators/temporal_kg/refinement/tkg_4tuple_disambiguation.py`