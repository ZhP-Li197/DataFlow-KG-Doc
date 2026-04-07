---
title: MMKGImgDictLink2WikiSimple
createTime: 2026/04/07 09:00:00
permalink: /en/kg_operators/mmkg/refine/mmkg_entity_link2database/
---

#### 📚 Overview

`MMKGImgDictLink2WikiSimple` maps images in `img_dict` to Wikidata entity URLs. It can use an explicit `img_entity_mapping` from image IDs to entity names, or it can infer an entity name from the image ID when no mapping is provided.

#### 📚 `__init__` Function

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
| `user_agent` | `str` | `"DataFlow/1.0"` | User-Agent used for Wikidata requests |
| `max_retries` | `int` | `3` | Maximum number of retries after a failed lookup |
| `retry_delay` | `float` | `1.0` | Delay between retries |

#### 💡 `run` Function

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
| `input_key_img` | `str` | `"img_dict"` | Column containing image dictionaries |
| `output_key` | `str` | `"linked_result"` | Output column |
| `img_entity_mapping` | `Dict[str, str]` | `None` | Manual mapping from image IDs to entity names |

Each row in the output column is usually a list of dictionaries shaped like `{"img": image_id, "wikidata_url": url}`.

#### 🤖 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.multi_model_kg.refine.mmkg_entity_link2database import MMKGImgDictLink2WikiSimple

storage = FileStorage(
    first_entry_file_name="mmkg_link_input.json",
    cache_path="./cache",
    file_name_prefix="mmkg_link_wiki",
    cache_type="json",
).step()

op = MMKGImgDictLink2WikiSimple()
op.run(
    storage=storage,
    input_key_img="img_dict",
    output_key="linked_result",
    img_entity_mapping={"img_einstein": "Albert Einstein", "img_paris": "Paris"}
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
    {"img": "img_einstein", "wikidata_url": "https://www.wikidata.org/wiki/Q937"},
    {"img": "img_paris", "wikidata_url": "https://www.wikidata.org/wiki/Q90"}
  ]
}
```
