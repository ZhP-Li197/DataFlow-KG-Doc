---
title: LegalKGCaseSummarySimilarity
createTime: 2026/04/15 09:00:00
permalink: /en/kg_operators/domain_kg/legal_kg/eval/legalkg_case_similarity_eval/
---

## 📚 Overview

`LegalKGCaseSummarySimilarity` evaluates the semantic similarity between a case summary and a case-type description. It reads one summary per row, calls the LLM, and writes the returned `similarity_score` back into the DataFrame.

The current implementation reads `case_summary` by default and writes to `similarity_score` by default. However, `process_batch()` expects a `List[str]` as its second argument, while `run()` passes `input_key_meta` through directly. If a normal string such as `"theft case"` is provided, the code iterates over it character by character instead of using the full string for each row.

If the model output cannot be parsed as JSON, the corresponding row receives `None`.

## ✒️ `__init__` Function

```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "zh",
    merge_to_input: bool = False,
    prompt_template: Union[CaseSummarySimilarityPrompt, DIYPromptABC] = None,
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM service object used to score similarity |
| `seed` | `int` | `0` | Initializes the internal random generator; the current main flow does not use randomness |
| `lang` | `str` | `"zh"` | Prompt language |
| `merge_to_input` | `bool` | `False` | Reserved parameter not used in the current flow |
| `prompt_template` | `Union[CaseSummarySimilarityPrompt, DIYPromptABC]` | `None` | Optional custom prompt template; defaults to `CaseSummarySimilarityPrompt` |

## 💡 `run` Function

```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "case_summary",
    input_key_meta: str = "盗窃案件",
    output_key: str = "similarity_score",
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | DataFlow storage object |
| `input_key` | `str` | `"case_summary"` | Input column containing case summaries |
| `input_key_meta` | `str` / `List[str]` | `"盗窃案件"` | The source signature uses `str`, but a `List[str]` is needed to match the batch-function contract. A plain string is iterated character by character |
| `output_key` | `str` | `"similarity_score"` | Output score column name |

`run` first validates that `input_key` exists, then reads all summaries and sends them to `process_batch()`. In the current code, `input_key_meta` is passed directly into the `case_types` parameter even though that parameter is typed as `List[str]`. As a result:

- a plain string is zipped character by character with the summaries
- the behavior only matches the function signature when `input_key_meta` is itself an iterable of case-type strings
- if the iterable length is shorter than the number of DataFrame rows, the generated result list also becomes shorter and the later column assignment will fail due to a length mismatch

So the default value `"盗窃案件"` should be understood as a source-code placeholder, not as a batch-safe input format.

After execution, it writes the score column back to the DataFrame and returns:

```python
["similarity_score"]
```

## 🤖 Example Usage

```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.legal_kg.eval.legalkg_case_similarity_eval import (
    LegalKGCaseSummarySimilarity,
)

dataframe = pd.DataFrame(
    [
        {
            "case_summary": "The defendant stole a mobile phone from a shopping mall and was later arrested. The court determined that the conduct constituted theft."
        }
    ]
)

storage = DummyStorage()
storage.set_data(dataframe)

operator = LegalKGCaseSummarySimilarity(
    llm_serving=llm_serving,
    lang="en",
)
operator.run(
    storage=storage,
    input_key="case_summary",
    input_key_meta=["theft case"],
    output_key="similarity_score",
)
```

#### Example Input

```json
[
  {
    "case_summary": "The defendant stole a mobile phone from a shopping mall and was later arrested. The court determined that the conduct constituted theft."
  }
]
```

#### Example Output

```json
[
  {
    "case_summary": "The defendant stole a mobile phone from a shopping mall and was later arrested. The court determined that the conduct constituted theft.",
    "similarity_score": 0.96
  }
]
```

#### Related Links

- Operator implementation: `DataFlow-KG/dataflow/operators/domain_kg/legal_kg/eval/legalkg_case_similarity_eval.py`
- Default prompt: `DataFlow-KG/dataflow/prompts/diverse_kg/legalkg.py`
