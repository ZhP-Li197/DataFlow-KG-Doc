---
title: TKGRelationTupleDialogueQAGeneration
createTime: 2026/04/07 09:00:00
permalink: /en/kg_operators/temporal_kg/generate/tkg_rel_4tuple_conversation_generator/
---

#### 📚 Overview

`TKGRelationTupleDialogueQAGeneration` generates multi-turn dialogue QA data from multi-hop temporal paths. It reads columns such as `2_hop_paths` and writes the result into `multi_turn_dialogues`.

#### 📚 `__init__` Function

```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    lang: str = "en",
    k: int = 2,
    min_turns: int = 4
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | Model serving backend used for multi-turn dialogue generation |
| `lang` | `str` | `"en"` | Prompt language |
| `k` | `int` | `2` | Path hop count; by default the operator consumes `2_hop_paths` |
| `min_turns` | `int` | `4` | Clamped to `min(min_turns, k)`; not further enforced in the current implementation |

#### 💡 `run` Function

```python
def run(
    self,
    storage: DataFlowStorage,
    input_key_meta: str = "hop_paths",
    output_key: str = "multi_turn_dialogues"
) -> List[str]:
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Input/output storage object |
| `input_key_meta` | `str` | `"hop_paths"` | Combined with `k` to form the actual input column, such as `2_hop_paths` |
| `output_key` | `str` | `"multi_turn_dialogues"` | Output column for generated dialogues |

Each row in the output column is a list, and each item usually has the structure `{"path": ..., "dialogue": [...]}`.

#### 🤖 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.temporal_kg.generate.tkg_rel_4tuple_conversation_generator import TKGRelationTupleDialogueQAGeneration

storage = FileStorage(
    first_entry_file_name="dataflow/data_for_operator_testing/tkg_rel_qa.json",
    cache_path="./cache",
    file_name_prefix="tkg_dialogue",
    cache_type="json",
).step()

op = TKGRelationTupleDialogueQAGeneration(
    llm_serving=llm_serving,
    k=2,
    lang="en"
)
op.run(storage=storage, input_key_meta="hop_paths", output_key="multi_turn_dialogues")
```

Example input:

```json
{
  "2_hop_paths": "<subj> Elon Musk <obj> SpaceX <rel> founded <time> 2002 || <subj> SpaceX <obj> ISS <rel> first commercial spacecraft docking with <time> 2012"
}
```

Example output:

```json
{
  "multi_turn_dialogues": [
    {
      "path": "<subj> Elon Musk <obj> SpaceX <rel> founded <time> 2002 || <subj> SpaceX <obj> ISS <rel> first commercial spacecraft docking with <time> 2012",
      "dialogue": [
        {"role": "user", "content": "Which company founded by Elon Musk later docked with the ISS?"},
        {"role": "assistant", "content": "It was SpaceX, which Elon Musk founded in 2002 and later achieved the first commercial spacecraft docking with the ISS in 2012."}
      ]
    }
  ]
}
```
