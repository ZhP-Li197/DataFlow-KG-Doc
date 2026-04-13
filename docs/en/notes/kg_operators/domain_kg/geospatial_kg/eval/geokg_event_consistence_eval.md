---
title: GeoKGEventConsistenceEvaluator
createTime: 2026/04/13 09:00:00
permalink: /en/kg_operators/domain_kg/geospatial_kg/eval/geokg_event_consistence_eval/
---

## 📚 Overview

`GeoKGEventConsistenceEvaluator` evaluates the internal consistency of geographic event tuples. The default input column is `tuple`, and the default output column is `consistency_scores`, aligned item by item with the input tuples.

If a row has no valid tuples to evaluate, or the model returns unparsable JSON, the operator writes an empty list for that row.

## ✒️ `__init__` Function

```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    lang: str = "en"
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM backend |
| `lang` | `str` | `"en"` | Evaluation prompt language |

## 💡 `run` Function

```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "tuple",
    output_key: str = "consistency_scores"
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Input/output storage object |
| `input_key` | `str` | `"tuple"` | Column containing event tuples to evaluate |
| `output_key` | `str` | `"consistency_scores"` | Output column for consistency scores |

The returned JSON is expected to contain the key `"consistency_scores"`. In the common case, each score is a `float` aligned with one event tuple.

## 🤖 Example Usage

```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.geospatial_kg.eval.geokg_event_consistence_eval import (
    GeoKGEventConsistenceEvaluator,
)

storage = DummyStorage()
storage.set_data([
    {
        "tuple": [
            "<event> earthquake struck Tokyo <location> Tokyo <time> 2025-03-03",
            "<event> heavy rainfall in Osaka <location> Osaka <time> 2025-03-04"
        ]
    }
])

op = GeoKGEventConsistenceEvaluator(llm_serving=llm_serving, lang="en")
op.run(storage=storage)
```

#### Example Input

```json
{
  "tuple": [
    "<event> earthquake struck Tokyo <location> Tokyo <time> 2025-03-03",
    "<event> heavy rainfall in Osaka <location> Osaka <time> 2025-03-04"
  ]
}
```

#### Example Output

```json
{
  "consistency_scores": [0.98, 0.95]
}
```


