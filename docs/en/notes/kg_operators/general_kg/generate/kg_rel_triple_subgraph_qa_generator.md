---
title: KGRelationTripleSubgraphQAGeneration
createTime: 2026/04/11 12:00:00
permalink: /en/kg_operators/general_kg/generate/kg_rel_triple_subgraph_qa_generator/
---

## 📚 Overview
`KGRelationTripleSubgraphQAGeneration` generates multi-entity QA pairs from KG subgraphs. It takes a group of related triples as one subgraph and uses an LLM to create numeric or set-based questions and answers.

The operator supports two modes: `qa_type="num"` uses the numeric prompt and `qa_type="set"` uses the set-based prompt. By default it reads from `subgraph` and writes to `QA_pairs`. The model output is parsed as JSON with a `QA_pairs` field; if parsing fails, the sample falls back to an empty list.

## ✒️ __init__ Function
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    qa_type: str = "num",
    num_q: int = 5
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM backend used for QA generation. |
| `seed` | `int` | `0` | Seed for the internal random generator. |
| `lang` | `str` | `"en"` | Prompt language. |
| `qa_type` | `str` | `"num"` | QA type. Supported values are `num` and `set`. |
| `num_q` | `int` | `5` | Reserved QA-count parameter. |

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "subgraph",
    output_key: str = "QA_pairs"
):
    ...
```

`run` reads the DataFrame from `storage`, validates that `input_key` exists and `output_key` is free, and then passes each subgraph into `process_batch()`. During batch processing, the operator builds prompts row by row, calls the model, parses `QA_pairs` from the returned JSON, and finally writes the generated results into `output_key`.

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Storage object for the DataFrame. |
| `input_key` | `str` | `"subgraph"` | Input column containing subgraphs. |
| `output_key` | `str` | `"QA_pairs"` | Output column for generated QA pairs. |

## 🤖 Example Usage
```python
from dataflow.operators.general_kg.generate.kg_rel_triple_subgraph_qa_generator import (
    KGRelationTripleSubgraphQAGeneration,
)

operator = KGRelationTripleSubgraphQAGeneration(
    llm_serving=llm_serving,
    lang="en",
    qa_type="set",
)

operator.run(
    storage=storage,
    input_key="subgraph",
    output_key="QA_pairs",
)
```

Default input and output format:

| Field | Type | Description |
| :-- | :-- | :-- |
| `subgraph` | `str` / `List[str]` | Input subgraph triples. |
| `QA_pairs` | `List[Dict]` | Generated multi-entity QA pairs. |

Example input:

```json
[
  {
    "subgraph": [
      "<subj> A <obj> B <rel> works_at",
      "<subj> C <obj> B <rel> works_at",
      "<subj> B <obj> D <rel> located_in"
    ]
  }
]
```

Example output:

```json
[
  {
    "QA_pairs": [
      {
        "question": "Which people work at the organization located in D?",
        "answer": "A and C."
      }
    ]
  }
]
```

Related files:

- Operator implementation: `DataFlow-KG/dataflow/operators/general_kg/generate/kg_rel_triple_subgraph_qa_generator.py`
- Prompt definitions: `DataFlow-KG/dataflow/prompts/core_kg/rel_triple_generate.py`
