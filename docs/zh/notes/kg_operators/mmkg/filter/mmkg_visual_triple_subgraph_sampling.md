---
title: MMKGEntityBasedSubgraphSampling
createTime: 2026/04/07 09:00:00
permalink: /zh/kg_operators/mmkg/filter/mmkg_visual_triple_subgraph_sampling/
---

#### 📚 概述

`MMKGEntityBasedSubgraphSampling` 围绕实体采样多模态子图，并为采样结果补齐关联的视觉三元组和图片 URL。支持 `hop` 和 `bfs` 两种采样方式，输出通常包含 `subgraph`、`vis_triple` 和 `vis_url`。

#### 📚 `__init__` 函数

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
| `llm_serving` | `LLMServingABC` | - | 当前实现中未直接使用 |
| `seed` | `int` | `0` | 随机种子 |
| `lang` | `str` | `"en"` | 预留语言参数，当前实现中未直接参与逻辑 |
| `num_q` | `int` | `5` | 预留参数，当前实现中未直接参与逻辑 |

#### 💡 `run` 函数

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
| `input_key` | `str` | `"triple"` | 原始关系三元组列 |
| `output_key` | `str` | `"subgraph"` | 输出子图列 |
| `vis_triple_key` | `str` | `"vis_triple"` | 视觉三元组列 |
| `sampling_type` | `str` | `"hop"` | 取 `"hop"` 时按跳数扩展，取 `"bfs"` 时按边数上限采样 |
| `start_entity` | `Optional[str]` | `None` | 当前实现最终仍会围绕图中全部实体分别采样，此参数不会直接限定输出范围 |
| `M` | `int` | `5` | `bfs` 采样时的最大边数 |
| `hop` | `int` | `2` | `hop` 采样时的最大跳数 |

#### 🤖 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.multi_model_kg.filter.mmkg_visual_triple_subgraph_sampling import MMKGEntityBasedSubgraphSampling

storage = FileStorage(
    first_entry_file_name="mmkg_graph_input.json",
    cache_path="./cache",
    file_name_prefix="mmkg_subgraph_sampling",
    cache_type="json",
).step()

op = MMKGEntityBasedSubgraphSampling(llm_serving=llm_serving, seed=0)
op.run(
    storage=storage,
    input_key="triple",
    output_key="subgraph",
    sampling_type="hop",
    hop=2
)
```

输入示例：

```json
{
  "triple": [
    "<subj> Albert Einstein <obj> Princeton University <rel> worked_at",
    "<subj> Albert Einstein <obj> Nobel Prize in Physics <rel> won"
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
  "subgraph": [
    "<subj> Albert Einstein <obj> Princeton University <rel> worked_at",
    "<subj> Albert Einstein <obj> Nobel Prize in Physics <rel> won"
  ],
  "vis_triple": [
    "<subj> Albert Einstein <rel> depicted_in <obj> img_einstein"
  ],
  "vis_url": [
    "./images/einstein.jpg"
  ]
}
```
