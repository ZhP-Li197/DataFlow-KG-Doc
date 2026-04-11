---
title: KGTripleMerger
createTime: 2026/04/11 12:00:00
permalink: /zh/kg_operators/general_kg/generate/kg_triple_merge/
---

## 📚 概述
`KGTripleMerger` 用于合并两个知识图谱或两个三元组集合。它支持关系三元组、属性三元组，以及二者混合的场景，并会结合实体对齐结果对第二个图谱中的实体进行映射。

当输入是关系三元组时，算子会按实体对建立关系集合并检测歧义；当输入是属性三元组时，会按实体和属性归并不同取值；当输入类型混合时，则直接做映射后的拼接。最终输出统一是一个字典，包含 `unambiguous` 和 `ambiguous` 两个键。

## ✒️ __init__ 函数
```python
def __init__(self):
    pass
```

这个算子没有初始化参数，所有行为都在 `run()` 中根据输入数据自动判断。

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key_kg1: str = "triples_kg1",
    input_key_kg2: str = "triples_kg2",
    input_key_alignment: str = "entity_alignment",
    output_key: str = "merged_triples"
) -> List[str]:
    ...
```

`run` 会从 DataFrame 第一行读取两个图谱的三元组列表和实体对齐结果，然后根据首个三元组的前缀判断输入类型是关系型还是属性型。若两边都是关系三元组，则调用 `_merge_relational_triples()`；若两边都是属性三元组，则调用 `_merge_attribute_triples()`；否则调用 `_merge_mixed_triples()`。合并结果会写入 `output_key` 指定列。

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | DataFrame 存储对象。 |
| `input_key_kg1` | `str` | `"triples_kg1"` | 第一个图谱三元组列名。 |
| `input_key_kg2` | `str` | `"triples_kg2"` | 第二个图谱三元组列名。 |
| `input_key_alignment` | `str` | `"entity_alignment"` | 实体对齐结果列名。 |
| `output_key` | `str` | `"merged_triples"` | 输出合并结果列名。 |

## 🤖 示例用法
```python
from dataflow.operators.general_kg.generate.kg_triple_merge import KGTripleMerger

operator = KGTripleMerger()
operator.run(
    storage=storage,
    input_key_kg1="triples_kg1",
    input_key_kg2="triples_kg2",
    input_key_alignment="entity_alignment",
    output_key="merged_triples",
)
```

默认输入输出格式如下：

| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `triples_kg1` | `List[str]` | 第一个图谱的三元组列表。 |
| `triples_kg2` | `List[str]` | 第二个图谱的三元组列表。 |
| `entity_alignment` | `List[Dict]` | 实体对齐结果，通常包含 `entity_kg1` 和 `entity_kg2`。 |
| `merged_triples` | `Dict[str, List[str]]` | 合并结果，包含 `unambiguous` 和 `ambiguous`。 |

示例输入：

```json
[
  {
    "triples_kg1": ["<subj> A <obj> B <rel> founded_by"],
    "triples_kg2": ["<subj> A2 <obj> B <rel> created_by"],
    "entity_alignment": [{"entity_kg1": "A", "entity_kg2": "A2"}]
  }
]
```

示例输出：

```json
[
  {
    "merged_triples": {
      "unambiguous": [],
      "ambiguous": ["<subj> A <obj> B <rel> created_by | founded_by"]
    }
  }
]
```

相关文件：

- 算子实现：`DataFlow-KG/dataflow/operators/general_kg/generate/kg_triple_merge.py`
