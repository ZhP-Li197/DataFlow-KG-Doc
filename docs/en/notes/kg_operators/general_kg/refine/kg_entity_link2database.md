---
title: KGEntityLink2Database
createTime: 2026/04/11 13:00:00
permalink: /en/kg_operators/general_kg/refine/kg_entity_link2database/
---

## 📚 Overview
`KGEntityLink2Database` links entities to an external knowledge base, currently focused on Wikipedia. For each entity, it retrieves candidate pages and uses fuzzy title matching to select the most relevant page URL.

By default, it reads from `entity` and writes to `linked_result`. The current implementation treats the input as a comma-separated entity string, queries the Wikipedia search API for candidate titles, then uses `wikipediaapi` to fetch page URLs. Successful links are stored in the form `<entity> ... <link> ...`.

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
| `llm_serving` | `LLMServingABC` | - | Reserved LLM backend object. The current linking flow does not rely on it directly. |
| `seed` | `int` | `0` | Seed for the internal random generator. |
| `lang` | `str` | `"en"` | Processing language. The current Wikipedia lookup is fixed to English. |
| `num_q` | `int` | `5` | Reserved parameter. |

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "entity",
    output_key: str = "linked_result"
):
    ...
```

`run` reads the DataFrame, validates the input and output columns, and then sends each row's entity text into `process_batch()`. During processing, the operator first splits the entity string by commas, then calls `_link_to_wikipedia()` for each entity. That method tries a direct page lookup first; if it fails, `_wiki_search()` is used to retrieve candidate titles, and `fuzz.ratio` selects the best match. Only successful links are written into `linked_result`.

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Storage object for the DataFrame. |
| `input_key` | `str` | `"entity"` | Input column containing entity text. |
| `output_key` | `str` | `"linked_result"` | Output column for external database links. |

## 🤖 Example Usage
```python
from dataflow.operators.general_kg.refinement.kg_entity_link2database import (
    KGEntityLink2Database,
)

operator = KGEntityLink2Database(
    llm_serving=llm_serving,
    lang="en",
)

operator.run(
    storage=storage,
    input_key="entity",
    output_key="linked_result",
)
```

Default input and output format:

| Field | Type | Description |
| :-- | :-- | :-- |
| `entity` | `str` | Input entity string, usually comma-separated. |
| `linked_result` | `List[str]` | Linked entities and their URLs. |

Example input:

```json
[
  {
    "entity": "Albert Einstein, Princeton University"
  }
]
```

Example output:

```json
[
  {
    "linked_result": [
      "<entity> Albert Einstein <link> https://en.wikipedia.org/wiki/Albert_Einstein",
      "<entity> Princeton University <link> https://en.wikipedia.org/wiki/Princeton_University"
    ]
  }
]
```

Related files:

- Operator implementation: `DataFlow-KG/dataflow/operators/general_kg/refinement/kg_entity_link2database.py`
