---
title: MMKGVisualTripleExtraction
createTime: 2026/04/07 09:00:00
permalink: /en/kg_operators/mmkg/generate/mmkg_visual_triple_extractor/
---

## 📚 Overview

`MMKGVisualTripleExtraction` extracts visual triples from `img_dict` and the candidate entity column `entity`. The operator calls a multi-image VLM once per image, keeps only entities that are both returned by the model and present in the candidate list, and writes triples in the normalized format `<subj> entity <rel> depicted_in <obj> image_id`.

If the model response cannot be parsed as JSON, or if `quality_score` is lower than `quality_threshold`, that image produces no triple.

## ✒️ `__init__` Function

```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    quality_threshold: int = 3,
    lang: str = "en"
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | Vision-language serving backend that must implement `generate_from_input_multi_images` |
| `quality_threshold` | `int` | `3` | Minimum quality score required for keeping a visual extraction result |
| `lang` | `str` | `"en"` | Prompt language passed to `MMKGVisualTripleExtractionPrompt` |

## 💡 `run` Function

```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "img_dict",
    input_key_meta: str = "entity",
    output_key: str = "vis_triple"
) -> List[str]:
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Input/output storage object |
| `input_key` | `str` | `"img_dict"` | Column containing the image dictionary, usually `{image_id: image_path_or_url}` |
| `input_key_meta` | `str` | `"entity"` | Candidate entity column; supports `list[str]` or a comma-separated string |
| `output_key` | `str` | `"vis_triple"` | Output column name; each row stores a `list[str]` |

If `img_dict` is a string, the operator first tries to parse it as JSON. If `entity` is a string, it is split by commas. The function returns `[output_key]`.

## 🤖 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.multi_model_kg.generate.mmkg_visual_triple_extractor import MMKGVisualTripleExtraction

storage = FileStorage(
    first_entry_file_name="mmkg_visual_input.json",
    cache_path="./cache",
    file_name_prefix="mmkg_visual_extract",
    cache_type="json",
).step()

op = MMKGVisualTripleExtraction(
    llm_serving=llm_serving,
    quality_threshold=5,
    lang="en",
)
op.run(
    storage=storage,
    input_key="img_dict",
    input_key_meta="entity",
    output_key="vis_triple",
)
```

Example input:

```json
{
  "img_dict": {
    "img_einstein": "./images/einstein.jpg",
    "img_paris": "./images/paris.jpg"
  },
  "entity": ["Albert Einstein", "Paris", "London"]
}
```

Example output:

```json
{
  "vis_triple": [
    "<subj> Albert Einstein <rel> depicted_in <obj> img_einstein",
    "<subj> Paris <rel> depicted_in <obj> img_paris"
  ]
}
```
