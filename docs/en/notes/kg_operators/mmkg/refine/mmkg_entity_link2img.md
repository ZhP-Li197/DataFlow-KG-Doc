---
title: MMKGEntityLink2ImgUrl
createTime: 2026/04/07 09:00:00
permalink: /en/kg_operators/mmkg/refine/mmkg_entity_link2img/
---

#### 📚 Overview

`MMKGEntityLink2ImgUrl` enriches text entities with encyclopedia links and, when possible, representative image links. The output is a list of formatted strings, and each item usually looks like `<entity> entity_name <link> wiki_url [<image> image_url]`.

#### 📚 `__init__` Function

```python
def __init__(
    self,
    user_agent: str = "DataFlow/1.0",
    max_retries: int = 3,
    retry_delay: float = 1.0,
    wiki_lang: str = "en",
    visualizable_types: Optional[List[str]] = None
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `user_agent` | `str` | `"DataFlow/1.0"` | User-Agent used for encyclopedia requests |
| `max_retries` | `int` | `3` | Maximum number of retries after failed lookups |
| `retry_delay` | `float` | `1.0` | Delay between retries |
| `wiki_lang` | `str` | `"en"` | Wikipedia language edition |
| `visualizable_types` | `Optional[List[str]]` | `None` | Reserved entity-type list; the current implementation mainly decides image enrichment from the entity name shape |

#### 💡 `run` Function

```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "entity",
    output_key: str = "linked_result"
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Input/output storage object |
| `input_key` | `str` | `"entity"` | Entity column; supports Python lists, JSON strings, and comma-separated strings |
| `output_key` | `str` | `"linked_result"` | Output column |

#### 🤖 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.multi_model_kg.refine.mmkg_entity_link2img import MMKGEntityLink2ImgUrl

storage = FileStorage(
    first_entry_file_name="mmkg_entity_input.json",
    cache_path="./cache",
    file_name_prefix="mmkg_link_img",
    cache_type="json",
).step()

op = MMKGEntityLink2ImgUrl(wiki_lang="en")
op.run(storage=storage, input_key="entity", output_key="linked_result")
```

Example input:

```json
{
  "entity": ["Albert Einstein", "Paris"]
}
```

Example output:

```json
{
  "linked_result": [
    "<entity> Albert Einstein <link> https://en.wikipedia.org/wiki/Albert_Einstein",
    "<entity> Paris <link> https://en.wikipedia.org/wiki/Paris"
  ]
}
```
