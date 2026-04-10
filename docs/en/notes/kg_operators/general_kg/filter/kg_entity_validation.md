---
title: KGEntityValidity
createTime: 2026/04/10 15:40:44
permalink: /en/kg_operators/general_kg/filter/kg_entity_validation/
---

## 📚 Overview
`KGEntityValidity` is an evaluation and filtering operator that assesses the validity of candidate entities in a knowledge graph.
It reads candidate entities from each row, calls a large language model to determine whether the entity is semantically meaningful and suitable as a knowledge graph node, and writes the judgment result back to the DataFrame.

Key characteristics of this operator:

- Requires `LLMServingABC` for large model evaluation
- Uses `KGEntityValidityPrompt` by default to construct prompts; supports custom prompt templates via the `prompt_template` parameter
- Supports writing results back in-place to the input column via `merge_to_input`, or writing to a new column
- Requires the `input_key` column to exist and the `output_key` column to not exist (raises an error on conflict)
- Output is the model's structured judgment result (JSON-parsed object), not a simple boolean

---

## ✒️ `__init__` Parameters
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    merge_to_input: bool = False,
    prompt_template: Union[KGEntityValidityPrompt, DIYPromptABC] = None,
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | Large model service object. The operator uses `generate_from_input` to assess entity validity. |
| `seed` | `int` | `0` | Random seed for initializing the internal random number generator. |
| `lang` | `str` | `"en"` | Prompt language. When `prompt_template` is `None`, the constructor creates `KGEntityValidityPrompt(lang)`. |
| `merge_to_input` | `bool` | `False` | If `True`, the judgment result is written back to the `input_key` column. If `False`, the result is written to the column specified by `output_key`. |
| `prompt_template` | `KGEntityValidityPrompt` / `DIYPromptABC` | `None` | Custom prompt template. If provided, takes priority over the default template. |

---

## 💡 `run` Parameters
```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "entity",
    output_key: str = "valid",
):
    ...
```

`run` reads the DataFrame from `storage`, validates that the `input_key` column exists and the `output_key` column does not, then extracts the entity list and calls `process_batch()` to process each row. Each entity string is constructed into a user prompt, passed to the LLM for validity assessment, and the JSON-parsed response is written directly to the output column. Based on `merge_to_input`, the result is written back to either the `input_key` or `output_key` column.

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow storage object. The operator reads the `dataframe` from it and writes the judgment results back. |
| `input_key` | `str` | `"entity"` | Input candidate entity column name. Each cell should be an entity string. |
| `output_key` | `str` | `"valid"` | Output validity judgment column name (effective when `merge_to_input=False`). |

---

## 🤖 Example Usage
```python
from dataflow.operators.general_kg.filter.kg_entity_validation import (
    KGEntityValidity,
)

operator = KGEntityValidity(
    llm_serving=llm_serving,
    lang="en",
)
operator.run(
    storage=storage,
    input_key="entity",
    output_key="valid",
)
```

---

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `entity` | `str` | Input candidate entity string. |
| `valid` | `Dict` / `Any` | Validity judgment result returned by the LLM, written after JSON parsing. Specific fields depend on the prompt template. |

---

#### Example Input
```json
[
  {"entity": "Albert Einstein"},
  {"entity": "xkqz123"},
  {"entity": "Paris"}
]
```

#### Example Output
```json
[
  {"entity": "Albert Einstein", "valid": {"is_valid": true, "reason": "Well-known physicist and a meaningful KG entity."}},
  {"entity": "xkqz123",        "valid": {"is_valid": false, "reason": "Random string with no semantic meaning."}},
  {"entity": "Paris",          "valid": {"is_valid": true, "reason": "Capital city of France, a common KG entity."}}
]
```

---

#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/general_kg/filter/kg_entity_validation.py`
- Default prompt: `DataFlow-KG/dataflow/prompts/core_kg/rel_triple_filter.py`