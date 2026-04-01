---
title: General Text Answer Evaluator (GeneralTextAnswerEvaluator)
createTime: 2025/01/20 11:00:00
permalink: /en/mm_operators/video_understanding/eval/general_text_answer_evaluator/
---

## 📘 Overview

`GeneralTextAnswerEvaluator` is a **general text answer evaluation operator** that supports evaluation of multiple question types. It automatically selects appropriate scoring metrics based on question type, including exact matching for multiple choice, numerical comparison for numerical questions, Word Error Rate for OCR, ROUGE scores for free-form answers, etc.

---

## 🏗️ `__init__` Function

```python
def __init__(
    self,
    use_stemmer: bool = True
):
    ...
```

## 🧾 `__init__` Parameters

| Parameter     | Type   | Default | Description                           |
| :------------ | :----- | :------ | :------------------------------------ |
| `use_stemmer` | `bool` | `True`  | Whether to use stemmer in ROUGE calculation |

---

## ⚡ `run` Function

```python
def run(
    self,
    storage: DataFlowStorage,
    input_model_output_key: str = "model_output",
    input_gt_solution_key: str = "solution",
    input_question_type_key: str = "problem_type",
    output_reward_key: str = "reward"
):
    ...
```

Executes the main logic: reads model outputs, ground truth solutions, and question types from storage, calculates scores based on question types, and writes back to storage.

## 🧾 `run` Parameters

| Parameter                 | Type              | Default          | Description                      |
| :------------------------ | :---------------- | :--------------- | :------------------------------- |
| `storage`                 | `DataFlowStorage` | -                | DataFlow storage object          |
| `input_model_output_key`  | `str`             | `"model_output"` | Field name for model output      |
| `input_gt_solution_key`   | `str`             | `"solution"`     | Field name for ground truth      |
| `input_question_type_key` | `str`             | `"problem_type"` | Field name for question type     |
| `output_reward_key`       | `str`             | `"reward"`       | Output field name for reward score |

---

## 🎯 Supported Question Types & Scoring Methods

| Question Type     | Scoring Method                          | Score Range |
| :---------------- | :-------------------------------------- | :---------- |
| `multiple choice` | Exact Match                             | 0 or 1      |
| `numerical`       | Numerical comparison (rounded to 2 decimals) | 0 or 1    |
| `OCR`             | WER-based scoring, score = 1 - WER      | 0 to 1      |
| `free-form`       | ROUGE score (average F-measure)         | 0 to 1      |
| `regression`      | Relative difference-based, score = 1 - rel_diff | 0 to 1 |

---

## 🧠 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import GeneralTextAnswerEvaluator

# Step 1: Prepare FileStorage (needs model_output, solution, problem_type columns)
storage = FileStorage(
    first_entry_file_name="data/text_eval_input.jsonl",
    cache_path="./cache_local",
    file_name_prefix="text_eval",
    cache_type="jsonl"
)

# Step 2: Initialize operator
evaluator = GeneralTextAnswerEvaluator(
    use_stemmer=True
)

# Step 3: Execute evaluation
evaluator.run(
    storage=storage.step(),
    input_model_output_key="model_output",
    input_gt_solution_key="solution",
    input_question_type_key="problem_type",
    output_reward_key="reward"
)
```

---

### 🧾 Default Output Format

**Added Field:**
- `reward` (float): Answer evaluation score (0.0 to 1.0)

Example Input:

```jsonl
{
  "model_output": "The answer is <answer>B</answer>",
  "solution": "The correct answer is <answer>B</answer>",
  "problem_type": "multiple choice"
}
{
  "model_output": "The result is <answer>42.5</answer>",
  "solution": "The answer is <answer>42.50</answer>",
  "problem_type": "numerical"
}
{
  "model_output": "<answer>The cat is sitting on the mat</answer>",
  "solution": "<answer>A cat is sitting on a mat</answer>",
  "problem_type": "free-form"
}
```

Example Output:

```jsonl
{
  "model_output": "The answer is <answer>B</answer>",
  "solution": "The correct answer is <answer>B</answer>",
  "problem_type": "multiple choice",
  "reward": 1.0
}
{
  "model_output": "The result is <answer>42.5</answer>",
  "solution": "The answer is <answer>42.50</answer>",
  "problem_type": "numerical",
  "reward": 1.0
}
{
  "model_output": "<answer>The cat is sitting on the mat</answer>",
  "solution": "<answer>A cat is sitting on a mat</answer>",
  "problem_type": "free-form",
  "reward": 0.85
}
```

---

## 🔗 Related Links

- **Code:** [GeneralTextAnswerEvaluator](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_vision/eval/general_text_answer_evaluator.py)

