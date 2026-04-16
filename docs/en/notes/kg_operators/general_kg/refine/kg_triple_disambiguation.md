---
title: KGTripleDisambiguation
createTime: 2026/04/11 13:00:00
permalink: /en/kg_operators/general_kg/refine/kg_triple_disambiguation/
---

## 📚 Overview
`KGTripleDisambiguation` automatically resolves ambiguous triples. It supports both attribute triples and relation triples, making it useful for handling merged KG outputs where the `ambiguous` field contains multiple candidate values.

By default, the operator reads the `ambiguous` field inside `merged_triples` and writes the resolved results to `resolved`. For each ambiguous triple, it first determines whether the triple is attribute-style or relation-style, then calls the corresponding prompt so the model can choose the most plausible candidate.

## ✒️ `__init__` Function
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    attribute_prompt: Union[KGAttributeTripleDisambiguationPrompt, DIYPromptABC] = None,
    relation_prompt: Union[KGEntityRelationTripleDisambiguationPrompt, DIYPromptABC] = None,
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM backend used for disambiguation. |
| `seed` | `int` | `0` | Seed for the internal random generator. |
| `lang` | `str` | `"en"` | Prompt language. |
| `attribute_prompt` | `Union[KGAttributeTripleDisambiguationPrompt, DIYPromptABC]` | `None` | Prompt used for attribute-triple disambiguation. |
| `relation_prompt` | `Union[KGEntityRelationTripleDisambiguationPrompt, DIYPromptABC]` | `None` | Prompt used for relation-triple disambiguation. |

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "merged_triples",
    input_key_meta: str = "ambiguous",
    output_key: str = "resolved",
):
    ...
```

`run` reads the DataFrame and extracts the `ambiguous` list from each row in `merged_triples`. For every ambiguous triple, `_resolve_single()` first uses `_detect_triple_type()` to determine whether it is an attribute triple or a relation triple, then asks the model to return either `resolved_attribute` or `resolved_relation`. If parsing fails or no resolved value is returned, the original ambiguous triple is kept as a fallback.

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Storage object for the DataFrame. |
| `input_key` | `str` | `"merged_triples"` | Input column containing merged triple dictionaries. |
| `input_key_meta` | `str` | `"ambiguous"` | Key inside the input dictionary that stores ambiguous triples. |
| `output_key` | `str` | `"resolved"` | Output column for resolved triples. |

## 🤖 Example Usage
```python
from dataflow.operators.general_kg.refinement.kg_triple_disambiguation import (
    KGTripleDisambiguation,
)

operator = KGTripleDisambiguation(
    llm_serving=llm_serving,
    lang="en",
)

operator.run(
    storage=storage,
    input_key="merged_triples",
    input_key_meta="ambiguous",
    output_key="resolved",
)
```

Default input and output format:

| Field | Type | Description |
| :-- | :-- | :-- |
| `merged_triples` | `Dict[str, List[str]]` | Merged triple dictionary that should include `ambiguous`. |
| `resolved` | `List[str]` | Disambiguated triple strings. |

Example input:

```json
[
  {
    "merged_triples": {
      "ambiguous": [
        "<entity> Paris <attribute> country <value> France | USA"
      ]
    }
  }
]
```

Example output:

```json
[
  {
    "resolved": [
      "<entity> Paris <attribute> country <value> France"
    ]
  }
]
```

Related files:

- Operator implementation: `DataFlow-KG/dataflow/operators/general_kg/refinement/kg_triple_disambiguation.py`
