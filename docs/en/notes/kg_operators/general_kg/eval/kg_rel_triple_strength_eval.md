---
title: KGRelationStrengthScoring
createTime: 2026/04/10 15:40:44
permalink: /en/kg_operators/general_kg/eval/kg_rel_triple_strength_eval/
---

## 📚 Overview
`KGRelationStrengthScoring` is an evaluation operator that scores the semantic alignment strength between knowledge graph triples and their source text.
It reads a text chunk and its corresponding triples from each row, calls a large language model to score how well the triples are supported by the text, and writes the results back to the DataFrame.

Key characteristics of this operator:

- Depends on `LLMServingABC` for LLM-based evaluation.
- Uses `KGRelationStrengthScoringPrompt` by default to construct prompts; a custom prompt can be provided via the `prompt_template` parameter.
- Requires both a text column (`raw_chunk`) and a triple column (`triple`) as inputs.
- Input text undergoes a quality pre-filter: texts shorter than 10 characters or with fewer than 2 sentences are skipped and output `None`.
- Returns `None` for the current row when a model call fails or the response cannot be parsed.

---

## ✒️ `__init__` Parameters
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    prompt_template: Union[KGRelationStrengthScoringPrompt, DIYPromptABC] = None,
    num_q: int = 5
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM service object. The operator calls `generate_from_input` to score triple strength. |
| `seed` | `int` | `0` | Random seed for the internal random number generator. |
| `lang` | `str` | `"en"` | Prompt language. When `prompt_template` is `None`, the constructor creates `KGRelationStrengthScoringPrompt(lang)`. |
| `prompt_template` | `KGRelationStrengthScoringPrompt` / `DIYPromptABC` | `None` | Custom prompt template. If provided, it takes precedence over the default template. |
| `num_q` | `int` | `5` | Reserved parameter; not used in the current main pipeline. |

---

## 💡 `run` Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "raw_chunk",
    input_key_meta: str = "triple",
    output_key: str = "triple_strength_score"
):
    ...
```

`run` reads the DataFrame from `storage`, validates that both `input_key` and `input_key_meta` columns exist and the `output_key` column does not, then extracts the text and triple columns and calls `process_batch()` to handle each row. Each row's text first passes through `_preprocess_text()` quality filtering (texts shorter than 10 characters or with fewer than 2 sentences return empty directly). Texts that pass are used to construct prompts for the model to score, and the parsed `triple_strength_score` field is written back to the DataFrame.

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow storage object. The operator reads the `dataframe` from it and writes evaluation results back. |
| `input_key` | `str` | `"raw_chunk"` | Input text column name. Each cell should be a raw text string providing semantic context for the triples. |
| `input_key_meta` | `str` | `"triple"` | Input triple column name. Each cell should be a triple list or JSON string. |
| `output_key` | `str` | `"triple_strength_score"` | Output score column name for the triple strength score of each row. |

---

## 🤖 Example Usage
```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.general_kg.eval.kg_rel_triple_strength_eval import (
    KGRelationStrengthScoring,
)

operator = KGRelationStrengthScoring(
    llm_serving=llm_serving,
    lang="en",
)
operator.run(
    storage=storage,
    input_key="raw_chunk",
    input_key_meta="triple",
    output_key="triple_strength_score",
)
```

---

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `raw_chunk` | `str` | Input raw text chunk providing semantic context for the triples. |
| `triple` | `List[str]` / `str` | Input triple list, or a JSON string that can be parsed into a list. |
| `triple_strength_score` | `float` / `None` | Semantic support strength score of the triples against the corresponding text. Returns `None` if text quality is insufficient or a model error occurs. |

---

#### Example Input
```json
[
  {
    "raw_chunk": "Isaac Newton formulated the laws of motion and universal gravitation. His work laid the foundation for classical mechanics.",
    "triple": ["<subj> Newton <obj> laws of motion <rel> formulated"]
  },
  {
    "raw_chunk": "short text",
    "triple": ["<subj> Newton <obj> gravity <rel> discovered"]
  }
]
```

#### Example Output
```json
[
  {
    "raw_chunk": "Isaac Newton formulated the laws of motion and universal gravitation. His work laid the foundation for classical mechanics.",
    "triple": ["<subj> Newton <obj> laws of motion <rel> formulated"],
    "triple_strength_score": 0.93
  },
  {
    "raw_chunk": "short text",
    "triple": ["<subj> Newton <obj> gravity <rel> discovered"],
    "triple_strength_score": null
  }
]
```

---

#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/general_kg/eval/kg_rel_triple_strength_eval.py`
- Default prompt: `DataFlow-KG/dataflow/prompts/core_kg/rel_triple_eval.py`