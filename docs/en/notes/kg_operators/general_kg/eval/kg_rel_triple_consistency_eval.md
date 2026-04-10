---
title: KGRelationTripleConsistencyEvaluator
createTime: 2026/04/10 15:40:44
permalink: /en/kg_operators/general_kg/eval/kg_rel_triple_consistency_eval/
---

## 📚 Overview
`KGRelationTripleConsistencyEvaluator` is an evaluation operator that assesses the logical consistency of knowledge graph relation triples.
It reads a list of triples from each row, builds an internal graph structure, then samples edges and leverages local context to call a large language model to determine whether logical conflicts exist among the triples, finally outputting a consistency score.

Key characteristics of this operator:

- Depends on `LLMServingABC` for LLM-based evaluation.
- Uses `KGRelationConsistencyEvaluationPrompt` by default to construct prompts.
- Supports `sample_rate` and `max_samples` to control the sampling ratio and upper limit, improving evaluation efficiency for large-scale graphs.
- Supports an optional `test_triple` column: if present, all test triples are evaluated; otherwise, triples from the `triple` column are sampled for evaluation.
- Returns a score of `0.0` for the current row when a model call fails, the response is invalid JSON, or the input is empty.

---

## ✒️ `__init__` Parameters
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    sample_rate: float = 1,
    max_samples: int = 10,
    lang: str = "en"
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM service object. The operator calls `generate_from_input` to judge triple consistency. |
| `sample_rate` | `float` | `1` | Triple sampling ratio relative to the total number of edges in the graph. Used together with `max_samples` to control the actual sample count. |
| `max_samples` | `int` | `10` | Maximum number of triples to sample per row. |
| `lang` | `str` | `"en"` | Prompt language. The constructor creates `KGRelationConsistencyEvaluationPrompt(lang)`. |

---

## 💡 `run` Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "triple"
):
    ...
```

`run` reads the DataFrame from `storage` and extracts the `input_key` column and the optional `test_triple` column row by row. It then calls `process_batch()` to evaluate each row. If the current row has a `test_triple`, all test triples are used to construct the graph and each edge is evaluated; otherwise, triples from the `triple` column are sampled for evaluation. For each edge, the operator extracts its local neighbor context and passes it to the model for a consistency judgment (`CONSISTENT` / `INCONSISTENT`). The final `logical_consistency_score` is the ratio of passing triples to total evaluated triples. Results are written to the fixed output columns `logical_consistency_score` and `evaluated_sample_indices`.

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow storage object. The operator reads the `dataframe` from it and writes evaluation results back. |
| `input_key` | `str` | `"triple"` | Input triple column name. Each cell is typically a `List[str]`, but may also be a JSON string. |

---

## 🤖 Example Usage
```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.general_kg.eval.kg_rel_triple_consistency_eval import (
    KGRelationTripleConsistencyEvaluator,
)

operator = KGRelationTripleConsistencyEvaluator(
    llm_serving=llm_serving,
    sample_rate=0.8,
    max_samples=10,
    lang="en",
)
operator.run(
    storage=storage,
    input_key="triple",
)
```

---

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `triple` | `List[str]` / `str` | Input triple list, or a JSON string that can be parsed into a list. |
| `logical_consistency_score` | `float` | Proportion of sampled triples judged as consistent, in the range `[0.0, 1.0]`. |
| `evaluated_sample_indices` | `List[int]` / `None` | Index list of triples evaluated in this sampling run. Returns `None` when using `test_triple` mode. |

---

#### Example Input
```json
[
  {
    "triple": [
      "<subj> Earth <obj> Solar System <rel> partOf",
      "<subj> Earth <obj> Sun <rel> orbits",
      "<subj> Sun <obj> Earth <rel> orbits"
    ]
  }
]
```

#### Example Output
```json
[
  {
    "triple": [
      "<subj> Earth <obj> Solar System <rel> partOf",
      "<subj> Earth <obj> Sun <rel> orbits",
      "<subj> Sun <obj> Earth <rel> orbits"
    ],
    "logical_consistency_score": 0.67,
    "evaluated_sample_indices": [0, 1, 2]
  }
]
```

---

#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/general_kg/eval/kg_rel_triple_consistency_eval.py`
- Default prompt: `DataFlow-KG/dataflow/prompts/core_kg/rel_triple_eval.py`