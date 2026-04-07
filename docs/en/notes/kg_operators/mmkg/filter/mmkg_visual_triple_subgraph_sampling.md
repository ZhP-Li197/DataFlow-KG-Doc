---
title: MMKGEntityBasedSubgraphSampling
createTime: 2026/04/07 09:00:00
permalink: /en/kg_operators/mmkg/filter/mmkg_visual_triple_subgraph_sampling/
---

#### 📚 Overview

`MMKGEntityBasedSubgraphSampling` samples multimodal subgraphs around entities and enriches each sampled subgraph with related visual triples and image URLs. It supports both `hop` and `bfs` sampling strategies, and the output typically contains `subgraph`, `vis_triple`, and `vis_url`.

#### 📚 `__init__` Function

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

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | Not directly used in the current implementation |
| `seed` | `int` | `0` | Random seed |
| `lang` | `str` | `"en"` | Reserved language parameter; not directly used in the current logic |
| `num_q` | `int` | `5` | Reserved parameter; not directly used in the current logic |

#### 💡 `run` Function

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

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Input/output storage object |
| `input_key` | `str` | `"triple"` | Source relation triple column |
| `output_key` | `str` | `"subgraph"` | Output subgraph column |
| `vis_triple_key` | `str` | `"vis_triple"` | Visual triple column |
| `sampling_type` | `str` | `"hop"` | Use `"hop"` for hop-based expansion or `"bfs"` for edge-budget sampling |
| `start_entity` | `Optional[str]` | `None` | In the current implementation, the operator still samples around all entities, so this argument does not directly restrict the final output |
| `M` | `int` | `5` | Maximum edge count for `bfs` sampling |
| `hop` | `int` | `2` | Maximum hop depth for `hop` sampling |

#### 🤖 Example Usage

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

Example input:

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

Example output:

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
