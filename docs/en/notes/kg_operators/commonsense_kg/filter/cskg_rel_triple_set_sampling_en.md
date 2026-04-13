---
title: CSKGRelationTripleSetSampling
createTime: 2026/04/01 17:50:00
permalink: /en/kg_operators/commonsense_kg/filter/cskg_rel_triple_set_sampling/
---

## 📚 Overview
`CSKGRelationTripleSetSampling` is a filter-category operator for sampling and constructing related sets of commonsense relation triples.
It aggregates triples across the input dataset, groups them according to subject similarity, object similarity, or identical relations, and writes the resulting related-triple sets into a new DataFrame. This is useful for set-based QA generation or relation-cluster analysis.

Key characteristics of this operator:

- It does not rely on an LLM and instead builds related triple sets with rules, string similarity, and parallel processing
- It reads `triple` by default and writes to `set_triple` by default
- It supports three matching rules: similar subject, similar object, and identical relation
- It supports multi-process execution, chunk-based processing, and global deduplication for large-scale triples
- The current implementation aggregates triples from all rows and writes a brand-new single-column DataFrame instead of appending row-wise results to the original table

---

## ✒️ `__init__` Function
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    num_q: int = 5,
    n_jobs: int = -1
):
    ...
```

#### `__init__` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | Reserved LLM serving parameter. The current implementation does not use it in the sampling logic. |
| `seed` | `int` | `0` | Used to initialize the internal random number generator. The current implementation does not use randomness further in the main workflow. |
| `lang` | `str` | `"en"` | Language parameter that affects string normalization before similarity computation. In English mode, strings are lowercased and stripped of spaces. |
| `num_q` | `int` | `5` | Reserved parameter. In the current implementation, it is stored as an instance attribute but not used in the sampling logic. |
| `n_jobs` | `int` | `-1` | Number of worker processes. `-1` means using all CPU cores; otherwise the value is clamped to at least 1. |

---

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "triple",
    output_key: str = "set_triple",
    match_rule: int = 1,
    similarity_threshold: float = 0.7,
    deduplicate_sets: bool = True,
    chunk_size: int = 5000
):
    ...
```

`run` first reads a DataFrame from `storage`, validates the input and output columns, and then aggregates all triples across input rows. The operator parses and deduplicates triples into `(subj, rel, obj, raw_triple)` form, builds indexes, and then generates related triple sets according to `match_rule`: rule 1 groups by similar subjects, rule 2 groups by similar objects, and rule 3 groups by identical relations. The entire process supports index prebuilding, chunked multiprocessing, and global set deduplication. The final result is not appended back to the original DataFrame; instead, the operator writes a new one-column DataFrame containing only `output_key`.

#### `run` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow storage object. The operator reads the `dataframe` from it and writes a new set-result DataFrame back. |
| `input_key` | `str` | `"triple"` | Input triple column name. Each row usually contains a triple list. |
| `output_key` | `str` | `"set_triple"` | Output column name used to store related triple sets. |
| `match_rule` | `int` | `1` | Matching rule. `1` means similar subject, `2` means similar object, and `3` means identical relation. |
| `similarity_threshold` | `float` | `0.7` | Similarity threshold used in rules 1 and 2. |
| `deduplicate_sets` | `bool` | `True` | Whether to globally deduplicate the generated related sets. |
| `chunk_size` | `int` | `5000` | Chunk size used to balance memory usage and throughput during parallel processing. |

---

## 🤖 Example Usage
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.commonsense_kg.filter.cskg_rel_triple_set_sampling import (
    CSKGRelationTripleSetSampling,
)

operator = CSKGRelationTripleSetSampling(
    llm_serving=YourLLMServing(...),
    lang="en",
    n_jobs=1,
)
operator.run(
    storage=storage,
    input_key="triple",
    output_key="set_triple",
    match_rule=3,
    similarity_threshold=0.7,
)
```

---

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `set_triple` | `List[List[str]]` | List of related triple sets. Each item is one set of related triples rather than a row-aligned result. |

---

#### Example Input
```json
[
  {
    "triple": [
      "<subj> Tom <obj> umbrella <rel> uses",
      "<subj> Mary <obj> umbrella <rel> uses"
    ]
  },
  {
    "triple": [
      "<subj> Tom <obj> raincoat <rel> uses"
    ]
  }
]
```

#### Example Output
```json
[
  {
    "set_triple": [
      "<subj> Tom <obj> umbrella <rel> uses",
      "<subj> Mary <obj> umbrella <rel> uses",
      "<subj> Tom <obj> raincoat <rel> uses"
    ]
  }
]
```

---

#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/commonsense_kg/filter/cskg_rel_triple_set_sampling.py`
- Downstream QA-generation operator: `DataFlow-KG/dataflow/operators/commonsense_kg/generate/cskg_rel_triple_qa_generator.py`
- Storage implementation: `DataFlow-KG/dataflow/utils/storage.py`

