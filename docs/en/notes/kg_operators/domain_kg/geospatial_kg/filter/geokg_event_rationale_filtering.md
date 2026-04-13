---
title: GeoKGEventRationaleFilter
createTime: 2026/04/13 09:00:00
permalink: /en/kg_operators/domain_kg/geospatial_kg/filter/geokg_event_rationale_filtering/
---

## 📚 Overview

`GeoKGEventRationaleFilter` filters event tuples using rationale scores. The input must contain both the tuple column and the score column, which default to `tuple` and `rationale_scores`.

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
    score_key: str = "rationale_scores",
    output_key: str = "filtered_tuple",
    min_score: float = 0.95,
    max_score: float = 1.0,
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Input/output storage object |
| `input_key` | `str` | `"tuple"` | Column containing tuples to filter |
| `score_key` | `str` | `"rationale_scores"` | Rationale-score column |
| `output_key` | `str` | `"filtered_tuple"` | Output column name |
| `min_score` | `float` | `0.95` | Minimum score to keep |
| `max_score` | `float` | `1.0` | Maximum score to keep |

The operator filters with `zip(triple_list, score_list)`, so the score list must stay aligned with the event tuples.

## 🤖 Example Usage

```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.geospatial_kg.filter.geokg_event_rationale_filtering import (
    GeoKGEventRationaleFilter,
)

storage = DummyStorage()
storage.set_data([
    {
        "tuple": [
            "<event> wildfire spread near Sydney <location> Sydney <time> 2025-01",
            "<event> snowfall in tropical Darwin <location> Darwin <time> 2025-01"
        ],
        "rationale_scores": [0.97, 0.12]
    }
])

op = GeoKGEventRationaleFilter()
op.run(storage=storage, min_score=0.9)
```

#### Example Input

```json
{
  "tuple": [
    "<event> wildfire spread near Sydney <location> Sydney <time> 2025-01",
    "<event> snowfall in tropical Darwin <location> Darwin <time> 2025-01"
  ],
  "rationale_scores": [0.97, 0.12]
}
```

#### Example Output

```json
{
  "filtered_tuple": [
    "<event> wildfire spread near Sydney <location> Sydney <time> 2025-01"
  ]
}
```


