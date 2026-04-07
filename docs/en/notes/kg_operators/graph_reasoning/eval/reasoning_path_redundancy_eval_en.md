---
title: KGPathRedundancyEvaluator
createTime: 2026/04/01 16:35:00
icon: material-symbols:check-circle-outline
permalink: /en/kg_operators/graph_reasoning/eval/reasoning_path_redundancy_eval/
---

## 📚 Overview
`KGPathRedundancyEvaluator` is an evaluation-category operator for knowledge-graph multi-hop path redundancy scoring.
It reads target entity pairs together with their corresponding multi-hop paths, calls an LLM to assign a continuous redundancy score between 0 and 1 to each path, and writes the results back into the DataFrame. Higher scores usually indicate more repeated or unnecessary information in the path.

Key characteristics of this operator:

- It depends on `LLMServingABC` for path-redundancy evaluation
- It uses `KGReasoningPathRedundancyPrompt` by default for prompt construction
- It reads `mpath` and `target_entity` by default
- It writes to `redundancy_scores` by default
- The output is grouped by entity pair, with one score list per pair

---

## ✒️ __init__ Function
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    lang: str = "zh"
):
    ...
```

## `__init__` Parameters

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM serving instance. The operator calls `generate_from_input` to score path redundancy. |
| `lang` | `str` | `"zh"` | Prompt language. The operator initializes `KGReasoningPathRedundancyPrompt(lang)`. |

---

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "mpath",
    target_key: str = "target_entity",
    output_key: str = "redundancy_scores"
) -> List[str]:
    ...
```

`run` first reads a DataFrame from `storage`, then converts each row into a record list and passes the records into the internal `process_batch` method. For each row, the operator iterates over the path groups for each entity pair, extracts the subject and object from `target_entity`, constructs a prompt through `KGReasoningPathRedundancyPrompt`, and asks the LLM to return continuous redundancy scores for the paths. The model response is parsed as JSON and the `redundancy_scores` field is extracted. If parsing fails, the score list falls back to an empty list.

## `run` Parameters

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow storage object. The operator reads the `dataframe` from it and writes redundancy-score results back. |
| `input_key` | `str` | `"mpath"` | Input path column name. In principle this is configurable, but much of the current implementation still assumes the default column name internally. |
| `target_key` | `str` | `"target_entity"` | Input target-entity column name. In principle this is configurable, but much of the current implementation still assumes the default column name internally. |
| `output_key` | `str` | `"redundancy_scores"` | Output column name. The implementation appears to allow customization, but the final write-back still relies on the default key internally. |

---

## 🤖 Example Usage
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.graph_reasoning.eval.reasoning_path_redundancy_eval import (
    KGPathRedundancyEvaluator,
)

llm_serving = YourLLMServing(...)

operator = KGPathRedundancyEvaluator(
    llm_serving=llm_serving,
    lang="en",
)
operator.run(
    storage=storage,
    input_key="mpath",
    target_key="target_entity",
    output_key="redundancy_scores",
)
```

---

## Default Output Format

| Field | Type | Description |
| :-- | :-- | :-- |
| `target_entity` | `List[List[str]]` | Target entity-pair list. Each pair is usually wrapped as a one-string list. |
| `mpath` | `List[List[List[str]]]` | Multi-hop path result. The outer layer is grouped by entity pair, the middle layer stores multiple paths, and the inner layer stores triplets inside each path. |
| `redundancy_scores` | `List[List[float]]` | Redundancy-score result aligned with `mpath`. Each entity pair corresponds to one path-score list. |

---

### Example Input

```json
[
  {
    "target_entity": [["Henry, Berlin"]],
    "mpath": [
      [
        [
          "<subj> Henry <obj> Maria Rodriguez <rel> is_trained_by",
          "<subj> Maria Rodriguez <obj> Berlin <rel> lives_in"
        ],
        [
          "<subj> Henry <obj> CoachA <rel> trained_by",
          "<subj> CoachA <obj> Berlin <rel> located_in"
        ]
      ]
    ]
  }
]
```

### Example Output

```json
[
  {
    "target_entity": [["Henry, Berlin"]],
    "mpath": [
      [
        [
          "<subj> Henry <obj> Maria Rodriguez <rel> is_trained_by",
          "<subj> Maria Rodriguez <obj> Berlin <rel> lives_in"
        ],
        [
          "<subj> Henry <obj> CoachA <rel> trained_by",
          "<subj> CoachA <obj> Berlin <rel> located_in"
        ]
      ]
    ],
    "redundancy_scores": [
      [0.18, 0.67]
    ]
  }
]
```

---
### Related Links

- Operator implementation: `DataFlow-KG/dataflow/operators/graph_reasoning/eval/reasoning_path_redundancy_eval.py`
- Default prompt: `DataFlow-KG/dataflow/prompts/application_kg/graph_reasoning.py`
- Downstream filtering operator: `DataFlow-KG/dataflow/operators/graph_reasoning/filter/reasoning_path_redundancy_filtering.py`
