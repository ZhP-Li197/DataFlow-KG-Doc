---
title: GeoKGEventTupleTimeFilter
createTime: 2026/04/13 09:00:00
permalink: /en/kg_operators/domain_kg/geospatial_kg/filter/geokg_event_time_filtering/
---

## 📚 Overview

`GeoKGEventTupleTimeFilter` filters event tuples by the `<time>` field. It supports multiple time formats, including:

- `YYYY-MM-DD`
- `Month YYYY`
- `YYYY`
- `QX YYYY`
- `YYYY-MM-DD|YYYY-MM-DD`

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
    query_time_start: str = "Q1 2021",
    query_time_end: str = "2023",
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Input/output storage object |
| `input_key` | `str` | `"tuple"` | Column containing event tuples |
| `output_key` | `str` | `"filtered_tuple"` | Output column name |
| `query_time_start` | `str` | `"Q1 2021"` | Start of the query time range |
| `query_time_end` | `str` | `"2023"` | End of the query time range |

The operator parses each tuple time into a time interval and checks whether it overlaps with the query interval. Tuples without `<time>` or with unparsable time values are dropped.

## 🤖 Example Usage

```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.geospatial_kg.filter.geokg_event_time_filtering import (
    GeoKGEventTupleTimeFilter,
)

storage = DummyStorage()
storage.set_data([
    {
        "tuple": [
            "<event> earthquake struck Tokyo <location> Tokyo <time> 2025-03-03",
            "<event> flood warning in Osaka <location> Osaka <time> 2023-06-01"
        ]
    }
])

op = GeoKGEventTupleTimeFilter()
op.run(storage=storage, query_time_start="2025-01-01", query_time_end="2025-12-31")
```

#### Example Input

```json
{
  "tuple": [
    "<event> earthquake struck Tokyo <location> Tokyo <time> 2025-03-03",
    "<event> flood warning in Osaka <location> Osaka <time> 2023-06-01"
  ]
}
```

#### Example Output

```json
{
  "filtered_tuple": [
    "<event> earthquake struck Tokyo <location> Tokyo <time> 2025-03-03"
  ]
}
```


