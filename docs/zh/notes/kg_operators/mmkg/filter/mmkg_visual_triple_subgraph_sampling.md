---
title: MMKGEntityBasedSubgraphSampling
createTime: 2026/04/07 09:00:00
permalink: /zh/kg_operators/mmkg/filter/mmkg_visual_triple_subgraph_sampling/
---

## 📚 概述

`MMKGEntityBasedSubgraphSampling` 以实体为中心采样子图，并同步筛出相关的 `vis_triple` 和 `vis_url`。它会从输入图谱中收集全部实体，然后为每个实体各生成一行输出结果。

当前实现只读取第一行的 `triple` 作为待采样图谱。虽然 `run` 提供了 `start_entity` 参数，但代码实际仍会遍历图中的全部实体并逐个采样，因此更适合作为“全图实体子图采样器”使用。

## ✒️ `__init__` 函数

```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    num_q: int = 5
):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 预留参数，当前实现未直接使用 |
| `seed` | `int` | `0` | 随机种子，用于在未显式指定起点时随机选一个起始实体 |
| `lang` | `str` | `"en"` | 预留语言参数，当前实现未直接使用 |
| `num_q` | `int` | `5` | 预留参数，当前实现未直接参与采样 |

## 💡 `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "triple",
    output_key: str = "subgraph",
    vis_triple_key: str = "vis_triple",
    sampling_type: str = "hop",
    start_entity: Optional[str] = None,
    M: int = 5,
    hop: int = 2
):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | 输入输出存储对象 |
| `input_key` | `str` | `"triple"` | 存放关系三元组列表的列名 |
| `output_key` | `str` | `"subgraph"` | 输出子图列名 |
| `vis_triple_key` | `str` | `"vis_triple"` | 视觉三元组列名；相关三元组会按该列名回写 |
| `sampling_type` | `str` | `"hop"` | 采样方式；`"hop"` 为按跳数扩展，`"bfs"` 为按 BFS 最多取 `M` 条边 |
| `start_entity` | `Optional[str]` | `None` | 预留起点参数；当前实现不会把输出限制在这个实体上 |
| `M` | `int` | `5` | `sampling_type="bfs"` 时最多采样的边数 |
| `hop` | `int` | `2` | `sampling_type="hop"` 时的扩展跳数 |

输出结果里每一行都包含一个 `subgraph`、过滤后的 `vis_triple`，以及去重后的 `vis_url` 列表。

## 🤖 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.multi_model_kg.filter.mmkg_visual_triple_subgraph_sampling import MMKGEntityBasedSubgraphSampling

storage = FileStorage(
    first_entry_file_name="mmkg_subgraph_input.json",
    cache_path="./cache",
    file_name_prefix="mmkg_subgraph_sampling",
    cache_type="json",
).step()

op = MMKGEntityBasedSubgraphSampling(llm_serving=llm_serving, seed=0)
op.run(storage=storage, sampling_type="hop", hop=1)
```

输入示例：

```json
{
  "triple": [
    "<subj> Albert Einstein <obj> Nobel Prize in Physics <rel> won",
    "<subj> Albert Einstein <obj> Ulm <rel> born_in",
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

输出示例（其中一行）：

```json
{
  "subgraph": [
    "<subj> Albert Einstein <obj> Nobel Prize in Physics <rel> won",
    "<subj> Albert Einstein <obj> Ulm <rel> born_in"
  ],
  "vis_triple": [
    "<subj> Albert Einstein <rel> depicted_in <obj> img_einstein"
  ],
  "vis_url": [
    "./images/einstein.jpg"
  ]
}
```
