---
title: GeoKGEventExtraction
createTime: 2026/04/13 09:00:00
permalink: /en/kg_operators/domain_kg/geospatial_kg/generate/geokg_event_extractor/
---

## 📚 Overview

`GeoKGEventExtraction` extracts spatio-temporal event tuples from geographic text. The default output column is named `tuple`, but the stored content is actually event tuples in the following form:

`<event> event description <location> location <time> time <...> optional fields`

Each item must contain at least `<event>`, `<location>`, and `<time>`. If the text does not explicitly mention time, the prompt standard is to output `NA` for `<time>`.

## ✒️ `__init__` Function

```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    prompt_template: Union[GeoKGEventExtractorPrompt, DIYPromptABC] = None,
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM backend |
| `seed` | `int` | `0` | Random seed |
| `lang` | `str` | `"en"` | Prompt language |
| `prompt_template` | `Union[GeoKGEventExtractorPrompt, DIYPromptABC]` | `None` | Custom prompt; falls back to the default geospatial event extractor prompt |

## 💡 `run` Function

```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "raw_chunk",
    output_key: str = "tuple",
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Input/output storage object |
| `input_key` | `str` | `"raw_chunk"` | Input text column |
| `output_key` | `str` | `"tuple"` | Output column for event tuples |

The operator validates that `input_key` exists and that `output_key` does not already exist. The raw model response is expected to be JSON with key `"tuple"`, which is then written back row by row.

## 🤖 Example Usage

```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.geospatial_kg.generate.geokg_event_extractor import (
    GeoKGEventExtraction,
)

storage = DummyStorage()
storage.set_data([
    {
        "raw_chunk": "On 2025-03-03, an earthquake struck Tokyo and disrupted rail service."
    }
])

op = GeoKGEventExtraction(llm_serving=llm_serving, lang="en")
op.run(storage=storage)
```

#### Example Input

```json
{
  "raw_chunk": "On 2025-03-03, an earthquake struck Tokyo and disrupted rail service."
}
```

#### Example Output

```json
{
  "tuple": [
    "<event> earthquake struck Tokyo <location> Tokyo <time> 2025-03-03 <effect> rail service disrupted"
  ]
}
```


