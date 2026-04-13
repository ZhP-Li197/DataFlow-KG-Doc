---
title: HRKGTupleAttributeFrequencyEvaluator
createTime: 2026/03/18 00:00:00
permalink: /en/kg_operators/hyper_relation_kg/eval/hrkg_rel_triple_attri_summary/
---

## 📚 Overview

[HRKGTupleAttributeFrequencyEvaluator](https://github.com/ZhP-Li197/DataFlow-KG/tree/main/dataflow/operators/hyper_relation_kg/eval/hrkg_rel_triple_attri_summary.py) is a hyper-relational KG tuple attribute frequency statistics evaluator. It analyzes attribute tags in the input tuple list and computes the occurrence count and frequency distribution of each attribute label (e.g., Time, Location, Value, Capacity) across the entire dataset. The operator uses a regex pattern to extract attribute tags from tuple strings and aggregates statistics over all tuples, helping users understand the attribute coverage and distribution characteristics in hyper-relational knowledge graphs.

## ✒️ `__init__` Function

```python
def __init__(self):
```

#### Parameters

This operator has no initialization parameters.

#### Prompt Template

This operator is rule-based and does not use LLM prompt templates.

## 💡 `run` Function

`run` reads a DataFrame from `storage`, validates the storage is available, and iterates over each row. For each tuple in the tuple list (supporting both Python list and JSON string formats), it extracts attribute tags enclosed in angle brackets (e.g., `<Time>`, `<Location>`, `<Value>`, `<Capacity>`) using a regex pattern. It aggregates attribute occurrence counts across the entire dataset, then computes the relative frequency as `count / total_tuples` for each attribute. The aggregated results are written as a single row DataFrame containing `attribute_counts` and `attribute_frequencies` columns. The function returns a list containing both output key strings.

```python
def run(self, storage: DataFlowStorage = None, input_key: str = "tuple", output_key: str = "attribute_counts", output_key_meta: str = "attribute_frequencies"):
```

#### Parameters

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| **storage** | DataFlowStorage | None | DataFlow storage instance, responsible for reading and writing data. |
| **input_key** | str | "tuple" | Input column name, corresponding to the hyper-relational tuple list field. Each row can be a Python list or a JSON-encoded string. |
| **output_key** | str | "attribute_counts" | Output column name for attribute occurrence counts; maps each attribute label to its total count. |
| **output_key_meta** | str | "attribute_frequencies" | Output column name for attribute relative frequencies; maps each attribute label to `count / total_tuples`. |

## 🤖 Example Usage

```python
from dataflow.operators.hyper_relation_kg.eval import HRKGTupleAttributeFrequencyEvaluator
from dataflow.utils.storage import FileStorage

storage = FileStorage(first_entry_file_name="hrkg_attribute_stats.json")

operator = HRKGTupleAttributeFrequencyEvaluator()
operator.run(
    storage.step(),
    input_key="tuple",
    output_key="attribute_counts",
    output_key_meta="attribute_frequencies",
)
```

#### Default Output Format

| Field | Type | Description |
| --- | --- | --- |
| attribute_counts | Dict[str, int] | Attribute label to occurrence count mapping (e.g., `{"Time": 120, "Location": 85, "Value": 60}`). |
| attribute_frequencies | Dict[str, float] | Attribute label to relative frequency mapping; frequency is computed as `count / total_tuples`. |

**Example Input:**

```json
[
  {
    "tuple": [
      "<subj> Elon Musk <obj> Announcement <rel> MadeAt <Time> May 15, 2025 <Location> Tesla Gigafactory, Berlin, Germany",
      "<subj> Tesla Model Y <obj> 4680 Battery <rel> WillAdopt <Time> Third quarter of 2025 <Location> European market",
      "<subj> Tesla Model Y <obj> Cruising Range <rel> IncreasedTo <Value> 600 kilometers",
      "<subj> Tesla Model Y <obj> Price <rel> RemainsUnchanged <Value> 49,990 euros",
      "<subj> Berlin Gigafactory <obj> Production <rel> Started <Time> March 2022 <Capacity> 500,000 vehicles <Market> European Union, United Kingdom, Norway"
    ]
  }
]
```

**Example Output:**

```json
{
  "attribute_counts": {
    "Time": 3,
    "Location": 2,
    "Value": 2,
    "Capacity": 1,
    "Market": 1
  },
  "attribute_frequencies": {
    "Time": 0.6,
    "Location": 0.4,
    "Value": 0.4,
    "Capacity": 0.2,
    "Market": 0.2
  }
}
```

---

#### Related Links

- Operator implementation: `DataFlow-KG/dataflow/operators/hyper_relation_kg/eval/hrkg_rel_triple_attri_summary.py`
