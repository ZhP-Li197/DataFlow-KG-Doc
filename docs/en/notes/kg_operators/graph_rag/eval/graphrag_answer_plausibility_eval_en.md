---
title: KGRAGQuestionPlausibilityEvaluation
createTime: 2026/04/01 14:15:00
permalink: /en/kg_operators/graph_rag/eval/graphrag_answer_plausibility_eval/
---

## 📚 Overview
`KGRAGQuestionPlausibilityEvaluation` is an evaluation-category operator for Graph RAG question plausibility scoring.
It calls an LLM on each question-answer pair to judge whether the question is reasonable and aligned with the answer, then writes the score back into the DataFrame. Although the source file is named `graphrag_answer_plausibility_eval.py`, the class name and output semantics are currently about question plausibility evaluation.

Key characteristics of this operator:

- It depends on `LLMServingABC` for LLM-based scoring
- It uses `KGQuestionPlausibilityPrompt` by default and also supports custom prompt injection
- It reads `question` and `answer` by default
- It writes to `question_plausibility_score` by default
- It supports both single QA pairs and batched QA pairs within one row

---

## ✒️ `__init__` Function
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    prompt_template: Union[
        KGQuestionPlausibilityPrompt, DIYPromptABC
    ] = None,
):
    ...
```

#### `__init__` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM serving instance. The operator calls `generate_from_input` to score question plausibility. |
| `seed` | `int` | `0` | Used to initialize the internal random number generator. The current implementation does not use randomness further in the main logic. |
| `lang` | `str` | `"en"` | Language of the default prompt. If no custom template is provided, the operator constructs `KGQuestionPlausibilityPrompt(lang=lang)`. |
| `prompt_template` | `Union[KGQuestionPlausibilityPrompt, DIYPromptABC]` | `None` | Custom prompt template. If `None`, the default plausibility-evaluation prompt is used. |

---

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    question_key: str = "question",
    answer_key: str = "answer",
    output_key: str = "question_plausibility_score",
):
    ...
```

`run` first reads a DataFrame from `storage`, validates the question, answer, and output columns, and then processes the data row by row. If a row contains a single `question + answer`, the operator directly calls the LLM. If a row contains `List[str] + List[str]`, it evaluates them pairwise by position and writes a score list. After each LLM response, the operator attempts to clean it into JSON and extract the `question_plausibility_score` field. If parsing fails, it falls back to `0.0`.

#### `run` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow storage object. The operator reads the `dataframe` from it and writes scoring results back. |
| `question_key` | `str` | `"question"` | Input question column name. Each cell may contain `str` or `List[str]`. |
| `answer_key` | `str` | `"answer"` | Input answer column name. Each cell may contain `str` or `List[str]`. |
| `output_key` | `str` | `"question_plausibility_score"` | Output score column name used to store plausibility scores. |

---

## 🤖 Example Usage
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.prompts.application_kg.graph_rag import KGQuestionPlausibilityPrompt
from dataflow.operators.graph_rag.eval.graphrag_answer_plausibility_eval import (
    KGRAGQuestionPlausibilityEvaluation,
)


operator = KGRAGQuestionPlausibilityEvaluation(
    llm_serving=llm_serving,
    lang="en",
    prompt_template=KGQuestionPlausibilityPrompt(lang="en"),
)
operator.run(
    storage=storage,
    question_key="question",
    answer_key="answer",
    output_key="question_plausibility_score",
)
```

---

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `question` | `str` / `List[str]` | Input question column. It can contain a single question or multiple questions in one row. |
| `answer` | `str` / `List[str]` | Answer column aligned with the question input. |
| `question_plausibility_score` | `float` / `List[float]` | Plausibility score result. A single QA pair produces one float, and batched QA pairs produce a float list. |

---

#### Example Input
```json
[
  {
    "question": "Who trained Henry?",
    "answer": "Maria Rodriguez"
  }
]
```

#### Example Output
```json
[
  {
    "question": "Who trained Henry?",
    "answer": "Maria Rodriguez",
    "question_plausibility_score": 0.98
  }
]
```

---

#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/graph_rag/eval/graphrag_answer_plausibility_eval.py`
- Default prompt: `DataFlow-KG/dataflow/prompts/application_kg/graph_rag.py`
- Downstream filtering operator: `DataFlow-KG/dataflow/operators/graph_rag/filter/graphrag_answer_plausibility_filtering.py`


