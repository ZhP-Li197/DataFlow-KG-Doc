---
title: HRKGTripleCompletenessEvaluator
createTime: 2026/03/18 00:00:00
permalink: /en/kg_operators/hyper_relation_kg/eval/hrkg_rel_triple_completeness_eval/
---

## 📚 Overview

[HRKGTripleCompletenessEvaluator](https://github.com/ZhP-Li197/DataFlow-KG/tree/main/dataflow/operators/hyper_relation_kg/eval/hrkg_rel_triple_completeness_eval.py) is a hyper-relational KG triple completeness evaluation operator based on large language models (LLM). It evaluates whether each hyper-relational tuple contains all necessary information (subject, object, relation, and key attributes) and assigns a completeness score (0–1) to each tuple. The operator supports both Python list and JSON-encoded string list inputs, and returns a list of scores aligned with the input tuples.

## ✒️ `__init__` Function

```python
def __init__(self, llm_serving: LLMServingABC, lang: str = "en"):
```

#### Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| **llm_serving** | LLMServingABC | Required | Large language model serving instance, used for completeness evaluation reasoning. |
| **lang** | str | "en" | Language setting, affects prompt template language; supports "en" or "zh". |

#### Prompt Template

The prompt uses `HRKGTripleCompletenessPrompt`:

```python
def build_system_prompt(self):
    return textwrap.dedent("""\
        You are an expert in Knowledge Graph triple quality evaluation.
        Your task is to evaluate the **completeness** of each triple.

        ### Evaluation Criteria
        - Does the triple contain subject, object, and relation?
        - Are the key attributes for the relation present?
        - Are attribute values clear and reasonable?
        - Determine if the triple is missing important information.

        ### Output Format
        Return ONLY a JSON object:

        {
            "completeness_scores": [float, float, ...]
        }

        Each score corresponds to one triple (0-1):
        1 = fully complete
        0.5 = partially complete
        0 = severely incomplete or unclear

        Do not output explanations.
    """)

def build_prompt(self, triples: list):
    return f"""Evaluate the completeness of the following KG triples.

        --- Triples ---
        {triple_block}

        Return ONLY a JSON object containing completeness scores for each triple (0-1)."""
```

## 💡 `run` Function

`run` reads a DataFrame from `storage`, validates the storage is available, and iterates over each row. For each row, it extracts the tuple list from `input_key`, parses it (supporting both Python list and JSON string formats), and calls the LLM with the prompt template to evaluate completeness scores. The resulting score list is written into the `output_key` column. If a row is empty, parsing fails, or the LLM call raises an exception, an empty list is written for that row. The function returns a list containing the `output_key` string.

```python
def run(self, storage: DataFlowStorage = None, input_key: str = "tuple", output_key: str = "completeness_scores"):
```

#### Parameters

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| **storage** | DataFlowStorage | None | DataFlow storage instance, responsible for reading and writing data. |
| **input_key** | str | "tuple" | Input column name, corresponding to the hyper-relational tuple list field. Each row can be a Python list or a JSON-encoded string. |
| **output_key** | str | "completeness_scores" | Output column name, corresponding to the completeness score list field. |

## 🤖 Example Usage

```python
from dataflow.operators.hyper_relation_kg.eval import HRKGTripleCompletenessEvaluator
from dataflow.utils.storage import FileStorage
from dataflow.utils.llm_serving import APILLMServing_request

storage = FileStorage(first_entry_file_name="hrkg_eval.json")

llm_serving = APILLMServing_request(
    api_url="http://<your_llm_api_endpoint>",
    model_name="<your_model_name>",
)

evaluator = HRKGTripleCompletenessEvaluator(
    llm_serving=llm_serving,
    lang="en",
)
evaluator.run(
    storage.step(),
    input_key="tuple",
    output_key="completeness_scores",
)
```

#### Default Output Format

| Field | Type | Description |
| --- | --- | --- |
| tuple | List[str] | Input hyper-relational tuple list (preserved). |
| completeness_scores | List[float] | Completeness scores (0–1) for each tuple; 1=fully complete, 0=severely incomplete. |

**Example Input:**

```json
{
  "tuple": [
    "<subj> Elon Musk <obj> Announcement <rel> MadeAt <Time> May 15, 2025 <Location> Tesla Gigafactory, Berlin, Germany",
    "<subj> Tesla Model Y <obj> 4680 Battery <rel> WillAdopt <Time> Third quarter of 2025 <Location> European market",
    "<subj> Tesla Model Y <obj> Cruising Range <rel> IncreasedTo <Value> 600 kilometers"
  ]
}
```

**Example Output:**

```json
{
  "tuple": ["..."],
  "completeness_scores": [1.0, 0.95, 1.0]
}
```

---

#### Related Links

- Operator implementation: `DataFlow-KG/dataflow/operators/hyper_relation_kg/eval/hrkg_rel_triple_completeness_eval.py`
- Prompt templates: `DataFlow-KG/dataflow/prompts/diverse_kg/hrkg.py`
- Downstream operator: `DataFlow-KG/dataflow/operators/hyper_relation_kg/filter/hrkg_rel_triple_consistency_filtering.py`
