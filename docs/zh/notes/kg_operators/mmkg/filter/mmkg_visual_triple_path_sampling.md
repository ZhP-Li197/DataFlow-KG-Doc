---
title: MMKGRelationTuplePathGenerator
createTime: 2026/04/07 09:00:00
permalink: /zh/kg_operators/mmkg/filter/mmkg_visual_triple_path_sampling/
---

## 📚 概述

`MMKGRelationTuplePathGenerator` 从关系三元组中枚举 `k` 跳路径，并把与路径中实体相关的视觉三元组和图片 URL 一起补齐。它要求输入三元组采用代码中实际解析的格式：`<subj> ... <obj> ... <rel> ...`。

当前实现最适合处理“整张图谱集中存放在一行”的输入。如果 `DataFrame` 有多行，算子会合并所有行里的 `triple` 或 `tuple`，但只读取第一行的 `vis_triple` 和 `img_dict` 来补视觉信息。

## ✒️ `__init__` 函数

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

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC \| None` | `None` | 预留参数，当前实现未直接使用 |
| `seed` | `int` | `0` | 预留随机种子，当前实现未直接参与路径枚举 |
| `lang` | `str` | `"en"` | 预留语言参数，当前实现未直接使用 |
| `k` | `int` | `2` | 需要枚举的路径跳数 |
| `max_paths_per_group` | `int` | `100` | 每组最多保留的路径数量 |

## 💡 `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "triple",
    output_key_meta: str = "hop_paths",
):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | 输入输出存储对象 |
| `input_key` | `str` | `"triple"` | 原始关系三元组列；如果该列不存在，代码会退回检查 `triple` 或 `tuple` |
| `output_key_meta` | `str` | `"hop_paths"` | 输出列基名，实际写入列名为 `f"{k}_{output_key_meta}"` |

算子会为每条路径单独生成一行结果，因此输出通常是“多行路径表”。函数返回值是 `[output_key_meta, "vis_triple", "vis_url"]`，但真正写入到表里的路径列名仍然是动态列，例如 `2_hop_paths`。

## 🤖 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.multi_model_kg.filter.mmkg_visual_triple_path_sampling import MMKGRelationTuplePathGenerator

storage = FileStorage(
    first_entry_file_name="mmkg_graph_input.json",
    cache_path="./cache",
    file_name_prefix="mmkg_path_sampling",
    cache_type="json",
).step()

op = MMKGRelationTuplePathGenerator(k=2, max_paths_per_group=20)
op.run(storage=storage, input_key="triple", output_key_meta="hop_paths")
```

输入示例：

```json
{
  "triple": [
    "<subj> Albert Einstein <obj> Nobel Prize in Physics <rel> won",
    "<subj> Nobel Prize in Physics <obj> 1921 <rel> awarded_in"
  ],
  "vis_triple": [
    "<subj> Albert Einstein <rel> depicted_in <obj> img_einstein"
  ],
  "img_dict": {
    "img_einstein": "./images/einstein.jpg"
  }
}
```

输出示例：

```json
{
  "2_hop_paths": "<subj> Albert Einstein <obj> Nobel Prize in Physics <rel> won || <subj> Nobel Prize in Physics <obj> 1921 <rel> awarded_in",
  "vis_triple": [
    "<subj> Albert Einstein <rel> depicted_in <obj> img_einstein"
  ],
  "vis_url": [
    "./images/einstein.jpg"
  ]
}
```
