---
title: MMKGRelationTuplePathGenerator
createTime: 2026/04/07 09:00:00
permalink: /en/kg_operators/mmkg/filter/mmkg_visual_triple_path_sampling/
---

#### 📚 Overview

`MMKGRelationTuplePathGenerator` enumerates `k`-hop paths from relation triples and attaches related visual triples and image URLs to each path. The output dataframe typically contains `2_hop_paths`, `vis_triple`, and `vis_url`.

#### 📚 `__init__` Function

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

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | `None` | Unused in the current implementation; reserved for future extensions |
| `seed` | `int` | `0` | Random seed |
| `lang` | `str` | `"en"` | Reserved language parameter; not directly used in the current logic |
| `k` | `int` | `2` | Path hop count |
| `max_paths_per_group` | `int` | `100` | Maximum number of paths retained per group |

#### 💡 `run` Function

```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "triple",
    output_key_meta: str = "hop_paths",
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Input/output storage object |
| `input_key` | `str` | `"triple"` | Source relation triple column; if missing, the operator falls back to `tuple` |
| `output_key_meta` | `str` | `"hop_paths"` | Output meta name; the real column written to the dataframe is `f"{k}_{output_key_meta}"` |

#### 🤖 Example Usage

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

Example input:

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

Example output:

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
