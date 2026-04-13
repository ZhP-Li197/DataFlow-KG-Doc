---
title: KGEntityNormalization
createTime: 2026/04/11 13:00:00
permalink: /en/kg_operators/general_kg/refine/kg_entity_normalization/
---

## 📚 Overview
`KGEntityNormalization` canonicalizes and deduplicates extracted entities. It does not perform entity extraction itself. Instead, it maps spelling variants, aliases, and synonymous mentions to unified canonical names and then writes the normalized results back row by row.

The operator works in two stages. First, it merges all entity values from the input column into a global candidate set and asks the model to generate a normalization mapping from variants to canonical names. Then it applies that mapping back to each original row and deduplicates the row-level results. The default input column is `entity`, and the default output column is `normalized_entity`.

## ✒️ __init__ Function
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    prompt_template: Union[KGEntityNormalizationPrompt, DIYPromptABC] = None,
    num_q: int = 5
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM backend used for normalization. |
| `seed` | `int` | `0` | Seed for the internal random generator. |
| `lang` | `str` | `"en"` | Prompt language. |
| `prompt_template` | `Union[KGEntityNormalizationPrompt, DIYPromptABC]` | `None` | Custom normalization prompt. |
| `num_q` | `int` | `5` | Reserved parameter. |

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "entity",
    output_key: str = "normalized_entity",
):
    ...
```

`run` reads the DataFrame and first sends all rows in the input column into `process_batch()`. Inside `process_batch()`, `_text2merged_list()` merges and deduplicates all entities across the dataset, and `_construct_examples()` calls the model to build a normalization dictionary. After that, `_normalize_chunks()` applies the variant-to-canonical mapping back to each original row and deduplicates the final row-level entity list before writing it to `normalized_entity`.

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Storage object for the DataFrame. |
| `input_key` | `str` | `"entity"` | Input column containing entities. |
| `output_key` | `str` | `"normalized_entity"` | Output column for canonicalized entities. |

## 🤖 Example Usage
```python
from dataflow.operators.general_kg.refinement.kg_entity_normalization import (
    KGEntityNormalization,
)

operator = KGEntityNormalization(
    llm_serving=llm_serving,
    lang="en",
)

operator.run(
    storage=storage,
    input_key="entity",
    output_key="normalized_entity",
)
```

Default input and output format:

| Field | Type | Description |
| :-- | :-- | :-- |
| `entity` | `str` | Input entity string; in the current testing data it is typically a comma-separated entity list. |
| `normalized_entity` | `str` | Canonicalized entity string. |

Example input:

```json
[
  {
    "entity": "IBM, International Business Machines, Watson"
  }
]
```

Example output:

```json
[
  {
    "normalized_entity": "IBM, Watson"
  }
]
```

Related files:

- Operator implementation: `DataFlow-KG/dataflow/operators/general_kg/refinement/kg_entity_normalization.py`
