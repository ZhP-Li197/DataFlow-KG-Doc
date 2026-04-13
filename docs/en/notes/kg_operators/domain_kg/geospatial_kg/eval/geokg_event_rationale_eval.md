---
title: GeoKGEventRationaleEvaluator
createTime: 2026/04/13 09:00:00
permalink: /en/kg_operators/domain_kg/geospatial_kg/eval/geokg_event_rationale_eval/
---

## 📚 Overview

`GeoKGEventRationaleEvaluator` evaluates the plausibility of geographic event tuples. The default input column is `tuple`, and the default output column is `rationale_scores`, aligned item by item with the input tuples.

If the input is empty, or the model response cannot be parsed, the operator writes an empty list for that row.

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
    output_key: str = "rationale_scores"
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Input/output storage object |
| `input_key` | `str` | `"tuple"` | Column containing event tuples to evaluate |
| `output_key` | `str` | `"rationale_scores"` | Output column for rationale scores |

The returned JSON is expected to contain the key `"rationale_scores"`. A common output is a `float` list aligned with the input tuples.

## 🤖 Example Usage

```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.geospatial_kg.eval.geokg_event_rationale_eval import (
    GeoKGEventRationaleEvaluator,
)

storage = DummyStorage()
storage.set_data([
    {
        "tuple": [
            "<event> wildfire spread near Sydney <location> Sydney <time> 2025-01",
            "<event> flood warning issued in Brisbane <location> Brisbane <time> 2025-01-09"
        ]
    }
])

op = GeoKGEventRationaleEvaluator(llm_serving=llm_serving, lang="en")
op.run(storage=storage)
```

#### Example Input

```json
{
  "tuple": [
    "<event> wildfire spread near Sydney <location> Sydney <time> 2025-01",
    "<event> flood warning issued in Brisbane <location> Brisbane <time> 2025-01-09"
  ]
}
```

#### Example Output

```json
{
  "rationale_scores": [0.97, 0.96]
}
```


