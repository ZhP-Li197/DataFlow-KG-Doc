---
title: LegalKGJudgementPrediction
createTime: 2026/04/15 09:00:00
permalink: /en/kg_operators/domain_kg/legal_kg/generate/legalkg_case_judgement_generator/
---

## 📚 Overview

`LegalKGJudgementPrediction` predicts a legal judgement from legal KG tuples and a case description, and returns the supporting triples selected by the model. It reads `triple` by default and writes `judgement` and `reason` back into the DataFrame.

In the current implementation, `input_key_meta` is not a column name. Note that `process_batch()` expects `case_descs` to be a `List[str]`, but `run()` passes `input_key_meta` through directly. If a plain string is provided, the code iterates over that string character by character instead of passing the full case description to each row. If the model output cannot be parsed as JSON, the corresponding row receives `None`.

## ✒️ `__init__` Function

```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "zh",
    prompt_template: Union[LegalKGJudgementPredictionPrompt, DIYPromptABC] = None,
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM service object |
| `seed` | `int` | `0` | Initializes the internal random generator; the current main flow does not use randomness |
| `lang` | `str` | `"zh"` | Prompt language |
| `prompt_template` | `Union[LegalKGJudgementPredictionPrompt, DIYPromptABC]` | `None` | Optional custom prompt template; defaults to the legal judgement prompt |

## 💡 `run` Function

```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "triple",
    input_key_meta: str = "张三偷了一部苹果手机",
    output_key_judgement: str = "judgement",
    output_key_reason: str = "reason",
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | DataFlow storage object |
| `input_key` | `str` | `"triple"` | Input legal KG tuple column |
| `input_key_meta` | `str` / `List[str]` | `"张三偷了一部苹果手机"` | The source signature uses `str`, but a `List[str]` is needed to match the batch-function contract. A plain string is iterated character by character |
| `output_key_judgement` | `str` | `"judgement"` | Output column for the predicted judgement |
| `output_key_reason` | `str` | `"reason"` | Output column for supporting tuples |

`run` reads the `input_key` column as `List[str]` values and passes `input_key_meta` directly into `process_batch()`. Because `process_batch()` types `case_descs` as `List[str]`, the current implementation has the following limitation:

- a plain string is zipped character by character with `triples_list`
- the behavior only matches the function signature when `input_key_meta` is itself an iterable of case-description strings
- if the iterable length is shorter than the number of input rows, the result list also becomes shorter and the later assignments to `judgement` and `reason` will fail due to a length mismatch

After the JSON response is parsed, the operator extracts:

- `judgement`: the predicted decision text
- `reason`: the list of supporting triples

It writes both columns back to the DataFrame and returns:

```python
["judgement", "reason"]
```

## 🤖 Example Usage

```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.legal_kg.generate.legalkg_case_judgement_generator import (
    LegalKGJudgementPrediction,
)

dataframe = pd.DataFrame(
    [
        {
            "triple": [
                "<entity> Zhang San <attribute> charge <value> theft",
                "<entity> Zhang San <attribute> amount_involved <value> RMB 6000"
            ]
        }
    ]
)

storage = DummyStorage()
storage.set_data(dataframe)

operator = LegalKGJudgementPrediction(
    llm_serving=llm_serving,
    lang="en",
)
operator.run(
    storage=storage,
    input_key="triple",
    input_key_meta=["Zhang San stole a mobile phone worth RMB 6000 from a shopping mall."],
    output_key_judgement="judgement",
    output_key_reason="reason",
)
```

#### Example Input

```json
[
  {
    "triple": [
      "<entity> Zhang San <attribute> charge <value> theft",
      "<entity> Zhang San <attribute> amount_involved <value> RMB 6000"
    ]
  }
]
```

#### Example Output

```json
[
  {
    "triple": [
      "<entity> Zhang San <attribute> charge <value> theft",
      "<entity> Zhang San <attribute> amount_involved <value> RMB 6000"
    ],
    "judgement": "Fixed-term imprisonment of three years and a fine.",
    "reason": [
      "<entity> Zhang San <attribute> charge <value> theft",
      "<entity> Zhang San <attribute> amount_involved <value> RMB 6000"
    ]
  }
]
```

#### Related Links

- Operator implementation: `DataFlow-KG/dataflow/operators/domain_kg/legal_kg/generate/legalkg_case_judgement_generator.py`
- Default prompt: `DataFlow-KG/dataflow/prompts/diverse_kg/legalkg.py`
