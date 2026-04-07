---
title: TKGTupleMerger
createTime: 2026/03/18 00:00:00
icon: material-symbols:bolt
permalink: /en/kg_operators/temporal_kg/generate/tkgtuplemerger/
---

## 📚 Overview

[TKGTupleMerger](https://github.com/ZhP-Li197/DataFlow-KG/tree/main/dataflow/operators/temporal_kg/generate/tkg_4tuple_merge.py) is a generator operator that merges quadruples from two knowledge graphs into a unified temporal KG using entity alignment. It supports both relation and attribute quadruple formats. During merging, the operator detects four ambiguity types: relation conflicts, time conflicts, attribute value conflicts, and attribute time conflicts. Unambiguous quadruples are merged directly, while ambiguous ones are preserved with conflict candidates for downstream disambiguation.

## ✒️ `__init__` function

```python
def __init__(self):
```

### Parameters

This operator has no initialization parameters.



## 💡 `run` function

```python
def run(self, storage: DataFlowStorage = None, input_key_kg1: str = "triples_kg1", input_key_kg2: str = "triples_kg2", input_key_alignment: str = "entity_alignment", output_key: str = "merged_quads"):
```

#### Parameters

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| **storage** | DataFlowStorage | None | DataFlow storage instance, responsible for reading and writing data. |
| **input_key_kg1** | str | "triples_kg1" | Input column name, corresponding to the quadruple list of the first knowledge graph. |
| **input_key_kg2** | str | "triples_kg2" | Input column name, corresponding to the quadruple list of the second knowledge graph. |
| **input_key_alignment** | str | "entity_alignment" | Input column name, corresponding to the entity alignment information list. |
| **output_key** | str | "merged_quads" | Output column name, corresponding to the merged result. |

## 🤖 Example Usage

```python
from dataflow.operators.temporal_kg.generate import TKGTupleMerger
from dataflow.utils.storage import FileStorage

storage = FileStorage(first_entry_file_name="tkg_merge.json")

merger = TKGTupleMerger()
merger.run(
    storage.step(),
    input_key_kg1="triples_kg1",
    input_key_kg2="triples_kg2",
    input_key_alignment="entity_alignment",
    output_key="merged_quads",
)
```

#### Default Output Format

| Field | Type | Description |
| --- | --- | --- |
| **merged_quads** | Dict | Merge result, containing `unambiguous` and `ambiguous` sub-fields. |
| **merged_quads.unambiguous** | List[str] | Unambiguous merged quadruple list. |
| **merged_quads.ambiguous** | List[str] | Ambiguous quadruples; conflict candidates are separated by `｜`. |

**Example Input:**

```json
{
  "triples_kg1": [
    "⟨subj⟩ Elon Musk ⟨obj⟩ SpaceX ⟨rel⟩ founded ⟨time⟩ 2002",
    "⟨subj⟩ Elon Musk ⟨obj⟩ Tesla Motors ⟨rel⟩ took over as CEO ⟨time⟩ 2008",
    "⟨subj⟩ SpaceX ⟨obj⟩ ISS ⟨rel⟩ first commercial spacecraft docking with ⟨time⟩ 2012"
  ],
  "triples_kg2": [
    "⟨subj⟩ Elon Musk ⟨obj⟩ SpaceX ⟨rel⟩ established ⟨time⟩ 2002",
    "⟨subj⟩ Elon Musk ⟨obj⟩ Tesla Motors ⟨rel⟩ took over as CEO ⟨time⟩ 2006",
    "⟨subj⟩ Elon Musk ⟨obj⟩ Neuralink ⟨rel⟩ founded ⟨time⟩ 2016"
  ],
  "entity_alignment": [
    {"entity_kg1": "Elon Musk", "entity_kg2": "Elon Musk", "similarity": 100},
    {"entity_kg1": "SpaceX", "entity_kg2": "SpaceX", "similarity": 100},
    {"entity_kg1": "Tesla Motors", "entity_kg2": "Tesla Motors", "similarity": 100}
  ]
}
```

**Example Output:**

```json
{
  "merged_quads": {
    "unambiguous": [
      "⟨subj⟩ SpaceX ⟨obj⟩ ISS ⟨rel⟩ first commercial spacecraft docking with ⟨time⟩ 2012",
      "⟨subj⟩ Elon Musk ⟨obj⟩ Neuralink ⟨rel⟩ founded ⟨time⟩ 2016"
    ],
    "ambiguous": [
      "⟨subj⟩ Elon Musk ⟨obj⟩ SpaceX ⟨rel⟩ established ⟨time⟩ 2002 ｜ ⟨subj⟩ Elon Musk ⟨obj⟩ SpaceX ⟨rel⟩ founded ⟨time⟩ 2002",
      "⟨subj⟩ Elon Musk ⟨obj⟩ Tesla Motors ⟨rel⟩ took over as CEO ⟨time⟩ 2006 ｜ ⟨subj⟩ Elon Musk ⟨obj⟩ Tesla Motors ⟨rel⟩ took over as CEO ⟨time⟩ 2008"
    ]
  }
}
```