---
title: HRKGRelationTripleAttributeFilter
createTime: 2026/03/18 00:00:00
permalink: /en/kg_operators/hyper_relation_kg/filter/hrkg_rel_triple_attribute_filtering/
---

## 📚 Overview

[HRKGRelationTripleAttributeFilter](https://github.com/ZhP-Li197/DataFlow-KG/tree/main/dataflow/operators/hyper_relation_kg/filter/hrkg_rel_triple_attri_filtering.py) is a hyper-relational KG triple attribute filtering operator. It filters hyper-relational tuples by a specified attribute tag, keeping only those tuples that contain the target attribute. The operator parses each tuple string to extract its structured components (subject, object, relation, and attributes) and performs string-level matching against the specified attribute tag. The filtered results are written to a new column.

## ✒️ `__init__` Function

```python
def __init__(self, llm_serving: LLMServingABC = None, lang: str = "en"):
```

#### Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `llm_serving` | `LLMServingABC` | `None` | Reserved parameter for future extension (currently unused). |
| `lang` | `str` | `"en"` | Language setting; reserved for future extension. |

#### Prompt Template

This operator is rule-based and does not use LLM prompt templates.

## 💡 `run` Function

`run` reads a DataFrame from `storage`, validates that it contains the column specified by `input_key`. It then iterates over each row: if the row is a list, it calls `_filter_triples_by_attr()` to retain only those tuples containing the specified `attr_tag`; otherwise it writes an empty list. The filtered result is written into the `output_key` column. The function returns a list containing the `output_key` string.

```python
def run(self, storage: DataFlowStorage, input_key: str = "tuple", output_key: str = "filtered_tuple", attr_tag: str = "<Location>"):
```

#### Parameters

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `storage` | `DataFlowStorage` | Required | DataFlow storage instance, responsible for reading and writing data. |
| `input_key` | `str` | `"tuple"` | Input column name, corresponding to the triple list field. |
| `output_key` | `str` | `"filtered_tuple"` | Output column name, corresponding to the filtered triple list field. |
| `attr_tag` | `str` | `<Location>` | Attribute tag to filter by; only tuples containing this tag are retained. Supports any tag in the form `<TagName>`, such as `<Time>`, `<Location>`, `<Value>`, `<Capacity>`, etc. |

## 🤖 Example Usage

```python
from dataflow.operators.hyper_relation_kg.filter import HRKGRelationTripleAttributeFilter
from dataflow.utils.storage import FileStorage

storage = FileStorage(first_entry_file_name="hrkg_attribute_filter.json")

filter_op = HRKGRelationTripleAttributeFilter()
filter_op.run(
    storage.step(),
    input_key="tuple",
    output_key="filtered_tuple",
    attr_tag="<Location>",
)
```

#### Default Output Format

| Field | Type | Description |
| --- | --- | --- |
| `tuple` | `List[str]` | Input original triple list (preserved). |
| `filtered_tuple` | `List[str]` | Filtered triple list containing only tuples with the specified attribute tag. |

**Example Input:**

```json
{
  "tuple": [
    "<subj> Elon Musk <obj> Announcement <rel> MadeAt <time> May 15, 2025 <location> Tesla Gigafactory, Berlin, Germany",
    "<subj> Tesla Model Y <obj> 4680 Battery <rel> WillAdopt <time> Third quarter of 2025 <location> European market",
    "<subj> Tesla Model Y <obj> Cruising Range <rel> IncreasedTo <value> 600 kilometers",
    "<subj> Tesla Model Y <obj> Price <rel> RemainsUnchanged <value> 49,990 euros",
    "<subj> Berlin Gigafactory <obj> Production <rel> Started <time> March 2022 <capacity> 500,000 vehicles <market> European Union, United Kingdom, Norway"
  ]
}
```

**Example Output (attr_tag=`<Location>`):**

```json
{
  "tuple": ["...(same as above)"],
  "filtered_tuple": [
    "<subj> Elon Musk <obj> Announcement <rel> MadeAt <time> May 15, 2025 <location> Tesla Gigafactory, Berlin, Germany",
    "<subj> Tesla Model Y <obj> 4680 Battery <rel> WillAdopt <time> Third quarter of 2025 <location> European market"
  ]
}
```

**Example Output (attr_tag=`<Time>`):**

```json
{
  "tuple": ["...(same as above)"],
  "filtered_tuple": [
    "<subj> Elon Musk <obj> Announcement <rel> MadeAt <time> May 15, 2025 <location> Tesla Gigafactory, Berlin, Germany",
    "<subj> Tesla Model Y <obj> 4680 Battery <rel> WillAdopt <time> Third quarter of 2025 <location> European market",
    "<subj> Berlin Gigafactory <obj> Production <rel> Started <time> March 2022 <capacity> 500,000 vehicles <market> European Union, United Kingdom, Norway"
  ]
}
```

---

#### Related Links

- Operator implementation: `DataFlow-KG/dataflow/operators/hyper_relation_kg/filter/hrkg_rel_triple_attri_filtering.py`
