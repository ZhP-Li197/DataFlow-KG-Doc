---
title: GeoKGRelationInference
createTime: 2026/04/13 09:00:00
permalink: /en/kg_operators/domain_kg/geospatial_kg/refine/geokg_rel_4tuple_inference/
---

## 📚 Overview

`GeoKGRelationInference` infers a possible relation between two entities from existing geographic quadruples and the ontology. The operator first filters tuples that are relevant to `entity_pair`, then calls the LLM to infer a new relation.

The default output column is `inferred_tuple`, which stores the inferred quadruple list.

## ✒️ `__init__` Function

```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    lang: str = "en",
    seed: int = 0
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM backend |
| `lang` | `str` | `"en"` | Prompt language |
| `seed` | `int` | `0` | Random seed |

## 💡 `run` Function

```python
def run(
    self,
    storage: DataFlowStorage = None,
    entity_pair: List[str] = ["Hubei", "China"],
    input_key_tuple: str = "tuple",
    input_key_meta: str = "ontology",
    output_key: str = "inferred_tuple"
) -> List[str]:
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Input/output storage object |
| `entity_pair` | `List[str]` | `["Hubei", "China"]` | The two entities whose relation should be inferred; length must be 2 |
| `input_key_tuple` | `str` | `"tuple"` | Column containing existing geographic quadruples |
| `input_key_meta` | `str` | `"ontology"` | Ontology cache name, loaded from `./.cache/api/{input_key_meta}.json` |
| `output_key` | `str` | `"inferred_tuple"` | Output column for inferred tuples |

If no tuple relevant to `entity_pair` is found in a row, that row gets an empty list. The model response is parsed from the `"tuple"` key in the returned JSON.

## 🤖 Example Usage

```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.geospatial_kg.refine.geokg_rel_4tuple_inference import (
    GeoKGRelationInference,
)

storage = DummyStorage()
storage.set_data([
    {
        "tuple": [
            "<subj> Wuhan <obj> Hubei <rel> located_in <time> NA",
            "<subj> Hubei <obj> China <rel> located_in <time> NA"
        ]
    }
])

op = GeoKGRelationInference(llm_serving=llm_serving, lang="en")
op.run(storage=storage, entity_pair=["Wuhan", "China"])
```

#### Example Input

```json
{
  "tuple": [
    "<subj> Wuhan <obj> Hubei <rel> located_in <time> NA",
    "<subj> Hubei <obj> China <rel> located_in <time> NA"
  ]
}
```

#### Example Output

```json
{
  "inferred_tuple": [
    "<subj> Wuhan <obj> China <rel> located_in <time> NA"
  ]
}
```


