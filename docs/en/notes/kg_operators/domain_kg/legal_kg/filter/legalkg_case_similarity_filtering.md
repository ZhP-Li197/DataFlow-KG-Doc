---
title: LegalKGCaseSimilarityFilter
createTime: 2026/04/15 09:00:00
permalink: /en/kg_operators/domain_kg/legal_kg/filter/legalkg_case_similarity_filtering/
---

## 📚 Overview

`LegalKGCaseSimilarityFilter` filters whole DataFrame rows based on case-similarity scores. It reads the input DataFrame, keeps only the rows whose score falls inside the configured range, and writes the filtered DataFrame back to storage.

Although the class docstring mentions `filtered_subgraph`, the current `run()` implementation does not create a new output column. It only filters rows in place.

## ✒️ `__init__` Function

```python
def __init__(self, merge_to_input: bool = False):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `merge_to_input` | `bool` | `False` | Reserved parameter not used in the current filtering logic |

## 💡 `run` Function

```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "triple",
    output_key: str = "similarity_score",
    min_score: float = 0.8,
    max_score: float = 1.0,
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | DataFlow storage object |
| `input_key` | `str` | `"triple"` | Required input column name; the current implementation only validates its existence |
| `output_key` | `str` | `"similarity_score"` | Score column used for filtering |
| `min_score` | `float` | `0.8` | Minimum accepted score |
| `max_score` | `float` | `1.0` | Maximum accepted score |

The operator validates that both `input_key` and `output_key` exist, then applies:

```python
df[(df[output_key] >= min_score) & (df[output_key] <= max_score)]
```

The filtered DataFrame is written back to storage. The function returns `None`.

## 🤖 Example Usage

```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.legal_kg.filter.legalkg_case_similarity_filtering import (
    LegalKGCaseSimilarityFilter,
)

dataframe = pd.DataFrame(
    [
        {
            "triple": ["<entity> Zhang San <attribute> sentence <value> 3 years"],
            "similarity_score": 0.92
        },
        {
            "triple": ["<entity> Li Si <attribute> sentence <value> 1 month detention"],
            "similarity_score": 0.45
        }
    ]
)

storage = DummyStorage()
storage.set_data(dataframe)

operator = LegalKGCaseSimilarityFilter()
operator.run(
    storage=storage,
    input_key="triple",
    output_key="similarity_score",
    min_score=0.8,
    max_score=1.0,
)
```

#### Example Input

```json
[
  {
    "triple": ["<entity> Zhang San <attribute> sentence <value> 3 years"],
    "similarity_score": 0.92
  },
  {
    "triple": ["<entity> Li Si <attribute> sentence <value> 1 month detention"],
    "similarity_score": 0.45
  }
]
```

#### Example Output

```json
[
  {
    "triple": ["<entity> Zhang San <attribute> sentence <value> 3 years"],
    "similarity_score": 0.92
  }
]
```

#### Related Links

- Operator implementation: `DataFlow-KG/dataflow/operators/domain_kg/legal_kg/filter/legalkg_case_similarity_filtering.py`
- Upstream evaluator: `DataFlow-KG/dataflow/operators/domain_kg/legal_kg/eval/legalkg_case_similarity_eval.py`
