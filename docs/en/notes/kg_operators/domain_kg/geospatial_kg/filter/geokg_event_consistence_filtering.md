---
title: GeoKGEventConsistenceFilter
createTime: 2026/04/13 09:00:00
permalink: /en/kg_operators/domain_kg/geospatial_kg/filter/geokg_event_consistence_filtering/
---

## 📚 Overview

`GeoKGEventConsistenceFilter` filters event tuples using consistency scores. It requires both an event-tuple column and a score column, which default to `tuple` and `consistency_scores`.

If `merge_to_input=True`, the filtered result overwrites the original input column. Otherwise, it is written to a new `filtered_tuple` column.

## ✒️ `__init__` Function

```python
def __init__(self, merge_to_input: bool = False):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `merge_to_input` | `bool` | `False` | Whether to write filtered results back into the original input column |

## 💡 `run` Function

```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "tuple",
    score_key: str = "consistency_scores",
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
| `score_key` | `str` | `"consistency_scores"` | Consistency-score column |
| `output_key` | `str` | `"filtered_tuple"` | Output column name |
| `min_score` | `float` | `0.95` | Minimum score to keep |
| `max_score` | `float` | `1.0` | Maximum score to keep |

Filtering is done with `zip(triple_list, score_list)`, so the tuple list and score list should stay aligned.

## 🤖 Example Usage

```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.geospatial_kg.filter.geokg_event_consistence_filtering import (
    GeoKGEventConsistenceFilter,
)

storage = DummyStorage()
storage.set_data([
    {
        "tuple": [
            "<event> earthquake struck Tokyo <location> Tokyo <time> 2025-03-03",
            "<event> flood warning in Osaka <location> Osaka <time> 2025-03-04"
        ],
        "consistency_scores": [0.98, 0.72]
    }
])

op = GeoKGEventConsistenceFilter()
op.run(storage=storage, min_score=0.9)
```

#### Example Input

```json
{
  "tuple": [
    "<event> earthquake struck Tokyo <location> Tokyo <time> 2025-03-03",
    "<event> flood warning in Osaka <location> Osaka <time> 2025-03-04"
  ],
  "consistency_scores": [0.98, 0.72]
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


