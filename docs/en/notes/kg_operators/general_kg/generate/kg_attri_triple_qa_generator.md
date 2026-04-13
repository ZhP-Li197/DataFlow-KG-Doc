---
title: KGAttributeTripleQAGeneration
createTime: 2026/04/11 12:00:00
permalink: /en/kg_operators/general_kg/generate/kg_attri_triple_qa_generator/
---

## 📚 Overview
`KGAttributeTripleQAGeneration` generates QA pairs from attribute triples or attribute-oriented descriptions. It uses an LLM to produce structured `QA_pairs` and supports single-entity QA as well as multi-entity base, numeric, and set-style QA generation.

By default, the operator reads from `triple` and writes to `QA_pairs`. Internally it selects the prompt template according to `qa_type`, extracts a JSON block from the model output with a regex, and then reads the `QA_pairs` field. If parsing fails, the sample falls back to an empty list.

## ✒️ __init__ Function
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    qa_type: str = "single",
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM backend used to generate QA pairs. |
| `seed` | `int` | `0` | Seed for the internal random generator. |
| `lang` | `str` | `"en"` | Prompt language. |
| `qa_type` | `str` | `"single"` | Generation mode. Supported values are `single`, `multi_base`, `multi_num`, and `multi_set`. |

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "triple",
    output_key: str = "QA_pairs",
):
    ...
```

`run` reads the DataFrame from `storage`, validates that the input column exists and the output column does not already exist, and then sends the values in `input_key` to `process_batch()`. In `process_batch()`, the operator builds prompts row by row, calls `llm_serving.generate_from_input()`, and parses the returned `QA_pairs` through `_parse_llm_response()`. The final QA lists are written back to `output_key`.

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Storage object used to read and write the DataFrame. |
| `input_key` | `str` | `"triple"` | Input column containing attribute triples. |
| `output_key` | `str` | `"QA_pairs"` | Output column for generated QA pairs. |

## 🤖 Example Usage
```python
from dataflow.operators.general_kg.generate.kg_attri_triple_qa_generator import (
    KGAttributeTripleQAGeneration,
)

operator = KGAttributeTripleQAGeneration(
    llm_serving=llm_serving,
    lang="en",
    qa_type="multi_num",
)

operator.run(
    storage=storage,
    input_key="triple",
    output_key="QA_pairs",
)
```

Default input and output format:

| Field | Type | Description |
| :-- | :-- | :-- |
| `triple` | `List[str]` | Input attribute triple list; in the testing data it is typically a list of strings shaped like `<entity> ... <attribute> ... <value> ...`. |
| `QA_pairs` | `List[Dict]` | Generated QA pairs. |

Example input:

```json
[
  {
    "triple": [
      "<entity> Henry <attribute> nationality <value> Canadian",
      "<entity> Henry <attribute> profession <value> musician",
      "<entity> Maple Leaves <attribute> debut_album <value> Polar Lights"
    ]
  }
]
```

Example output:

```json
[
  {
    "triple": [
      "<entity> Henry <attribute> nationality <value> Canadian",
      "<entity> Henry <attribute> profession <value> musician",
      "<entity> Maple Leaves <attribute> debut_album <value> Polar Lights"
    ],
    "QA_pairs": [
      {
        "question": "What is Henry's profession?",
        "answer": "Henry is a musician."
      }
    ]
  }
]
```

Related files:

- Operator implementation: `DataFlow-KG/dataflow/operators/general_kg/generate/kg_attri_triple_qa_generator.py`
- Prompt definitions: `DataFlow-KG/dataflow/prompts/core_kg/attri_triple.py`
