---
title: KGGraphEntityAligner
createTime: 2026/04/11 12:30:00
permalink: /en/kg_operators/general_kg/refine/kg_entity_alignment/
---

## 📚 Overview
`KGGraphEntityAligner` aligns entities between two independent knowledge graphs represented as triple lists. It extracts entity mentions from both graphs, computes fuzzy string similarity between candidate pairs, and keeps the best alignment result for each entity in KG1.

This operator does not depend on an LLM. Instead, it uses `fuzzywuzzy.fuzz.ratio` for local string matching, so it is lightweight and fast for entity normalization and graph merging workflows. By default, it reads `triples_kg1` and `triples_kg2`, then writes the alignment results to `entity_alignment`.

## ✒️ `__init__` Function
```python
def __init__(self, top_k: int = 5, threshold: int = 70):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `top_k` | `int` | `5` | Maximum number of candidate matches retained for each source entity before selecting the best one. |
| `threshold` | `int` | `70` | Minimum fuzzy-match similarity score from `0` to `100`. Candidates below this threshold are discarded. |

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key_kg1: str = "triples_kg1",
    input_key_kg2: str = "triples_kg2",
    output_key: str = "entity_alignment"
):
    ...
```

`run` reads the DataFrame from `storage` and currently assumes the alignment task is stored in the first row. It then performs three internal steps. First, `_extract_entities()` parses unique entity mentions from strings containing `<subj>`, `<obj>`, or `<entity>` tags. Second, `_generate_candidates()` compares every KG1 entity with every KG2 entity using case-insensitive fuzzy matching and keeps the top `top_k` candidates above `threshold`. Third, `_align_entities()` selects the highest-similarity candidate for each KG1 entity and writes the final list to `output_key`.

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Storage object used to read and write the DataFrame. |
| `input_key_kg1` | `str` | `"triples_kg1"` | Column containing triple strings from the first KG. |
| `input_key_kg2` | `str` | `"triples_kg2"` | Column containing triple strings from the second KG. |
| `output_key` | `str` | `"entity_alignment"` | Output column for alignment results. |

## 🤖 Example Usage
```python
from dataflow.operators.general_kg.refinement.kg_entity_alignment import (
    KGGraphEntityAligner,
)

operator = KGGraphEntityAligner(
    top_k=3,
    threshold=85,
)

operator.run(
    storage=storage,
    input_key_kg1="triples_kg1",
    input_key_kg2="triples_kg2",
    output_key="entity_alignment",
)
```

Default input and output format:

| Field | Type | Description |
| :-- | :-- | :-- |
| `triples_kg1` | `List[str]` | Triple or tuple strings from KG1, usually with `<subj>`, `<obj>`, or `<entity>` tags. |
| `triples_kg2` | `List[str]` | Triple or tuple strings from KG2. |
| `entity_alignment` | `List[Dict]` | Alignment results with `entity_kg1`, `entity_kg2`, and `similarity`. |

Example input:

```json
[
  {
    "triples_kg1": [
      "<subj> Apple Inc. <rel> founded by <obj> Steve Jobs",
      "<entity> iPhone 15"
    ],
    "triples_kg2": [
      "<subj> Apple <rel> is headquartered in <obj> Cupertino",
      "<subj> Steven Paul Jobs <rel> died in <obj> 2011",
      "<entity> IPHONE 15"
    ]
  }
]
```

Example output:

```json
[
  {
    "entity_alignment": [
      {
        "entity_kg1": "iPhone 15",
        "entity_kg2": "IPHONE 15",
        "similarity": 100
      }
    ]
  }
]
```

In this example, `Apple Inc.` may be excluded if the threshold is set higher than its similarity score against `Apple`.

Related files:

- Operator implementation: `DataFlow-KG/dataflow/operators/general_kg/refinement/kg_entity_alignment.py`
