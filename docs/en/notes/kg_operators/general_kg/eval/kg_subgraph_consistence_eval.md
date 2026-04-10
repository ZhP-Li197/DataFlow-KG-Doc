---
title: KGSubgraphConsistency
createTime: 2026/04/10 15:40:44
permalink: /en/kg_operators/general_kg/eval/kg_subgraph_consistence_eval/
---

## 📚 Overview
`KGSubgraphConsistency` is an evaluation operator that assesses the internal semantic consistency of knowledge graph subgraphs.
It reads a list of subgraph triples from each row, calls a large language model to score the overall semantic coherence of the subgraph, and writes the score back to the DataFrame.

Key characteristics of this operator:

- Depends on `LLMServingABC` for LLM-based evaluation.
- Uses `KGSubgraphConsistencyPrompt` by default to construct prompts; a custom prompt can be provided via the `prompt_template` parameter.
- Each subgraph is evaluated as a whole, producing a single consistency score rather than per-triple scores.
- Requires the `input_key` column to exist and the `output_key` column to be absent (raises an error on conflict).
- Returns `None` for the current row when a model call fails or the response cannot be parsed.

---

## ✒️ `__init__` Parameters
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    merge_to_input: bool = False,
    prompt_template: Union[KGSubgraphConsistencyPrompt, DIYPromptABC] = None
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM service object. The operator calls `generate_from_input` to score subgraph consistency. |
| `seed` | `int` | `0` | Random seed for the internal random number generator. |
| `lang` | `str` | `"en"` | Prompt language. When `prompt_template` is `None`, the constructor creates `KGSubgraphConsistencyPrompt(lang)`. |
| `merge_to_input` | `bool` | `False` | Reserved parameter; not used in the current main pipeline. |
| `prompt_template` | `KGSubgraphConsistencyPrompt` / `DIYPromptABC` | `None` | Custom prompt template. If provided, it takes precedence over the default template. |

---

## 💡 `run` Function
```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "subgraph",
    output_key: str = "consistency_score"
):
    ...
```

`run` reads the DataFrame from `storage`, validates that the `input_key` column exists and the `output_key` column does not, then extracts all subgraphs and calls `process_batch()` to handle each row. Each subgraph is passed as a whole to construct the prompt, the model returns a JSON containing the `consistency_score` field, and the parsed value is written to the `output_key` column.

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow storage object. The operator reads the `dataframe` from it and writes evaluation results back. |
| `input_key` | `str` | `"subgraph"` | Input subgraph column name. Each cell should be a `List[str]` of triples. |
| `output_key` | `str` | `"consistency_score"` | Output score column name for the semantic consistency score of each subgraph. |

---

## 🤖 Example Usage
```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.general_kg.eval.kg_subgraph_consistence_eval import (
    KGSubgraphConsistency,
)

operator = KGSubgraphConsistency(
    llm_serving=llm_serving,
    lang="en",
)
operator.run(
    storage=storage,
    input_key="subgraph",
    output_key="consistency_score",
)
```

---

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `subgraph` | `List[str]` | Input subgraph triple list in `<subj> ... <obj> ... <rel> ...` format. |
| `consistency_score` | `float` / `None` | LLM-evaluated internal semantic consistency score for the subgraph, in the range `[0, 1]`. Returns `None` on model error or parse failure. |

---

#### Example Input
```json
[
  {
    "subgraph": [
      "<subj> Earth <obj> Sun <rel> orbits",
      "<subj> Earth <obj> Moon <rel> has_satellite",
      "<subj> Moon <obj> Earth <rel> orbits"
    ]
  },
  {
    "subgraph": [
      "<subj> Earth <obj> Sun <rel> orbits",
      "<subj> Shakespeare <obj> Python <rel> invented"
    ]
  }
]
```

#### Example Output
```json
[
  {
    "subgraph": ["..."],
    "consistency_score": 0.91
  },
  {
    "subgraph": ["..."],
    "consistency_score": 0.12
  }
]
```

---

#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/general_kg/eval/kg_subgraph_consistence_eval.py`
- Default prompt: `DataFlow-KG/dataflow/prompts/core_kg/rel_triple_eval.py`