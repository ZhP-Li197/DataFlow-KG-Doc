---
title: GeoKGTupleExtraction
createTime: 2026/04/13 09:00:00
permalink: /en/kg_operators/domain_kg/geospatial_kg/generate/geokg_4tuple_extractor/
---

## 📚 Overview

`GeoKGTupleExtraction` extracts spatio-temporal KG quadruples from geographic text and writes aligned `entity_class` labels. It supports two modes:

- Relation quadruple: `<subj> entity <obj> entity <rel> relation <time> time`
- Attribute quadruple: `<subj> entity <attribute> attribute <value> value <time> time`

If `ontology_lists` is not provided, the operator loads `./.cache/api/geokg_ontology.json`. As with the financial version, the dataframe is updated with both `tuple` and `entity_class`, while `run` returns only `[output_key]`.

## ✒️ `__init__` Function

```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    triple_type: str = "relation",
    lang: str = "en",
    num_q: int = 5
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM backend |
| `seed` | `int` | `0` | Random seed |
| `triple_type` | `str` | `"relation"` | Extraction mode, either `"relation"` or `"attribute"` |
| `lang` | `str` | `"en"` | Prompt language |
| `num_q` | `int` | `5` | Reserved parameter |

## 💡 `run` Function

```python
def run(
    self,
    storage: DataFlowStorage = None,
    ontology_lists=None,
    input_key: str = "raw_chunk",
    input_key_meta: str = "geokg_ontology",
    output_key: str = "tuple",
    output_key_meta: str = "entity_class"
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Input/output storage object |
| `ontology_lists` | `dict \| None` | `None` | Ontology passed directly; otherwise loaded from cache |
| `input_key` | `str` | `"raw_chunk"` | Input text column |
| `input_key_meta` | `str` | `"geokg_ontology"` | Ontology cache name |
| `output_key` | `str` | `"tuple"` | Output column for quadruples |
| `output_key_meta` | `str` | `"entity_class"` | Output column for entity classes |

`entity_class` is aligned item by item with `tuple`. Relation tuples usually map to `[head_class, tail_class]`, while attribute tuples usually map to `[entity_class]`.

## 🤖 Example Usage

```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.geospatial_kg.generate.geokg_4tuple_extractor import (
    GeoKGTupleExtraction,
)

storage = DummyStorage()
storage.set_data([
    {
        "raw_chunk": "Wuhan is located in Hubei and is connected to the Yangtze River."
    }
])

op = GeoKGTupleExtraction(
    llm_serving=llm_serving,
    triple_type="relation",
    lang="en",
)
op.run(storage=storage)
```

#### Example Input

```json
{
  "raw_chunk": "Wuhan is located in Hubei and is connected to the Yangtze River."
}
```

#### Example Output

```json
{
  "tuple": [
    "<subj> Wuhan <obj> Hubei <rel> located_in <time> NA",
    "<subj> Wuhan <obj> Yangtze River <rel> connected_to <time> NA"
  ],
  "entity_class": [
    ["City", "Province"],
    ["City", "River"]
  ]
}
```


