---
title: MMKGRelationTuplePathGenerator
createTime: 2026/04/07 09:00:00
permalink: /zh/kg_operators/mmkg/filter/mmkg_visual_triple_path_sampling/
---

#### 📚 概述

`MMKGRelationTuplePathGenerator` 从关系三元组中枚举 `k` 跳路径，并为每条路径补齐相关视觉三元组和图片 URL。输出 DataFrame 通常包含 `2_hop_paths`、`vis_triple` 和 `vis_url` 三列。

#### 📚 `__init__` 函数

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
| `llm_serving` | `LLMServingABC` | `None` | 当前实现中未使用，保留给后续扩展 |
| `seed` | `int` | `0` | 随机种子 |
| `lang` | `str` | `"en"` | 预留语言参数，当前实现中未直接参与逻辑 |
| `k` | `int` | `2` | 路径跳数 |
| `max_paths_per_group` | `int` | `100` | 每组最多保留的路径数 |

#### 💡 `run` 函数

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
| `input_key` | `str` | `"triple"` | 原始关系三元组列；若不存在，算子会回退到 `tuple` |
| `output_key_meta` | `str` | `"hop_paths"` | 输出元名称；实际写入列名为 `f"{k}_{output_key_meta}"` |

#### 🤖 示例用法

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
