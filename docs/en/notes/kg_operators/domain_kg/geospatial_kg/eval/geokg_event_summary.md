---
title: GeoKGTupleAttributeFrequencyEvaluator
createTime: 2026/04/13 09:00:00
permalink: /en/kg_operators/domain_kg/geospatial_kg/eval/geokg_event_summary/
---

## 📚 Overview

`GeoKGTupleAttributeFrequencyEvaluator` counts attribute tags in geographic event tuples, such as `<Time>`, `<Location>`, or `<effect>`. It does not preserve the row count of the input dataframe; instead, it aggregates the whole input into a single-row summary output.

The default outputs are:

- `attribute_counts`
- `attribute_frequencies`

## ✒️ `__init__` Function

```python
def __init__(self):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| None | - | - | The constructor only initializes the regex used for attribute-tag matching |

## 💡 `run` Function

```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "tuple",
    output_key: str = "attribute_counts",
    output_key_meta: str = "attribute_frequencies",
) -> List[str]:
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Input/output storage object |
| `input_key` | `str` | `"tuple"` | Column containing event tuples |
| `output_key` | `str` | `"attribute_counts"` | Output column for attribute-count dictionaries |
| `output_key_meta` | `str` | `"attribute_frequencies"` | Output column for attribute-frequency dictionaries |

Frequencies are computed as `attribute_count / total_tuple_count`. The operator writes a new dataframe with a single aggregated row.

## 🤖 Example Usage

```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.geospatial_kg.eval.geokg_event_summary import (
    GeoKGTupleAttributeFrequencyEvaluator,
)

storage = DummyStorage()
storage.set_data([
    {
        "tuple": [
            "<event> earthquake struck Tokyo <location> Tokyo <time> 2025-03-03 <effect> rail disrupted",
            "<event> flood warning in Osaka <location> Osaka <time> 2025-03-04"
        ]
    }
])

op = GeoKGTupleAttributeFrequencyEvaluator()
op.run(storage=storage)
```

#### Example Input

```json
{
  "tuple": [
    "<event> earthquake struck Tokyo <location> Tokyo <time> 2025-03-03 <effect> rail disrupted",
    "<event> flood warning in Osaka <location> Osaka <time> 2025-03-04"
  ]
}
```

#### Example Output

```json
{
  "attribute_counts": {
    "event": 2,
    "location": 2,
    "time": 2,
    "effect": 1
  },
  "attribute_frequencies": {
    "event": 1.0,
    "location": 1.0,
    "time": 1.0,
    "effect": 0.5
  }
}
```


