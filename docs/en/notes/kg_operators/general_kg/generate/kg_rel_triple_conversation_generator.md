---
title: KGRelationTripleDialogueQAGeneration
createTime: 2026/04/11 12:00:00
permalink: /en/kg_operators/general_kg/generate/kg_rel_triple_conversation_generator/
---

## 📚 Overview
`KGRelationTripleDialogueQAGeneration` converts multi-hop KG paths into multi-turn dialogue QA. It operates on path-level inputs and uses an LLM to rewrite one path into a sequence of conversational turns, then stores the dialogue together with the source path.

The input column name is built from `k` and `input_key_meta`; for example, when `k=3`, the default input column is `3_hop_paths`. The model output is expected to be JSON with a `dialogue.turns` structure. After removing code fences, the operator parses that JSON directly and writes the path plus dialogue into the output list.

## ✒️ __init__ Function
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    lang: str = "en",
    k: int = 3,
    min_turns: int = 4
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM backend used for dialogue generation. |
| `lang` | `str` | `"en"` | Prompt language. |
| `k` | `int` | `3` | Hop count of the input path and part of the input column name. |
| `min_turns` | `int` | `4` | Minimum turn configuration. Internally it is capped at `k`; in the current code it mainly serves as a retained config value. |

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage,
    input_key_meta: str = "hop_paths",
    output_key: str = "multi_turn_dialogues"
) -> List[str]:
    ...
```

`run` first derives the actual input column from `k` and `input_key_meta`, such as `3_hop_paths`, then reads and validates the DataFrame. It processes each row through `_generate_dialogue_for_path()`, which builds the prompt, calls the LLM, and reads `response["dialogue"]["turns"]` from the returned JSON. Each row is stored as a list of objects shaped like `{"path": original_path, "dialogue": turns}`.

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Storage object containing the DataFrame. |
| `input_key_meta` | `str` | `"hop_paths"` | Suffix of the input column name. The final name is `"{k}_{input_key_meta}"`. |
| `output_key` | `str` | `"multi_turn_dialogues"` | Output column for multi-turn dialogue results. |

## 🤖 Example Usage
```python
from dataflow.operators.general_kg.generate.kg_rel_triple_conversation_generator import (
    KGRelationTripleDialogueQAGeneration,
)

operator = KGRelationTripleDialogueQAGeneration(
    llm_serving=llm_serving,
    lang="en",
    k=3,
)

operator.run(
    storage=storage,
    input_key_meta="hop_paths",
    output_key="multi_turn_dialogues",
)
```

Default input and output format:

| Field | Type | Description |
| :-- | :-- | :-- |
| `3_hop_paths` | `str` | Input 3-hop path string, usually composed of triples joined by `||`. |
| `multi_turn_dialogues` | `List[Dict]` | Each row stores a list whose items contain the original `path` and the generated turn-by-turn `dialogue`. |

Example input:

```json
[
  {
    "3_hop_paths": "<subj> A <obj> B <rel> founded_by || <subj> B <obj> C <rel> located_in || <subj> C <obj> D <rel> part_of"
  }
]
```

Example output:

```json
[
  {
    "returned_keys": [
      "multi_turn_dialogues"
    ],
    "output": [
      {
        "3_hop_paths": "<subj> A <obj> B <rel> founded_by || <subj> B <obj> C <rel> located_in || <subj> C <obj> D <rel> part_of",
        "multi_turn_dialogues": [
          {
            "path": "<subj> A <obj> B <rel> founded_by || <subj> B <obj> C <rel> located_in || <subj> C <obj> D <rel> part_of",
            "dialogue": [
              {
                "turn_id": 1,
                "question": "Who was A founded by?",
                "answer": "B"
              },
              {
                "turn_id": 2,
                "question": "Where is B located?",
                "answer": "C"
              },
              {
                "turn_id": 3,
                "question": "What is C a part of?",
                "answer": "D"
              }
            ]
          }
        ]
      }
    ]
  }
]
```

Related files:

- Operator implementation: `DataFlow-KG/dataflow/operators/general_kg/generate/kg_rel_triple_conversation_generator.py`
- Prompt definitions: `DataFlow-KG/dataflow/prompts/core_kg/rel_triple_generate.py`
