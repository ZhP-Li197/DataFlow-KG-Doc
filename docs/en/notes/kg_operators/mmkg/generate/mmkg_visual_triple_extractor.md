---
title: MMKGVisualTripleExtraction
createTime: 2026/04/07 09:00:00
permalink: /en/kg_operators/mmkg/generate/mmkg_visual_triple_extractor/
---

## 📚 Overview

`MMKGVisualTripleExtraction` extracts visual triples from images and candidate entity lists. The output follows the format `<subj> entity <rel> depicted_in <obj> image_id`. It invokes a multimodal model image by image and filters low-confidence results with `quality_threshold`.

#### 📚 `__init__` Function

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
| `llm_serving` | `LLMServingABC` | - | Vision-language serving backend that supports multimodal input |
| `quality_threshold` | `int` | `3` | Results with a score lower than this threshold are discarded |
| `lang` | `str` | `"en"` | Prompt language |

#### 💡 `run` Function

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
| `input_key` | `str` | `"img_dict"` | Column containing image dictionaries, usually `{image_id: image_url_or_path}` |
| `input_key_meta` | `str` | `"entity"` | Column containing candidate entities |
| `output_key` | `str` | `"vis_triple"` | Output column for extracted visual triples |

If the entity column is a string, the operator splits it by commas. If the image dictionary is stored as a string, the operator first attempts to parse it as JSON.

#### 🤖 Example Usage

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
    lang="en"
)
op.run(storage=storage, input_key="img_dict", input_key_meta="entity", output_key="vis_triple")
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
