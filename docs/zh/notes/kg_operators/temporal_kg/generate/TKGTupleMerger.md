---
title: TKGTupleMerger
createTime: 2026/03/18 00:00:00
icon: material-symbols-light:bolt
permalink: /zh/api/operators/temporal_kg/generate/tkgtuplemerger/
---

## 📚 概述

[TKGTupleMerger](https://github.com/ZhP-Li197/DataFlow-KG/tree/main/dataflow/operators/temporal_kg/generate/tkg_4tuple_merge.py) 是一个将两个知识图谱的四元组进行合并的生成算子。它通过实体对齐信息将两个知识图谱的四元组合并为一个统一的知识图谱，同时支持关系四元组和属性四元组两种格式。合并过程中算子会自动检测四类歧义情况：关系冲突、时间冲突、属性值冲突和属性时间冲突。无歧义的四元组直接合并，有歧义的四元组则将冲突候选项拼接保留，供后续消歧算子处理。

## ✒️ `__init__`函数

```python
def __init__(self):
```

### `init`参数说明

该算子无初始化参数。

### Prompt模板说明

| Prompt 模板名称 | 主要用途 | 适用场景 | 特点说明 |
| --- | --- | --- | --- |

## 💡 `run`函数

```python
def run(self, storage: DataFlowStorage = None, input_key_kg1: str = "triples_kg1", input_key_kg2: str = "triples_kg2", input_key_alignment: str = "entity_alignment", output_key: str = "merged_quads"):
```

#### `参数`

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| **storage** | DataFlowStorage | None | 数据流存储实例，负责读取与写入数据。 |
| **input_key_kg1** | str | "triples_kg1" | 输入列名，对应第一个知识图谱的四元组列表。 |
| **input_key_kg2** | str | "triples_kg2" | 输入列名，对应第二个知识图谱的四元组列表。 |
| **input_key_alignment** | str | "entity_alignment" | 输入列名，对应实体对齐信息列表。 |
| **output_key** | str | "merged_quads" | 输出列名，对应合并后的结果。 |

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
    output_key="merged_quads",
)
```

#### 🧾 默认输出格式（Output Format）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| merged_quads | Dict | 合并结果，包含 `unambiguous` 和 `ambiguous` 两个子字段。 |
| merged_quads.unambiguous | List[str] | 无歧义的合并四元组列表。 |
| merged_quads.ambiguous | List[str] | 有歧义的四元组，冲突候选用 `｜` 分隔。 |

**示例输入：**

```json
{
  "triples_kg1": [
    "<subj> Elon Musk <obj> SpaceX <rel> founded &lt;time&gt; 2002",
    "<subj> Elon Musk <obj> Tesla Motors <rel> took over as CEO &lt;time&gt; 2008",
    "<subj> SpaceX <obj> ISS <rel> first commercial spacecraft docking with &lt;time&gt; 2012"
  ],
  "triples_kg2": [
    "<subj> Elon Musk <obj> SpaceX <rel> established &lt;time&gt; 2002",
    "<subj> Elon Musk <obj> Tesla Motors <rel> took over as CEO &lt;time&gt; 2006",
    "<subj> Elon Musk <obj> Neuralink <rel> founded &lt;time&gt; 2016"
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
  "merged_quads": {
    "unambiguous": [
      "<subj> SpaceX <obj> ISS <rel> first commercial spacecraft docking with &lt;time&gt; 2012",
      "<subj> Elon Musk <obj> Neuralink <rel> founded &lt;time&gt; 2016"
    ],
    "ambiguous": [
      "<subj> Elon Musk <obj> SpaceX <rel> established &lt;time&gt; 2002 ｜ <subj> Elon Musk <obj> SpaceX <rel> founded &lt;time&gt; 2002",
      "<subj> Elon Musk <obj> Tesla Motors <rel> took over as CEO &lt;time&gt; 2006 ｜ <subj> Elon Musk <obj> Tesla Motors <rel> took over as CEO &lt;time&gt; 2008"
    ]
  }
}
```