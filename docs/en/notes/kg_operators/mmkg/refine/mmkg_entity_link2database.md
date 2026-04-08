---
title: MMKGImgDictLink2WikiSimple
createTime: 2026/04/07 09:00:00
permalink: /en/kg_operators/mmkg/refine/mmkg_entity_link2database/
---

## 📚 Overview

`MMKGImgDictLink2WikiSimple` maps image IDs in `img_dict` directly to Wikidata entity URLs. Each element written to `linked_result` is a dictionary in the form `{"img": image_id, "wikidata_url": "https://www.wikidata.org/wiki/Q..."}`.

If `img_entity_mapping` is passed to `run`, the operator uses that mapping first. Otherwise it guesses an entity name from the image key by stripping the `img_` prefix, replacing underscores with spaces, and converting the result to title case. The operator requires network access to Wikidata.

## ✒️ `__init__` Function

```python
def __init__(
    self,
    user_agent: str = "DataFlow/1.0",
    max_retries: int = 3,
    retry_delay: float = 1.0,
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `user_agent` | `str` | `"DataFlow/1.0"` | HTTP user agent used for Wikidata requests |
| `max_retries` | `int` | `3` | Maximum number of retries for failed requests |
| `retry_delay` | `float` | `1.0` | Retry delay in seconds |

## 💡 `run` Function

```python
def run(
    self,
    storage: DataFlowStorage,
    input_key_img: str = "img_dict",
    output_key: str = "linked_result",
    img_entity_mapping: Dict[str, str] = None
) -> List[str]:
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Input/output storage object |
| `input_key_img` | `str` | `"img_dict"` | Column containing the image dictionary in the form `{image_id: image_path_or_url}` |
| `output_key` | `str` | `"linked_result"` | Output column name; each row stores a `list[dict]` |
| `img_entity_mapping` | `Dict[str, str] \| None` | `None` | Optional mapping from image ID to entity name; overrides the default guessing logic |

If entity search fails, the operator still keeps the image ID in the result and sets `wikidata_url` to `None`.

## 🤖 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.multi_model_kg.refine.mmkg_entity_link2database import MMKGImgDictLink2WikiSimple

storage = FileStorage(
    first_entry_file_name="mmkg_img_input.json",
    cache_path="./cache",
    file_name_prefix="mmkg_img_link",
    cache_type="json",
).step()

op = MMKGImgDictLink2WikiSimple()
op.run(
    storage=storage,
    input_key_img="img_dict",
    output_key="linked_result",
    img_entity_mapping={
        "img_einstein": "Albert Einstein",
        "img_paris": "Paris"
    },
)
```

Example input:

```json
{
  "img_dict": {
    "img_einstein": "./images/einstein.jpg",
    "img_paris": "./images/paris.jpg"
  }
}
```

Example output:

```json
{
  "linked_result": [
    {
      "img": "img_einstein",
      "wikidata_url": "https://www.wikidata.org/wiki/Q937"
    },
    {
      "img": "img_paris",
      "wikidata_url": "https://www.wikidata.org/wiki/Q90"
    }
  ]
}
```
