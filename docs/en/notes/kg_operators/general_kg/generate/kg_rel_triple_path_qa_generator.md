---
title: KGRelationTriplePathQAGeneration
createTime: 2026/04/11 12:00:00
permalink: /en/kg_operators/general_kg/generate/kg_rel_triple_path_qa_generator/
---

## 📚 Overview
`KGRelationTriplePathQAGeneration` generates QA pairs from KG path triples. It supports both one-hop and multi-hop paths and uses different prompt templates to guide the model toward path-grounded question answering.

When `hop=1`, the operator reads from `triple`. When `hop>1`, the input column name becomes `"{hop}_{input_key_meta}"`, such as `2_hop_paths`. After generation, it parses `QA_pairs` from the returned JSON and requires each sample to contain at least 2 QA pairs; otherwise that sample is dropped.

## ✒️ `__init__` Function
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang="en",
    hop=1,
    num_q: int = 5
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM backend used for QA generation. |
| `seed` | `int` | `0` | Seed for the internal random generator. |
| `lang` | `str` | `"en"` | Prompt language. |
| `hop` | `int` | `1` | Hop count of the path. `1` uses the one-hop prompt and `2` uses the two-hop prompt. |
| `num_q` | `int` | `5` | Reserved QA-count parameter. It is not directly enforced in the current post-processing logic. |

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key_meta: str = "hop_paths",
    output_key: str = "QA_pairs"
):
    ...
```

`run` determines the actual input column based on `hop`, then validates the DataFrame. `process_batch()` builds prompts for each path, calls the model, and extracts `QA_pairs` from the returned JSON. If `QA_pairs` is not a list or contains fewer than 2 items, the sample is excluded. The remaining generated QA pairs are written to `output_key`.

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Storage object for the DataFrame. |
| `input_key_meta` | `str` | `"hop_paths"` | Input column suffix in multi-hop mode. |
| `output_key` | `str` | `"QA_pairs"` | Output column for generated QA pairs. |

## 🤖 Example Usage
```python
from dataflow.operators.general_kg.generate.kg_rel_triple_path_qa_generator import (
    KGRelationTriplePathQAGeneration,
)

operator = KGRelationTriplePathQAGeneration(
    llm_serving=llm_serving,
    lang="en",
    hop=2,
)

operator.run(
    storage=storage,
    input_key_meta="hop_paths",
    output_key="QA_pairs",
)
```

Default input and output format:

| Field | Type | Description |
| :-- | :-- | :-- |
| `triple` / `2_hop_paths` | `str` / `List[str]` | Input path triples. |
| `QA_pairs` | `List[Dict]` | Generated QA pairs. |

Example input:

```json
[
  {
    "2_hop_paths": "<subj> Einstein <obj> Germany <rel> born_in || <subj> Germany <obj> Europe <rel> part_of"
  }
]
```

Example output:

```json
[
  {
    "2_hop_paths": "<subj> Einstein <obj> Germany <rel> born_in || <subj> Germany <obj> Europe <rel> part_of",
    "QA_pairs": [
      "Question: In which continent was Einstein born? Answer: Europe",
      "Question: Einstein was born in a country that is part of which continent? Answer: Europe"
    ]
  }
]
```

Related files:

- Operator implementation: `DataFlow-KG/dataflow/operators/general_kg/generate/kg_rel_triple_path_qa_generator.py`
- Prompt definitions: `DataFlow-KG/dataflow/prompts/core_kg/rel_triple_generate.py`
