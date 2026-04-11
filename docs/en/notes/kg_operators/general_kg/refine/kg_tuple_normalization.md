---
title: KGTupleNormalization
createTime: 2026/04/11 13:00:00
permalink: /en/kg_operators/general_kg/refine/kg_tuple_normalization/
---

## 📚 Overview
`KGTupleNormalization` normalizes KG triples or tuples. It supports both attribute-style triples and relation-style triples and automatically chooses the appropriate prompt to canonicalize attribute names or relation names.

The operator prefers the explicitly provided input column, but it can also automatically fall back to either `triple` or `tuple` in the DataFrame. The output column is automatically set to `normalized_triple` or `normalized_tuple` based on the chosen input column. If model parsing fails, the normalized result falls back to an empty string.

## ✒️ __init__ Function
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    attribute_prompt: Union[KGAttributeNormalizationPrompt, DIYPromptABC] = None,
    relation_prompt: Union[KGAttributeNormalizationPrompt, DIYPromptABC] = None,
    num_q: int = 5
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM backend used for normalization. |
| `seed` | `int` | `0` | Seed for the internal random generator. |
| `lang` | `str` | `"en"` | Prompt language. |
| `attribute_prompt` | `Union[KGAttributeNormalizationPrompt, DIYPromptABC]` | `None` | Prompt for attribute-triple normalization. |
| `relation_prompt` | `Union[KGAttributeNormalizationPrompt, DIYPromptABC]` | `None` | Prompt for relation-triple normalization. |
| `num_q` | `int` | `5` | Reserved parameter. |

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "triple",
    output_key: str = "normalized_triple",
):
    ...
```

`run` reads the DataFrame and relies on `_validate_dataframe()` to determine the actual input and output columns. Inside `process_batch()`, `_detect_triple_type()` first checks whether the current data is attribute-style or relation-style, and then the operator builds prompts row by row, calls the model, and parses `normalized_triple` from the returned JSON. The normalized results are finally written back to the DataFrame.

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Storage object for the DataFrame. |
| `input_key` | `str` | `"triple"` | Input column containing triples. |
| `output_key` | `str` | `"normalized_triple"` | Expected output column name; the final name may be adjusted automatically based on the chosen input column. |

## 🤖 Example Usage
```python
from dataflow.operators.general_kg.refinement.kg_tuple_normalization import (
    KGTupleNormalization,
)

operator = KGTupleNormalization(
    llm_serving=llm_serving,
    lang="en",
)

operator.run(
    storage=storage,
    input_key="triple",
    output_key="normalized_triple",
)
```

Default input and output format:

| Field | Type | Description |
| :-- | :-- | :-- |
| `triple` / `tuple` | `List[str]` | Input attribute-style or relation-style triples. |
| `normalized_triple` / `normalized_tuple` | `str` / `List[str]` | Normalized triple results. |

Example input:

```json
[
  {
    "triple": [
      "<subj> A <obj> B <rel> was born in",
      "<subj> C <obj> D <rel> born_in"
    ]
  }
]
```

Example output:

```json
[
  {
    "normalized_triple": [
      "<subj> A <obj> B <rel> born_in",
      "<subj> C <obj> D <rel> born_in"
    ]
  }
]
```

Related files:

- Operator implementation: `DataFlow-KG/dataflow/operators/general_kg/refinement/kg_tuple_normalization.py`
