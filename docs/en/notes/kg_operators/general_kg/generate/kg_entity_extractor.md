---
title: KGEntityExtraction
createTime: 2026/04/11 12:00:00
permalink: /en/kg_operators/general_kg/generate/kg_entity_extractor/
---

## 📚 Overview
`KGEntityExtraction` extracts entity mentions from raw text. It only performs entity identification, not relation extraction or attribute extraction, so it is typically used as an early-stage operator in a KG construction pipeline.

The operator includes built-in preprocessing: text length must be between 10 and 200000 characters, the text must contain at least 2 Chinese or English sentence delimiters, and the special-character ratio must not exceed 30%. After generation, it parses the returned JSON array into an entity list, joins the items into a comma-separated string, and removes common stopwords. If validation or parsing fails, it returns an empty string.

## ✒️ `__init__` Function
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    prompt_template: Union[KGEntityExtractionPrompt, DIYPromptABC] = None,
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM backend used for entity extraction. |
| `seed` | `int` | `0` | Seed for the internal random generator. |
| `lang` | `str` | `"en"` | Language of the default prompt. |
| `prompt_template` | `Union[KGEntityExtractionPrompt, DIYPromptABC]` | `None` | Custom prompt template. If omitted, the default prompt is used. |

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "raw_chunk",
    output_key: str = "entity",
):
    ...
```

`run` reads the DataFrame, validates `input_key` and `output_key`, and then processes each text row. Inside `process_batch()`, each text first goes through `_preprocess_text()`. Only texts that pass the quality checks are sent to the LLM. The model output is parsed by `_parse_llm_response()` into a normalized entity string and then written to `output_key`.

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Storage object for reading and writing the DataFrame. |
| `input_key` | `str` | `"raw_chunk"` | Input column containing raw text. |
| `output_key` | `str` | `"entity"` | Output column for extracted entities. |

## 🤖 Example Usage
```python
from dataflow.operators.general_kg.generate.kg_entity_extractor import (
    KGEntityExtraction,
)

operator = KGEntityExtraction(
    llm_serving=llm_serving,
    lang="en",
)

operator.run(
    storage=storage,
    input_key="raw_chunk",
    output_key="entity",
)
```

Default input and output format:

| Field | Type | Description |
| :-- | :-- | :-- |
| `raw_chunk` | `str` | Input raw text. |
| `entity` | `str` | Extracted entities, usually as a comma-separated string. |

Example input:

```json
[
  {
    "raw_chunk": "Albert Einstein was a German-born theoretical physicist. He developed the theory of relativity."
  }
]
```

Example output:

```json
[
  {
    "raw_chunk": "Albert Einstein was a German-born theoretical physicist. He developed the theory of relativity.",
    "entity": "Albert Einstein, theoretical physicist, theory relativity"
  }
]
```

Related files:

- Operator implementation: `DataFlow-KG/dataflow/operators/general_kg/generate/kg_entity_extractor.py`
- Prompt definitions: `DataFlow-KG/dataflow/prompts/core_kg/rel_triple_generate.py`
