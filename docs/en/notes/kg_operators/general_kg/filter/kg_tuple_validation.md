---
title: KGTupleValidity
createTime: 2026/04/10 15:40:44
permalink: /en/kg_operators/general_kg/filter/kg_tuple_validation/
---

## 📚 Overview
`KGTupleValidity` is a filtering operator that validates the validity of knowledge graph triples or tuples.
It reads the triple strings from each row, calls a large language model to assess semantic validity, and writes the validation results back to the DataFrame.

Key characteristics of this operator:

- Requires `LLMServingABC` for large model evaluation
- Uses `triple_type` to distinguish between two triple types: `"relation"` uses `KGRelationTupleValidityPrompt`; `"attribute"` uses `KGAttributeTupleValidationPrompt`
- Input column auto-fallback: prioritizes `input_key`, then falls back to `triple`, then `tuple`
- Output column name is automatically inferred from the input column name: `valid_triple` when input is `triple`; `valid_tuple` when input is `tuple`
- Requires the `output_key` column to not exist beforehand (raises an error on conflict)
- Supports writing validated results back in-place to the input column via `merge_to_input`; when `True`, no new output column is created

---

## ✒️ `__init__` Parameters
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    merge_to_input: bool = False,
    triple_type: str = "relation"
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | Large model service object. The operator uses `generate_from_input` to validate triples. |
| `seed` | `int` | `0` | Random seed for initializing the internal random number generator. |
| `lang` | `str` | `"en"` | Prompt language, affecting the language version of the selected prompt template. |
| `merge_to_input` | `bool` | `False` | If `True`, validation results are written back to the `input_key` column and no new output column is created. If `False`, results are written to the column specified by `output_key`. |
| `triple_type` | `str` | `"relation"` | Triple type. `"relation"` corresponds to relational triples and uses `KGRelationTupleValidityPrompt`; `"attribute"` corresponds to attribute triples and uses `KGAttributeTupleValidationPrompt`. |

---

## 💡 `run` Parameters
```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "triple",
    output_key: str = "valid_triple",
):
    ...
```

`run` reads the DataFrame from `storage`, determines the input column by priority (`input_key` → `triple` → `tuple`), automatically infers the output column name (`valid_triple` or `valid_tuple`), and validates that the output column does not already exist. Each row's triple string is constructed into a user prompt, passed to the LLM for validity assessment, and the JSON-parsed validation result is written to the output column. If `merge_to_input=True`, the validated results are written back in-place to the `input_key` column and no new output column is created. If `False`, results are written to the column specified by `output_key`.

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow storage object. The operator reads the `dataframe` from it and writes the validation results back. |
| `input_key` | `str` | `"triple"` | Input triple column name. Supports auto-fallback to `triple` and `tuple`. |
| `output_key` | `str` | `"valid_triple"` | Output validation result column name (effective only when `merge_to_input=False`; when `True`, results are written back to the `input_key` column). If the input column is `tuple`, it is recommended to change this to `"valid_tuple"`. |

---

## 🤖 Example Usage
```python
from dataflow.operators.general_kg.filter.kg_tuple_validation import (
    KGTupleValidity,
)

# Validate relational triples
operator = KGTupleValidity(
    llm_serving=llm_serving,
    triple_type="relation",
    lang="en",
)
operator.run(
    storage=storage,
    input_key="triple",
    output_key="valid_triple",
)

# Validate attribute tuples
operator = KGTupleValidity(
    llm_serving=llm_serving,
    triple_type="attribute",
    lang="en",
)
operator.run(
    storage=storage,
    input_key="tuple",
    output_key="valid_tuple",
)
```

---

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `triple` / `tuple` | `str` | Input triple or tuple string. |
| `valid_triple` / `valid_tuple` | `Any` | Validated triples after LLM assessment, as a JSON-parsed structured result. The exact type and fields depend on the prompt template's return format. |

---

#### Example Input
```json
[
  {"triple": "<subj> Newton <obj> gravity <rel> discovered"},
  {"triple": "<subj> xkqz <obj> 123abc <rel> ????"}
]
```

#### Example Output
```json
[
  {"triple": "...", "valid_triple": ["<subj> Newton <obj> gravity <rel> discovered"]},
  {"triple": "...", "valid_triple": []}
]
```

> ⚠️ Note: The actual structure of `valid_triple` / `valid_tuple` depends on the prompt template's return format; the example above is for reference only.

---

#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/general_kg/filter/kg_tuple_validation.py`
- Relational prompt: `DataFlow-KG/dataflow/prompts/core_kg/rel_triple_filter.py`
- Attribute prompt: `DataFlow-KG/dataflow/prompts/core_kg/attri_triple.py`