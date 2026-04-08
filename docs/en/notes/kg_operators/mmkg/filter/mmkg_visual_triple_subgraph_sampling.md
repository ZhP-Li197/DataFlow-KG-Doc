---
title: MMKGEntityBasedSubgraphSampling
createTime: 2026/04/07 09:00:00
permalink: /en/kg_operators/mmkg/filter/mmkg_visual_triple_subgraph_sampling/
---

## 📚 Overview

`MMKGEntityBasedSubgraphSampling` samples subgraphs around entities and carries over the related `vis_triple` and `vis_url` fields. It collects all entities from the input graph, then writes one output row for each entity.

The current implementation only reads the first row's `triple` list as the graph to sample from. Although `run` exposes a `start_entity` parameter, the code still iterates over all entities and samples for each of them, so the operator behaves more like a full-graph entity subgraph sampler.

## ✒️ `__init__` Function

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
| `llm_serving` | `LLMServingABC` | - | Reserved parameter; not used directly in the current implementation |
| `seed` | `int` | `0` | Random seed used when a start entity is not explicitly provided |
| `lang` | `str` | `"en"` | Reserved language parameter; not used directly in the current implementation |
| `num_q` | `int` | `5` | Reserved parameter; not used directly in the current implementation |

## 💡 `run` Function

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
| `input_key` | `str` | `"triple"` | Column containing relation triples |
| `output_key` | `str` | `"subgraph"` | Output subgraph column name |
| `vis_triple_key` | `str` | `"vis_triple"` | Visual triple column name; filtered visual triples are written back using this name |
| `sampling_type` | `str` | `"hop"` | Sampling mode; `"hop"` expands by hop distance, `"bfs"` keeps at most `M` edges in BFS order |
| `start_entity` | `Optional[str]` | `None` | Reserved starting entity parameter; the current implementation does not restrict output to this entity |
| `M` | `int` | `5` | Maximum number of sampled edges when `sampling_type="bfs"` |
| `hop` | `int` | `2` | Hop depth when `sampling_type="hop"` |

Each output row contains a `subgraph`, the filtered `vis_triple`, and a deduplicated `vis_url` list.

## 🤖 Example Usage

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

Example input:

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

Example output (one row):

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
