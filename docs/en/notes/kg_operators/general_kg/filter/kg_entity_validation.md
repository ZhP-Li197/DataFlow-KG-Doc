---
title: KGEntityValidity
createTime: 2026/04/10 15:40:44
permalink: /en/kg_operators/general_kg/filter/kg_entity_validation/
---

## 📚 Overview
`KGEntityValidity` is an evaluation and filtering operator that filters valid entities for a knowledge graph.
It reads one candidate entity string per row, asks a large language model to keep only entities that are semantically meaningful as knowledge graph nodes, and writes the filtered result back to the DataFrame.

Key characteristics of this operator:

- Requires `LLMServingABC` for large model evaluation
- Uses `KGEntityValidityPrompt` by default to construct prompts; supports custom prompt templates via the `prompt_template` parameter
- Supports writing results back in-place to the input column via `merge_to_input`, or writing to a new column
- Requires the `input_key` column to exist and the `output_key` column to not exist (raises an error on conflict)
- Processes one candidate entity batch string per row, typically a comma-separated list
- Output is a JSON-parsed `List[str]` of valid entities

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
| `llm_serving` | `LLMServingABC` | - | Large model service object. The operator uses `generate_from_input` to filter candidate entity batches. |
| `seed` | `int` | `0` | Random seed for initializing the internal random number generator. |
| `lang` | `str` | `"en"` | Prompt language. When `prompt_template` is `None`, the constructor creates `KGEntityValidityPrompt(lang)`. |
| `merge_to_input` | `bool` | `False` | If `True`, the filtered entity list is written back to the `input_key` column. If `False`, the result is written to the column specified by `output_key`. |
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

`run` reads the DataFrame from `storage`, validates that the `input_key` column exists and the `output_key` column does not, then extracts the candidate entity strings and calls `process_batch()` to process each row. Here, "one row" means one LLM call, but each row typically contains multiple comma-separated entities. The model response is parsed as a JSON array and written directly to the output column. Based on `merge_to_input`, the result is written back to either the `input_key` or `output_key` column.

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow storage object. The operator reads the `dataframe` from it and writes filtering results back. |
| `input_key` | `str` | `"entity"` | Input candidate entity column name. Each cell should be a candidate entity batch string, preferably comma-separated. |
| `output_key` | `str` | `"valid"` | Output column name for the filtered valid entity list (effective when `merge_to_input=False`). |

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
| `entity` | `str` | Input candidate entity batch string, for example `"Albert Einstein, Paris, xkqz123"`. |
| `valid` | `List[str]` | Valid entity list returned by the LLM after JSON parsing. |

#### Raw Model Output Format
```json
["Albert Einstein", "Paris", "deep learning"]
```

---

#### Example Input
```json
[
  {"entity": "Albert Einstein, Paris, xkqz123, deep learning"}
]
```

#### Example Output
```json
[
  {
    "entity": "Albert Einstein, Paris, xkqz123, deep learning",
    "valid": ["Albert Einstein", "Paris", "deep learning"]
  }
]
```

Upstream `KGEntityExtraction` first joins the extracted entity list into a comma-separated string in the `entity` column, and `KGEntityValidity` then filters that batch string row by row.

---

#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/general_kg/filter/kg_entity_validation.py`
- Default prompt: `DataFlow-KG/dataflow/prompts/core_kg/rel_triple_filter.py`
