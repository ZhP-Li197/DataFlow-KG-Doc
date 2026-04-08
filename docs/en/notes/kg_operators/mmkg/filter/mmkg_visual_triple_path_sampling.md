---
title: MMKGRelationTuplePathGenerator
createTime: 2026/04/07 09:00:00
permalink: /en/kg_operators/mmkg/filter/mmkg_visual_triple_path_sampling/
---

## 📚 Overview

`MMKGRelationTuplePathGenerator` enumerates `k`-hop paths from relation triples and attaches the related visual triples and image URLs. It expects the actual triple format used by the parser in code: `<subj> ... <obj> ... <rel> ...`.

The current implementation works best when the whole graph is stored in a single row. If the input `DataFrame` has multiple rows, it merges all `triple` or `tuple` values, but it only uses the first row's `vis_triple` and `img_dict` when attaching visual information.

## ✒️ `__init__` Function

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
| `llm_serving` | `LLMServingABC \| None` | `None` | Reserved parameter; not used directly in the current implementation |
| `seed` | `int` | `0` | Reserved random seed; path enumeration is currently deterministic |
| `lang` | `str` | `"en"` | Reserved language parameter; not used directly in the current implementation |
| `k` | `int` | `2` | Hop count of the paths to enumerate |
| `max_paths_per_group` | `int` | `100` | Maximum number of paths kept for one group |

## 💡 `run` Function

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
| `input_key` | `str` | `"triple"` | Column containing raw relation triples; if missing, the code falls back to checking `triple` or `tuple` |
| `output_key_meta` | `str` | `"hop_paths"` | Base name of the output path column; the actual written column is `f"{k}_{output_key_meta}"` |

The operator writes one row per sampled path, so the output is typically a path table. The return value is `[output_key_meta, "vis_triple", "vis_url"]`, but the real path column stored in the dataframe is still dynamic, such as `2_hop_paths`.

## 🤖 Example Usage

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
