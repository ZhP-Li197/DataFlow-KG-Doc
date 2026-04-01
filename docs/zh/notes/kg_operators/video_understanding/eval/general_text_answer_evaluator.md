---
title: 通用文本答案评估器（GeneralTextAnswerEvaluator）
createTime: 2025/01/20 11:00:00
permalink: /zh/mm_operators/video_understanding/eval/general_text_answer_evaluator/
---

## 📘 概述

`GeneralTextAnswerEvaluator` 是一个**通用文本答案评估算子**，支持多种问题类型的答案评估。它可以根据问题类型自动选择合适的评分指标，包括选择题的精确匹配、数值题的数值比较、OCR题的词错率、自由问答的ROUGE分数等。

---

## 🏗️ `__init__` 函数

```python
def __init__(
    self,
    use_stemmer: bool = True
):
    ...
```

## 🧾 `__init__` 参数说明

| 参数名          | 类型     | 默认值    | 说明                      |
| :----------- | :----- | :----- | :---------------------- |
| `use_stemmer` | `bool` | `True` | 计算ROUGE分数时是否使用词干提取器     |

---

## ⚡ `run` 函数

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

执行算子主逻辑：从 storage 读取模型输出、标准答案和问题类型，根据问题类型计算评分，并写回存储。

## 🧾 `run` 参数说明

| 参数名                      | 类型                | 默认值              | 说明                      |
| :----------------------- | :---------------- | :--------------- | :---------------------- |
| `storage`                | `DataFlowStorage` | -                | Dataflow 数据存储对象          |
| `input_model_output_key` | `str`             | `"model_output"` | 输入数据中模型输出字段名            |
| `input_gt_solution_key`  | `str`             | `"solution"`     | 输入数据中标准答案字段名            |
| `input_question_type_key`| `str`             | `"problem_type"` | 输入数据中问题类型字段名            |
| `output_reward_key`      | `str`             | `"reward"`       | 输出奖励分数字段名               |

---

## 🎯 支持的问题类型与评分方式

| 问题类型             | 评分方式                            | 分数范围   |
| :--------------- | :------------------------------ | :----- |
| `multiple choice`| 精确匹配（Exact Match）                | 0 或 1  |
| `numerical`      | 数值比较（四舍五入到小数点后2位）               | 0 或 1  |
| `OCR`            | 基于词错率（WER）的评分，score = 1 - WER   | 0 到 1  |
| `free-form`      | ROUGE分数（平均F-measure）            | 0 到 1  |
| `regression`     | 基于相对差异的评分，score = 1 - rel_diff | 0 到 1  |

---

## 🧠 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import GeneralTextAnswerEvaluator

# Step 1: 准备 FileStorage（需要包含 model_output, solution, problem_type 列）
storage = FileStorage(
    first_entry_file_name="data/text_eval_input.jsonl",
    cache_path="./cache_local",
    file_name_prefix="text_eval",
    cache_type="jsonl"
)

# Step 2: 初始化算子
evaluator = GeneralTextAnswerEvaluator(
    use_stemmer=True
)

# Step 3: 执行评估
evaluator.run(
    storage=storage.step(),
    input_model_output_key="model_output",
    input_gt_solution_key="solution",
    input_question_type_key="problem_type",
    output_reward_key="reward"
)
```

---

### 🧾 默认输出格式（Output Format）

**新增字段：**
- `reward` (float): 答案评估得分（0.0 到 1.0）

示例输入：

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

示例输出：

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

## 🔗 相关链接

- **代码:** [GeneralTextAnswerEvaluator](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_vision/eval/general_text_answer_evaluator.py)
