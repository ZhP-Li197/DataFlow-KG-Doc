---
title: KGTripleMerger
createTime: 2026/04/11 12:00:00
permalink: /en/kg_operators/general_kg/generate/kg_triple_merge/
---

## 📚 Overview
`KGTripleMerger` merges two knowledge graphs or two triple sets into one. It supports relation triples, attribute triples, and mixed inputs, and it uses entity alignment results to map entities from the second KG into the first KG namespace.

For relation triples, the operator groups relations by entity pair and detects ambiguity. For attribute triples, it groups values by entity and attribute and detects conflicting values. For mixed inputs, it applies entity mapping and concatenates the transformed triples directly. The final output is always a dictionary with `unambiguous` and `ambiguous` keys.

## ✒️ __init__ Function
```python
def __init__(self):
    pass
```

This operator has no initialization parameters. Its behavior is determined entirely from the runtime input data in `run()`.

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key_kg1: str = "triples_kg1",
    input_key_kg2: str = "triples_kg2",
    input_key_alignment: str = "entity_alignment",
    output_key: str = "merged_triples"
) -> List[str]:
    ...
```

`run` reads the first row of the DataFrame, takes the two triple lists and the entity alignment list, and infers the input type from the prefix of the first triple in each list. If both sides are relation triples, it calls `_merge_relational_triples()`. If both are attribute triples, it calls `_merge_attribute_triples()`. Otherwise it calls `_merge_mixed_triples()`. The merged result is written to `output_key`.

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Storage object containing the DataFrame. |
| `input_key_kg1` | `str` | `"triples_kg1"` | Column for triples from the first KG. |
| `input_key_kg2` | `str` | `"triples_kg2"` | Column for triples from the second KG. |
| `input_key_alignment` | `str` | `"entity_alignment"` | Column containing entity alignment results. |
| `output_key` | `str` | `"merged_triples"` | Output column for merged triples. |

## 🤖 Example Usage
```python
from dataflow.operators.general_kg.generate.kg_triple_merge import KGTripleMerger

operator = KGTripleMerger()
operator.run(
    storage=storage,
    input_key_kg1="triples_kg1",
    input_key_kg2="triples_kg2",
    input_key_alignment="entity_alignment",
    output_key="merged_triples",
)
```

Default input and output format:

| Field | Type | Description |
| :-- | :-- | :-- |
| `triples_kg1` | `List[str]` | Triple list from the first KG. |
| `triples_kg2` | `List[str]` | Triple list from the second KG. |
| `entity_alignment` | `List[Dict]` | Entity alignment results, usually with `entity_kg1` and `entity_kg2`. |
| `merged_triples` | `Dict[str, List[str]]` | Merge result with `unambiguous` and `ambiguous` entries. |

Example input:

```json
[
  {
    "triples_kg1": ["<subj> A <obj> B <rel> founded_by"],
    "triples_kg2": ["<subj> A2 <obj> B <rel> created_by"],
    "entity_alignment": [{"entity_kg1": "A", "entity_kg2": "A2"}]
  }
]
```

Example output:

```json
[
  {
    "merged_triples": {
      "unambiguous": [],
      "ambiguous": ["<subj> A <obj> B <rel> created_by | founded_by"]
    }
  }
]
```

Related files:

- Operator implementation: `DataFlow-KG/dataflow/operators/general_kg/generate/kg_triple_merge.py`
