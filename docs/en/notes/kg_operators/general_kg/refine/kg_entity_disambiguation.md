---
title: KGEntityDisambiguation
createTime: 2026/04/11 13:00:00
permalink: /en/kg_operators/general_kg/refine/kg_entity_disambiguation/
---

## 📚 Overview
`KGEntityDisambiguation` resolves ambiguous entity mentions in text. It combines raw text context with a list of candidate entities and asks an LLM to return clearer, more canonical forms for those entities.

By default, the operator reads `raw_chunk` and `entity` and writes to `disambiguated_entity`. Before sending the request to the model, the text goes through quality checks on length, sentence count, and special-character ratio. If the text fails validation, an empty string is used as context.

## ✒️ __init__ Function
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    prompt_template: Union[KGEntityDisambiguationPrompt, DIYPromptABC] = None,
    num_q: int = 5
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM backend used for disambiguation. |
| `seed` | `int` | `0` | Seed for the internal random generator. |
| `lang` | `str` | `"en"` | Prompt language. |
| `prompt_template` | `Union[KGEntityDisambiguationPrompt, DIYPromptABC]` | `None` | Custom disambiguation prompt. |
| `num_q` | `int` | `5` | Reserved parameter. |

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "raw_chunk",
    input_key_meta: str = "entity",
    output_key: str = "disambiguated_entity"
):
    ...
```

`run` reads the DataFrame, validates the text column, entity column, and output column, and then processes each row through `process_batch()`. During processing, the text is first cleaned by `_preprocess_text()`, then `KGEntityDisambiguationPrompt` is used to build the request sent to the model. In the current implementation, the raw model response is written directly to `disambiguated_entity` without extra JSON parsing.

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Storage object for the DataFrame. |
| `input_key` | `str` | `"raw_chunk"` | Input column containing raw text. |
| `input_key_meta` | `str` | `"entity"` | Input column containing entity candidates. |
| `output_key` | `str` | `"disambiguated_entity"` | Output column for disambiguation results. |

## 🤖 Example Usage
```python
from dataflow.operators.general_kg.refinement.kg_entity_disambiguation import (
    KGEntityDisambiguation,
)

operator = KGEntityDisambiguation(
    llm_serving=llm_serving,
    lang="en",
)

operator.run(
    storage=storage,
    input_key="raw_chunk",
    input_key_meta="entity",
    output_key="disambiguated_entity",
)
```

Default input and output format:

| Field | Type | Description |
| :-- | :-- | :-- |
| `raw_chunk` | `str` | Input raw text. |
| `entity` | `str` / `List[str]` | Candidate entities to disambiguate; in the testing data a comma-separated string is more common. |
| `disambiguated_entity` | `str` | Raw disambiguation result returned by the model. |

Example input:

```json
[
  {
    "raw_chunk": "Jordan won six NBA championships with the Bulls.",
    "entity": "Jordan, Bulls"
  }
]
```

Example output:

```json
[
  {
    "disambiguated_entity": "Michael Jordan, Chicago Bulls"
  }
]
```

Related files:

- Operator implementation: `DataFlow-KG/dataflow/operators/general_kg/refinement/kg_entity_disambiguation.py`
