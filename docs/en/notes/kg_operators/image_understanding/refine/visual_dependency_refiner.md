---
title: VisualDependencyRefiner
createTime: 2026/01/11 20:27:11
permalink: /en/mm_operators/refine/visual_dependency_refiner/
---
## 📘 Overview

`VisualDependencyRefiner` is a **Visual Dependency Validation Operator** designed for strict quality control of Multiple Choice Questions (MCQs).

In multimodal datasets, many questions can inadvertently be answered using common sense or textual bias without looking at the image. This operator employs a **"Rotation + Double-Blind Test"** mechanism to filter for high-quality questions that are **Visually Dependent (High Visual Acc)** and **Not Textually Dependent (Low Text Acc)**.

Core Mechanisms:

1. **Option Rotation**: Shuffles answer options multiple times for the same question to eliminate position bias (e.g., model always choosing 'A').
2. **Double-Blind Comparison**:
* **Visual Mode**: Inputs Image + Question. Requires high accuracy.
* **Text-Only Mode**: Inputs only the Question (blind test). Requires low accuracy (close to random chance).



## `__init__` Function

```python
def __init__(
    self, 
    serving: LLMServingABC, 
    instruction_template: str,
    rotate_num: int = 4,
    pass_visual_min: float = 1.0,
    pass_textual_max: float = 0.25, 
    add_none_above_visual: bool = True
):

```

### Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `serving` | `LLMServingABC` | N/A | The model serving instance for inference (must support both multimodal and text-only modes). |
| `instruction_template` | `str` | N/A | Prompt template containing a `{}` placeholder for the question and options. |
| `rotate_num` | `int` | `4` | Number of validation rounds. N variants with shuffled options are generated per question. |
| `pass_visual_min` | `float` | `1.0` | **Visual Threshold**. Accuracy in Visual Mode must be  this value (default: 100% correct). |
| `pass_textual_max` | `float` | `0.25` | **Textual Threshold**. Accuracy in Text-Only Mode must be  this value (default: 25%, random chance for 4 options). |
| `add_none_above_visual` | `bool` | `True` | Whether to dynamically add "None of the above" to options in **Visual Mode** to increase difficulty and reduce hallucinations. |

## `run` Function

```python
def run(
    self, 
    storage: DataFlowStorage, 
    input_list_key: str, 
    input_image_key: str, 
    output_key: str
):
    ...

```

Executes the main logic:

1. **Read Data**
Iterates through the DataFrame, retrieving image paths (`input_image_key`) and MCQ lists (`input_list_key`).
2. **Construct Double-Blind Tests**
For each question, iterates `rotate_num` times:
* **Visual Case**: Shuffles options (optionally adds "None of the above") and builds an `[Image, Instruction]` prompt.
* **Text-Only Case**: Shuffles options (without extra distractors) and builds an `[Instruction]` prompt.


3. **Batch Inference**
* Groups Visual Prompts and Text Prompts into separate batches.
* Calls `serving.generate_from_input` to get results for both modes.


4. **Accuracy Calculation & Filtering**
* Parses the model output for option letters (A/B/C...).
* Calculates **Visual Accuracy (`v_acc`)** and **Text-Only Accuracy (`l_acc`)**.
* Keeps the question only if `v_acc >= pass_visual_min` **AND** `l_acc <= pass_textual_max`.


5. **Save Results**
Writes the filtered list of questions to the `output_key` column.

### Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `storage` | `DataFlowStorage` | N/A | DataFlow storage object. |
| `input_list_key` | `str` | N/A | Column name containing the list of MCQs (List[Dict]). |
| `input_image_key` | `str` | N/A | Column name containing image paths. |
| `output_key` | `str` | N/A | Output column name for the filtered list. |

## 🧠 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.core import LLMServing
from dataflow.operators.refine import VisualDependencyRefiner

# 1) Initialize Model Serving (e.g., Qwen-VL)
serving = LLMServing(model_path="Qwen/Qwen-VL-Chat", device="cuda")

# 2) Initialize Refiner
# Criteria: Must be perfect with image (1.0), but fail without image (<= 0.25)
refiner = VisualDependencyRefiner(
    serving=serving,
    instruction_template="Answer the question based on the image.\n{}",
    rotate_num=4,
    pass_visual_min=1.0,
    pass_textual_max=0.25
)

# 3) Execute
refiner.run(
    storage=storage,
    input_list_key="generated_qas",
    input_image_key="image_path",
    output_key="refined_qas"
)

```

### 🧾 Output Format

The `output_key` column contains the filtered list of questions. Each question item includes a new `stats` field:

```json
[
  {
    "question": "What color is the car?",
    "options": {"A": "Red", "B": "Blue", ...},
    "answer": "A",
    "stats": {
      "v_acc": 1.0,  // Visual Accuracy
      "t_acc": 0.0   // Text-Only Accuracy
    }
  }
]

```
