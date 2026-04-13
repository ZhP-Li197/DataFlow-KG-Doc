---
title: FinKGTupleExtraction
createTime: 2026/04/13 09:00:00
permalink: /en/kg_operators/domain_kg/financial_kg/generate/finkg_4tuple_extractor/
---

## 📚 Overview

`FinKGTupleExtraction` extracts Financial KG quadruples from text and writes aligned entity-class labels at the same time. It supports two tuple formats:

- Relation quadruple: `<subj> entity <obj> entity <rel> relation <time> time`
- Attribute quadruple: `<subj> entity <attribute> attribute <value> value <time> time`

If `ontology_lists` is not provided, the operator loads `./.cache/api/finkg_ontology.json`. The dataframe is updated with both `tuple` and `entity_class`, although `run` itself returns only `[output_key]`.

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
| `llm_serving` | `LLMServingABC` | - | LLM backend used for quadruple extraction |
| `seed` | `int` | `0` | Random seed |
| `triple_type` | `str` | `"relation"` | Extraction mode. `"relation"` uses the relation prompt, `"attribute"` uses the attribute prompt |
| `lang` | `str` | `"en"` | Prompt language |
| `num_q` | `int` | `5` | Reserved parameter that is currently not used in the core extraction path |

## 💡 `run` Function

```python
def run(
    self,
    storage: DataFlowStorage = None,
    ontology_lists=None,
    input_key: str = "raw_chunk",
    input_key_meta: str = "finkg_ontology",
    output_key: str = "tuple",
    output_key_meta: str = "entity_class"
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Input/output storage object |
| `ontology_lists` | `dict \| None` | `None` | Ontology dictionary passed directly; otherwise loaded from cache |
| `input_key` | `str` | `"raw_chunk"` | Input text column |
| `input_key_meta` | `str` | `"finkg_ontology"` | Ontology cache name. The operator reads `./.cache/api/{input_key_meta}.json` |
| `output_key` | `str` | `"tuple"` | Output column for extracted quadruples |
| `output_key_meta` | `str` | `"entity_class"` | Output column for entity-class labels |

The operator processes each text row with the selected prompt and writes both `tuple` and `entity_class`. `entity_class` is aligned item by item with `tuple`: relation tuples usually map to `[head_class, tail_class]`, while attribute tuples usually map to `[entity_class]`.

## 🤖 Example Usage

```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.financial_kg.generate.finkg_4tuple_extractor import (
    FinKGTupleExtraction,
)

storage = DummyStorage()
storage.set_data([
    {
        "raw_chunk": "Apple Inc. released the iPhone 16 in September 2025."
    }
])

op = FinKGTupleExtraction(
    llm_serving=llm_serving,
    triple_type="relation",
    lang="en",
)
op.run(storage=storage)
```

#### Example Input

```json
{
  "raw_chunk": "Apple Inc. released the iPhone 16 in September 2025."
}
```

#### Example Output

```json
{
  "tuple": [
    "<subj> Apple Inc. <obj> iPhone 16 <rel> releases <time> 2025-09"
  ],
  "entity_class": [
    ["Company", "Product"]
  ]
}
```


