---
title: KGRAGQuestionDifficultyEvaluation
createTime: 2026/04/01 14:25:00
permalink: /en/kg_operators/graph_rag/eval/graphrag_question_difficulty_eval/
---

## 📚 Overview
`KGRAGQuestionDifficultyEvaluation` is an evaluation-category operator for Graph RAG question difficulty assessment.
It calls an LLM on each input question and classifies its difficulty into labels such as `easy`, `medium`, or `hard`. This is useful for dataset stratification, sampling control, or downstream difficulty analysis.

Key characteristics of this operator:

- It depends on `LLMServingABC` for LLM-based classification
- It uses `KGQuestionDifficultyPrompt` by default and also supports custom prompt injection
- It reads `question` by default and writes to `question_difficulty` by default
- It supports both single questions as `str` and batched questions as `List[str]`
- If model output cannot be parsed, it falls back to the default label `medium`

---

## ✒️ `__init__` Function
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    prompt_template: Union[
        KGQuestionDifficultyPrompt, DIYPromptABC
    ] = None,
):
    ...
```

#### `__init__` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM serving instance. The operator calls `generate_from_input` to classify question difficulty. |
| `seed` | `int` | `0` | Used to initialize the internal random number generator. The current implementation does not use randomness further in the main logic. |
| `lang` | `str` | `"en"` | Language of the default prompt. If no custom template is provided, the operator constructs `KGQuestionDifficultyPrompt(lang=lang)`. |
| `prompt_template` | `Union[KGQuestionDifficultyPrompt, DIYPromptABC]` | `None` | Custom prompt template. If `None`, the default difficulty-evaluation prompt is used. |

---

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    question_key: str = "question",
    output_key: str = "question_difficulty",
):
    ...
```

`run` first reads a DataFrame from `storage`, validates the input and output columns, and then processes `question_key` row by row. If a cell is a string, the operator directly calls the LLM to assess difficulty. If a cell is `List[str]`, it evaluates each question one by one and writes back a list of difficulty labels. After each model response, the operator attempts to clean it into JSON and extract the `question_difficulty` field. If parsing fails, it falls back to `medium`.

#### `run` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow storage object. The operator reads the `dataframe` from it and writes difficulty results back. |
| `question_key` | `str` | `"question"` | Input question column name. Each cell may contain `str` or `List[str]`. |
| `output_key` | `str` | `"question_difficulty"` | Output column name used to store difficulty labels. |

---

## 🤖 Example Usage
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.prompts.application_kg.graph_rag import KGQuestionDifficultyPrompt
from dataflow.operators.graph_rag.eval.graphrag_question_difficulty_eval import (
    KGRAGQuestionDifficultyEvaluation,
)


operator = KGRAGQuestionDifficultyEvaluation(
    llm_serving=llm_serving,
    lang="en",
    prompt_template=KGQuestionDifficultyPrompt(lang="en"),
)
operator.run(
    storage=storage,
    question_key="question",
    output_key="question_difficulty",
)
```

---

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `question` | `str` / `List[str]` | Input question column. It can contain a single question or multiple questions in one row. |
| `question_difficulty` | `str` / `List[str]` | Difficulty result. Typical values are `easy`, `medium`, and `hard`. |

---

#### Example Input
```json
[
  {
    "question": "Who trained Henry?"
  }
]
```

#### Example Output
```json
[
  {
    "question": "Who trained Henry?",
    "question_difficulty": "easy"
  }
]
```

---

#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/graph_rag/eval/graphrag_question_difficulty_eval.py`
- Default prompt: `DataFlow-KG/dataflow/prompts/application_kg/graph_rag.py`
- Storage implementation: `DataFlow-KG/dataflow/utils/storage.py`


