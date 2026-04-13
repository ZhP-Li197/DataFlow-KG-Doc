---
title: KGEntityClassification
createTime: 2026/04/11 13:00:00
permalink: /en/kg_operators/general_kg/refine/kg_entity_classification/
---

## 📚 Overview
`KGEntityClassification` classifies the types of extracted entities. It takes an entity list, asks an LLM to predict the category of each entity, and writes the predicted labels back to the DataFrame.

By default, it reads from `entity` and writes to `entity_type`. The model output is parsed as JSON when possible; if the returned value is not a list, it is wrapped into a one-element list. If parsing fails, the row falls back to an empty list.

## ✒️ `__init__` Function
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    prompt_template: Union[KGEntityTypeClassificationPrompt, DIYPromptABC] = None,
    num_q: int = 5
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM backend used for classification. |
| `seed` | `int` | `0` | Seed for the internal random generator. |
| `lang` | `str` | `"en"` | Prompt language. |
| `prompt_template` | `Union[KGEntityTypeClassificationPrompt, DIYPromptABC]` | `None` | Custom classification prompt template. |
| `num_q` | `int` | `5` | Reserved parameter; it does not explicitly limit batch size in the current code. |

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "entity",
    output_key: str = "entity_type"
):
    ...
```

`run` reads the DataFrame, validates the input and output columns, and passes the `entity` column row by row into `process_batch()`. During batch processing, the operator builds prompts with `KGEntityTypeClassificationPrompt`, calls the model, and tries to parse the response into a list of entity types. The final predictions are written to `entity_type`.

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Storage object for reading and writing the DataFrame. |
| `input_key` | `str` | `"entity"` | Input column containing entities. |
| `output_key` | `str` | `"entity_type"` | Output column for predicted entity types. |

## 🤖 Example Usage
```python
from dataflow.operators.general_kg.refinement.kg_entity_classification import (
    KGEntityClassification,
)

operator = KGEntityClassification(
    llm_serving=llm_serving,
    lang="en",
)

operator.run(
    storage=storage,
    input_key="entity",
    output_key="entity_type",
)
```

Default input and output format:

| Field | Type | Description |
| :-- | :-- | :-- |
| `entity` | `str` | Input entity string; in the current testing data it is usually a comma-separated entity list. |
| `entity_type` | `List[str]` | Type labels aligned with the order of the input entities. |

Example input:

```json
[
  {
    "entity": "Albert Einstein, Princeton University"
  }
]
```

Example output:

```json
[
  {
    "entity_type": ["Person", "Organization"]
  }
]
```

Related files:

- Operator implementation: `DataFlow-KG/dataflow/operators/general_kg/refinement/kg_entity_classification.py`
