---
title: KGRelationTripleInference
createTime: 2026/04/11 12:00:00
permalink: /en/kg_operators/general_kg/generate/kg_rel_triple_inference/
---

## 📚 Overview
`KGRelationTripleInference` infers new implicit triples from existing relation triples. It sends the observed triples to an LLM, asks the model to complete plausible but unstated relation facts, and stores the inferred results in a new column.

When `with_text=True`, the operator also uses the `raw_chunk` text as context. When `merge_to_input=True`, the inferred triples are deduplicated and merged back into the original `triple` column. The model output is expected to contain an `inferred_triple` field; if parsing fails, the row falls back to an empty list.

## ✒️ `__init__` Function
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    with_text: bool = False,
    merge_to_input: bool = False,
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM backend used for triple inference. |
| `seed` | `int` | `0` | Seed for the internal random generator. |
| `lang` | `str` | `"en"` | Prompt language. |
| `with_text` | `bool` | `False` | Whether to include `raw_chunk` text during inference. |
| `merge_to_input` | `bool` | `False` | Whether to merge inferred triples back into the original input column after deduplication. |

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "triple",
    output_key: str = "inferred_triple",
):
    ...
```

`run` reads the DataFrame, checks that `input_key` exists and `output_key` is available, and then collects the input triples. If `with_text` is enabled, it also reads `raw_chunk`. `process_batch()` builds prompts row by row, calls the model, and extracts `inferred_triple` through `_parse_llm_response()`. The results are written to `output_key`; if `merge_to_input` is enabled, the operator also writes a deduplicated merged list back into the original triple column.

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Storage object for the DataFrame. |
| `input_key` | `str` | `"triple"` | Input column containing relation triples. |
| `output_key` | `str` | `"inferred_triple"` | Output column for inferred triples. |

## 🤖 Example Usage
```python
from dataflow.operators.general_kg.generate.kg_rel_triple_inference import (
    KGRelationTripleInference,
)

operator = KGRelationTripleInference(
    llm_serving=llm_serving,
    lang="en",
    with_text=False,
    merge_to_input=False,
)

operator.run(
    storage=storage,
    input_key="triple",
    output_key="inferred_triple",
)
```

Default input and output format:

| Field | Type | Description |
| :-- | :-- | :-- |
| `triple` | `List[str]` | Input relation triples. |
| `raw_chunk` | `str` | Optional text context, used only when `with_text=True`. |
| `inferred_triple` | `List[str]` | Newly inferred triples produced by the model. |

Example input:

```json
[
  {
    "triple": [
      "<subj> Paris <obj> France <rel> capital_of",
      "<subj> France <obj> Europe <rel> located_in"
    ]
  }
]
```

Example output:

```json
[
  {
    "triple": [
      "<subj> Paris <obj> France <rel> capital_of",
      "<subj> France <obj> Europe <rel> located_in"
    ],
    "inferred_triple": [
      "<subj> Paris <obj> Europe <rel> located_in"
    ]
  }
]
```

Related files:

- Operator implementation: `DataFlow-KG/dataflow/operators/general_kg/generate/kg_rel_triple_inference.py`
- Prompt definitions: `DataFlow-KG/dataflow/prompts/core_kg/rel_triple_generate.py`
