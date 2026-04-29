---
title: HRKGTripleConsistencyFilter
createTime: 2026/03/18 00:00:00
permalink: /en/kg_operators/hyper_relation_kg/filter/hrkg_rel_triple_consistency_filtering/
---

## 📚 Overview

[HRKGTripleConsistencyFilter](https://github.com/ZhP-Li197/DataFlow-KG/tree/main/dataflow/operators/hyper_relation_kg/filter/hrkg_rel_triple_consistency_filtering.py) is a hyper-relational KG triple filtering operator based on consistency scores. It filters tuples whose consistency scores fall within a user-specified range. The operator aligns triples and scores by position and retains only those satisfying `min_score <= score <= max_score`. The filtered results can be written to a new column or overwrite the input column via parameters for flexible integration into different pipelines.

## ✒️ `__init__` Function

```python
def __init__(self, merge_to_input: bool = False):
```

#### Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `merge_to_input` | `bool` | `False` | If `True`, filter results overwrite the input column; if `False`, write to a new output column. |

#### Prompt Template

This operator is rule-based and does not use LLM prompt templates.

## 💡 `run` Function

`run` reads a DataFrame from `storage`, validates that it contains both the `input_key` column and the `score_key` column. It then iterates over each row, aligns the triple list and score list by position, and retains only those tuples where `min_score <= score <= max_score`. When `merge_to_input=True`, the filtered result overwrites the original `input_key` column; otherwise it is written to `output_key`. If either the triple column or the score column in a row is not a list, an empty list is written for that row. The function returns a list containing the affected column names.

```python
def run(self, storage: DataFlowStorage, input_key: str = "tuple", score_key: str = "consistency_scores", output_key: str = "filtered_tuple", min_score: float = 0.95, max_score: float = 1.0):
```

#### Parameters

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `storage` | `DataFlowStorage` | Required | DataFlow storage instance, responsible for reading and writing data. |
| `input_key` | `str` | `"tuple"` | Input column name, corresponding to the triple list field. |
| `score_key` | `str` | `"consistency_scores"` | Score column name, corresponding to the aligned score list field. |
| `output_key` | `str` | `"filtered_tuple"` | Output column name, corresponding to the filtered triple list field (used when `merge_to_input=False`). |
| `min_score` | `float` | `0.95` | Minimum score threshold (inclusive). |
| `max_score` | `float` | `1.0` | Maximum score threshold (inclusive). |

## 🤖 Example Usage

```python
from dataflow.operators.hyper_relation_kg.filter import HRKGTripleConsistencyFilter
from dataflow.utils.storage import FileStorage

storage = FileStorage(first_entry_file_name="hrkg_consistency.json")

filter_op = HRKGTripleConsistencyFilter(merge_to_input=False)
filter_op.run(
    storage.step(),
    input_key="tuple",
    score_key="consistency_scores",
    output_key="filtered_tuple",
    min_score=0.95,
    max_score=1.0,
)
```

#### Default Output Format

| Field | Type | Description |
| --- | --- | --- |
| `tuple` | `List[str]` | Input original triple list (preserved). |
| `consistency_scores` | `List[float]` | Aligned consistency scores for each tuple. |
| `filtered_tuple` | `List[str]` | Filtered triple list where scores fall within the specified range. |

**Example Input:**

```json
{
  "tuple": [
    "<subj> Elon Musk <obj> Announcement <rel> MadeAt <time> May 15, 2025 <location> Tesla Gigafactory, Berlin, Germany",
    "<subj> Tesla Model Y <obj> 4680 Battery <rel> WillAdopt <time> Third quarter of 2025 <location> European market",
    "<subj> Tesla Model Y <obj> Cruising Range <rel> IncreasedTo <value> 600 kilometers",
    "<subj> Tesla Model Y <obj> Price <rel> RemainsUnchanged <value> 49,990 euros"
  ],
  "consistency_scores": [1.0, 0.9, 1.0, 0.95]
}
```

**Example Output (min_score=0.95, max_score=1.0):**

```json
{
  "tuple": ["...(same as above)"],
  "consistency_scores": [1.0, 0.9, 1.0, 0.95],
  "filtered_tuple": [
    "<subj> Elon Musk <obj> Announcement <rel> MadeAt <time> May 15, 2025 <location> Tesla Gigafactory, Berlin, Germany",
    "<subj> Tesla Model Y <obj> Cruising Range <rel> IncreasedTo <value> 600 kilometers",
    "<subj> Tesla Model Y <obj> Price <rel> RemainsUnchanged <value> 49,990 euros"
  ]
}
```

---

#### Related Links

- Operator implementation: `DataFlow-KG/dataflow/operators/hyper_relation_kg/filter/hrkg_rel_triple_consistency_filtering.py`
- Upstream operator: `DataFlow-KG/dataflow/operators/hyper_relation_kg/eval/hrkg_rel_triple_consistency_eval.py`
