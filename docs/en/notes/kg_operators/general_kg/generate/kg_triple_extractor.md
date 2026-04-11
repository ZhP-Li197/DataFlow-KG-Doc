---
title: KGTripleExtraction
createTime: 2026/04/11 12:00:00
permalink: /en/kg_operators/general_kg/generate/kg_triple_extractor/
---

## 📚 Overview
`KGTripleExtraction` extracts knowledge graph triples from raw text. It combines the input text with a candidate entity list, calls an LLM to produce structured triples, and writes the results back to the DataFrame for downstream KG construction or reasoning.

The operator supports two prompt modes: `triple_type="attribute"` uses the attribute-quadruple extraction prompt, while `triple_type="relation"` uses the relation-triple extraction prompt. Similar to the entity extractor, it also includes text-quality filtering, and texts that fail preprocessing directly return an empty triple list.

## ✒️ __init__ Function
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    triple_type: str = "attribute",
    lang: str = "en",
    num_q: int = 5
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM backend used for extraction. |
| `seed` | `int` | `0` | Seed for the internal random generator. |
| `triple_type` | `str` | `"attribute"` | Extraction mode. Supported values are `attribute` and `relation`. |
| `lang` | `str` | `"en"` | Prompt language. |
| `num_q` | `int` | `5` | Reserved parameter that is not directly used in the current implementation. |

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "raw_chunk",
    input_key_meta: str = "entity",
    output_key: str = "triple"
):
    ...
```

`run` reads the DataFrame, validates the input text column, the entity column, and the output column, and then sends aligned text-entity pairs into `process_batch()`. In `_construct_examples()`, each text is first filtered by `_preprocess_text()`, then passed to the prompt selected by `triple_type`, and finally parsed by `_parse_llm_response()` to extract the `triple` field from the returned JSON. The collected triples are written to `output_key`.

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Storage object for the DataFrame. |
| `input_key` | `str` | `"raw_chunk"` | Input column containing raw text. |
| `input_key_meta` | `str` | `"entity"` | Input column containing entity candidates. |
| `output_key` | `str` | `"triple"` | Output column for extracted triples. |

## 🤖 Example Usage
```python
from dataflow.operators.general_kg.generate.kg_triple_extractor import (
    KGTripleExtraction,
)

operator = KGTripleExtraction(
    llm_serving=llm_serving,
    triple_type="relation",
    lang="en",
)

operator.run(
    storage=storage,
    input_key="raw_chunk",
    input_key_meta="entity",
    output_key="triple",
)
```

Default input and output format:

| Field | Type | Description |
| :-- | :-- | :-- |
| `raw_chunk` | `str` | Input raw text. |
| `entity` | `str` | Input entity-candidate string; in the testing data it is usually a comma-separated entity list. |
| `triple` | `List[str]` | Extracted structured triple strings. |

Example input:

```json
[
  {
    "raw_chunk": "Marie Curie was born in Warsaw and won the Nobel Prize.",
    "entity": "Marie Curie, Warsaw, Nobel Prize"
  }
]
```

Example output:

```json
[
  {
    "raw_chunk": "Marie Curie was born in Warsaw and won the Nobel Prize.",
    "entity": "Marie Curie, Warsaw, Nobel Prize",
    "triple": [
      "<subj> Marie Curie <obj> Warsaw <rel> born_in",
      "<subj> Marie Curie <obj> Nobel Prize <rel> award"
    ]
  }
]
```

Related files:

- Operator implementation: `DataFlow-KG/dataflow/operators/general_kg/generate/kg_triple_extractor.py`
- Relation prompt definitions: `DataFlow-KG/dataflow/prompts/core_kg/rel_triple_generate.py`
- Attribute prompt definitions: `DataFlow-KG/dataflow/prompts/core_kg/attri_triple.py`
