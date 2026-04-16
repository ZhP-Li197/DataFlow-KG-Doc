---
title: SchoKGQueryReasoningOperator
createTime: 2026/04/11 10:55:00
permalink: /en/kg_operators/domain_kg/scholar_kg/generate/schokg_query_reasoning/
---

## 📚 Overview
`SchoKGQueryReasoningOperator` is a generation-category operator for scholarly knowledge graph question answering with reasoning paths.
It searches for candidate paths from the query and scholarly triples, then uses an LLM to select the most relevant paths and generate the final answer.

Key characteristics of this operator:

- It relies on `LLMServingABC` for reasoning-answer generation
- It uses `SchoKGQueryReasoningPrompt` by default
- It reads `query` and `triple` by default
- It writes `reasoning_path` and `reasoning_answer` by default
- Candidate paths are generated in code first, then ranked and summarized by the model

---

## ✒️ `__init__` Function
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    max_hop: int = 3,
    max_candidate_paths: int = 20,
    prompt_template=None,
):
    ...
```

#### `__init__` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM service object. |
| `seed` | `int` | `0` | Initializes the internal random generator. |
| `lang` | `str` | `"en"` | Default prompt language. |
| `max_hop` | `int` | `3` | Maximum graph-search hop count. |
| `max_candidate_paths` | `int` | `20` | Candidate-path truncation limit. |
| `prompt_template` | `Any` | `None` | Custom prompt template. When omitted, the operator uses `SchoKGQueryReasoningPrompt(lang=self.lang)`. |

---

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key_query: str = "query",
    input_key_triple: str = "triple",
    output_key_path: str = "reasoning_path",
    output_key_answer: str = "reasoning_answer",
):
    ...
```

`run` reads a DataFrame, validates the input and output columns, and then processes each row by parsing triples into an undirected graph. It matches entities against the query text, prioritizes path search between the top four matched entities, and falls back to collecting paths from the top two seed entities if no connecting paths are found. Candidate paths are ranked by query-token overlap and path length, truncated to `max_candidate_paths`, and then passed to the prompt to generate `reasoning_path` and `reasoning_answer`.

#### `run` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow storage object. |
| `input_key_query` | `str` | `"query"` | Input query column name. |
| `input_key_triple` | `str` | `"triple"` | Input triple column name. |
| `output_key_path` | `str` | `"reasoning_path"` | Output reasoning-path column name. |
| `output_key_answer` | `str` | `"reasoning_answer"` | Output reasoning-answer column name. |

---

## 🤖 Example Usage
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.scholar_kg.generate.schokg_query_reasoning import (
    SchoKGQueryReasoningOperator,
)

# Step 1: Assume llm_serving has been initialized in your project

# Step 2: Prepare input data
dataframe = pd.DataFrame(
    [
        {
            "query": "Which university is Geoffrey Hinton affiliated with?",
            "triple": [
                "<subj> Geoffrey Hinton <obj> University of Toronto <rel> affiliated_with",
                "<subj> Geoffrey Hinton <obj> deep learning <rel> studies"
            ]
        }
    ]
)

storage = DummyStorage()
storage.set_data(dataframe)

operator = SchoKGQueryReasoningOperator(
    llm_serving=llm_serving,
    lang="en",
)
operator.run(storage=storage)
```

---

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `query` | `str` | Input user query. |
| `triple` | `List[str]` | Input scholarly triple list. |
| `reasoning_path` | `List[str]` | Model-selected reasoning-path list. |
| `reasoning_answer` | `str` | Final answer generated from those paths. |

---

#### Example Input
```json
[
  {
    "query": "Which university is Geoffrey Hinton affiliated with?",
    "triple": [
      "<subj> Geoffrey Hinton <obj> University of Toronto <rel> affiliated_with",
      "<subj> Geoffrey Hinton <obj> deep learning <rel> studies"
    ]
  }
]
```

#### Example Output
```json
[
  {
    "query": "Which university is Geoffrey Hinton affiliated with?",
    "triple": [
      "<subj> Geoffrey Hinton <obj> University of Toronto <rel> affiliated_with",
      "<subj> Geoffrey Hinton <obj> deep learning <rel> studies"
    ],
    "reasoning_path": [
      "<subj> Geoffrey Hinton <obj> University of Toronto <rel> affiliated_with"
    ],
    "reasoning_answer": "Geoffrey Hinton is affiliated with the University of Toronto."
  }
]
```

---
#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/domain_kg/scholar_kg/generate/schokg_query_reasoning.py`
- Default prompt: `DataFlow-KG/dataflow/prompts/diverse_kg/schokg.py`
- Related operator: `DataFlow-KG/dataflow/operators/domain_kg/scholar_kg/generate/schokg_recommend.py`


