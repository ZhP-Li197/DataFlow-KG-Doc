---
title: MMKGEntityLink2ImgUrl
createTime: 2026/04/07 09:00:00
permalink: /en/kg_operators/mmkg/refine/mmkg_entity_link2img/
---

## 📚 Overview

`MMKGEntityLink2ImgUrl` enriches entity lists with encyclopedia links and, when possible, a representative image link. It first searches Wikipedia titles with fuzzy matching, then uses Wikidata's `P18` image property to build a `commons.wikimedia.org` image URL.

The input entity field supports `list[str]`, a JSON string, or a comma-separated string. Each element written to `linked_result` is a formatted string: `<entity> entity_name <link> wiki_url [<image> image_url]`. The operator requires network access to Wikipedia, Wikidata, and Wikimedia Commons.

## ✒️ `__init__` Function

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
| `user_agent` | `str` | `"DataFlow/1.0"` | HTTP user agent used for Wikipedia and Wikidata requests |
| `max_retries` | `int` | `3` | Maximum number of retries for failed requests |
| `retry_delay` | `float` | `1.0` | Retry delay in seconds |
| `wiki_lang` | `str` | `"en"` | Wikipedia language code, such as `"en"` or `"zh"` |
| `visualizable_types` | `Optional[List[str]]` | `None` | Reserved parameter; it is stored, but actual image fetching currently depends on the `_is_visualizable` capitalization heuristic |

## 💡 `run` Function

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
| `input_key` | `str` | `"entity"` | Entity column; supports a list, a JSON string, or a comma-separated string |
| `output_key` | `str` | `"linked_result"` | Output column name; each row stores a `list[str]` |

For each entity, the code runs the sequence "Wikipedia search -> best-title matching -> visualizable check -> Wikidata image lookup". If any critical step fails, that entity is omitted from the result.

## 🤖 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.multi_model_kg.refine.mmkg_entity_link2img import MMKGEntityLink2ImgUrl

storage = FileStorage(
    first_entry_file_name="mmkg_entity_input.json",
    cache_path="./cache",
    file_name_prefix="mmkg_entity_link",
    cache_type="json",
).step()

op = MMKGEntityLink2ImgUrl(wiki_lang="en")
op.run(storage=storage, input_key="entity", output_key="linked_result")
```

Example input:

```json
{
  "entity": ["Albert Einstein"]
}
```

Example output:

```json
{
  "linked_result": [
    "<entity> Albert Einstein <link> https://en.wikipedia.org/wiki/Albert_Einstein <image> https://commons.wikimedia.org/wiki/Special:FilePath/Einstein_1921_by_F_Schmutzer_-_restoration.jpg"
  ]
}
```
