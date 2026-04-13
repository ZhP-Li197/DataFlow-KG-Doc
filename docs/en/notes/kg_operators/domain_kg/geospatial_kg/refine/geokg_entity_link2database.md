---
title: GeoKGEntityLink2Database
createTime: 2026/04/13 09:00:00
permalink: /en/kg_operators/domain_kg/geospatial_kg/refine/geokg_entity_link2database/
---

## 📚 Overview

`GeoKGEntityLink2Database` links entities in geographic KG tuples to GeoNames. It automatically detects whether each input tuple is relation-style or attribute-style, extracts the entities that should be linked, and outputs a normalized string format:

`<entity> entity_name <link> GeoNamesURL`

If no usable candidate is found, the operator writes `NA` as the link target.

## ✒️ `__init__` Function

```python
def __init__(
    self,
    geonames_username: str = "dataflow_kg",
    max_candidates: int = 5,
    similarity_threshold: float = 0.5,
    request_timeout: int = 10,
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `geonames_username` | `str` | `"dataflow_kg"` | GeoNames username |
| `max_candidates` | `int` | `5` | Maximum number of candidates returned per search |
| `similarity_threshold` | `float` | `0.5` | Candidate similarity threshold |
| `request_timeout` | `int` | `10` | Network timeout in seconds |

## 💡 `run` Function

```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "tuple",
    output_key: str = "linked_result",
) -> List[str]:
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Input/output storage object |
| `input_key` | `str` | `"tuple"` | Column containing KG tuples |
| `output_key` | `str` | `"linked_result"` | Output column for linked entities |

The operator first normalizes each cell into `List[str]`, then extracts entities and queries GeoNames one by one. Each row in the output is a `list[str]`, and each item follows the format `<entity> Name <link> URL`.

## 🤖 Example Usage

```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.geospatial_kg.refine.geokg_entity_link2database import (
    GeoKGEntityLink2Database,
)

storage = DummyStorage()
storage.set_data([
    {
        "tuple": [
            "<subj> Wuhan <obj> Hubei <rel> located_in <time> NA",
            "<subj> Yangtze River <obj> East China Sea <rel> flows_into <time> NA"
        ]
    }
])

op = GeoKGEntityLink2Database()
op.run(storage=storage)
```

#### Example Input

```json
{
  "tuple": [
    "<subj> Wuhan <obj> Hubei <rel> located_in <time> NA",
    "<subj> Yangtze River <obj> East China Sea <rel> flows_into <time> NA"
  ]
}
```

#### Example Output

```json
{
  "linked_result": [
    "<entity> Wuhan <link> https://www.geonames.org/1791247",
    "<entity> Hubei <link> https://www.geonames.org/1806949",
    "<entity> Yangtze River <link> https://www.geonames.org/1788201",
    "<entity> East China Sea <link> https://www.geonames.org/1814991"
  ]
}
```


