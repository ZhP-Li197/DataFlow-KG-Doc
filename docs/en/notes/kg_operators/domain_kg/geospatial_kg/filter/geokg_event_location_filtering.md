---
title: GeoKGEventTupleLocationFilter
createTime: 2026/04/13 09:00:00
permalink: /en/kg_operators/domain_kg/geospatial_kg/filter/geokg_event_location_filtering/
---

## 📚 Overview

`GeoKGEventTupleLocationFilter` filters event tuples by the `<location>` field. It parses the location string from each event tuple and performs a case-insensitive containment match.

If `merge_to_input=True`, the result overwrites the original input column. Otherwise, it is written to a new `filtered_tuple` column.

## ✒️ `__init__` Function

```python
def __init__(self, merge_to_input: bool = False):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `merge_to_input` | `bool` | `False` | Whether to overwrite the original input column |

## 💡 `run` Function

```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "tuple",
    output_key: str = "filtered_tuple",
    location_name: str = "China"
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Input/output storage object |
| `input_key` | `str` | `"tuple"` | Column containing event tuples |
| `output_key` | `str` | `"filtered_tuple"` | Output column name |
| `location_name` | `str` | `"China"` | Location keyword used for filtering |

An event tuple is kept only when its `<location>` field contains `location_name`.

## 🤖 Example Usage

```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.geospatial_kg.filter.geokg_event_location_filtering import (
    GeoKGEventTupleLocationFilter,
)

storage = DummyStorage()
storage.set_data([
    {
        "tuple": [
            "<event> flood warning issued <location> China <time> 2025-06",
            "<event> earthquake reported <location> Japan <time> 2025-06"
        ]
    }
])

op = GeoKGEventTupleLocationFilter()
op.run(storage=storage, location_name="China")
```

#### Example Input

```json
{
  "tuple": [
    "<event> flood warning issued <location> China <time> 2025-06",
    "<event> earthquake reported <location> Japan <time> 2025-06"
  ]
}
```

#### Example Output

```json
{
  "filtered_tuple": [
    "<event> flood warning issued <location> China <time> 2025-06"
  ]
}
```


