---
title: TKGTupleMerger
createTime: 2026/04/07 09:00:00
permalink: /en/kg_operators/temporal_kg/generate/tkg_4tuple_merge/
---

#### 📚 Overview

`TKGTupleMerger` merges two temporal KG quadruple sets and separates the result into `unambiguous` and `ambiguous` parts. It supports both relation quadruples and attribute quadruples. If `entity_alignment` is provided, entities from KG2 are mapped into KG1 before merging.

#### 📚 `__init__` Function

```python
def __init__(self):
    ...
```

This operator has no extra initialization arguments.

#### 💡 `run` Function

```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key_kg1: str = "triples_kg1",
    input_key_kg2: str = "triples_kg2",
    input_key_alignment: str = "entity_alignment",
    output_key: str = "merged_quads"
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Input/output storage object |
| `input_key_kg1` | `str` | `"triples_kg1"` | Column containing the first quadruple set |
| `input_key_kg2` | `str` | `"triples_kg2"` | Column containing the second quadruple set |
| `input_key_alignment` | `str` | `"entity_alignment"` | Column containing entity alignment results |
| `output_key` | `str` | `"merged_quads"` | Output column for merged results |

The output is a dictionary such as `{"unambiguous": [...], "ambiguous": [...]}`. In `ambiguous`, multiple candidate quadruples are concatenated with the full-width separator `锝?`.

#### 🤖 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.temporal_kg.generate.tkg_4tuple_merge import TKGTupleMerger

storage = FileStorage(
    first_entry_file_name="dataflow/data_for_operator_testing/tkg_merge.json",
    cache_path="./cache",
    file_name_prefix="tkg_merge",
    cache_type="json",
).step()

op = TKGTupleMerger()
op.run(
    storage=storage,
    input_key_kg1="triples_kg1",
    input_key_kg2="triples_kg2",
    input_key_alignment="entity_alignment",
    output_key="merged_quads"
)
```

Example input:

```json
{
  "triples_kg1": [
    "<subj> E1 <obj> E2 <rel> relA <time> 2026-03-01"
  ],
  "triples_kg2": [
    "<subj> E1 <obj> E2 <rel> relB <time> 2026-03-01"
  ],
  "entity_alignment": [
    {"entity_kg1": "E1", "entity_kg2": "E1"},
    {"entity_kg1": "E2", "entity_kg2": "E2"}
  ]
}
```

Example output:

```json
{
  "merged_quads": {
    "unambiguous": [],
    "ambiguous": [
      "<subj> E1 <obj> E2 <rel> relA <time> 2026-03-01 锝?<subj> E1 <obj> E2 <rel> relB <time> 2026-03-01"
    ]
  }
}
```
