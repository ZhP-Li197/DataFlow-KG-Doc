---
title: BatchVQAGenerator
createTime: 2026/01/11 21:54:10
permalink: /en/mm_operators/generate/batch_vqa_generator/
---
## 📘 Overview

`BatchVQAGenerator` is a **Batch Visual Question Answering Operator**.

It is designed for **"One Image, Many Questions"** scenarios. The input consists of a single image and a list of questions (e.g., ["What color?", "How many?", "What action?"]). The operator automatically pairs the image with each question in the list, constructs a batch request, and generates answers in parallel.

This mechanism is highly efficient for dense captioning, multi-perspective image analysis, or attribute-based Q&A tasks.

## 🏗️ `__init__` Function

```python
def __init__(
    self, 
    serving: LLMServingABC, 
    system_prompt: str = "You are a helpful assistant."
):

```

### 🧾 Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `serving` | `LLMServingABC` | N/A | The model serving instance for inference (must support VLM multimodal inputs). |
| `system_prompt` | `str` | `"You are..."` | The system prompt sent to the model. |

## ⚡ `run` Function

```python
def run(
    self, 
    storage: DataFlowStorage, 
    input_prompts_key: str, 
    input_image_key: str, 
    output_key: str
):
    ...

```

Executes the main logic:

1. **Data Loading**
Reads the image path (`input_image_key`) and the list of questions (`input_prompts_key`) from the DataFrame.
2. **Broadcasting & Batch Construction**
For each row:
* Retrieves the single image path.
* Iterates through every question `q` in the list.
* Constructs a standard multimodal message `[Image, Text(q)]` for each question.
* Packages all Q&A requests for that single image into one Batch.


3. **Parallel Inference**
Calls `serving.generate_from_input` to generate answers for all questions related to that image simultaneously using GPU parallelism.
4. **Save Results**
Writes the list of generated answers (in the same order as the question list) to the `output_key` column.

### 🧾 `run` Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `storage` | `DataFlowStorage` | N/A | DataFlow storage object. |
| `input_prompts_key` | `str` | N/A | Column name containing the **list of questions** (`List[str]`). |
| `input_image_key` | `str` | N/A | Column name containing the **single image** path. |
| `output_key` | `str` | N/A | Output column name for the list of answers (`List[str]`). |

## 🧩 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.core import LLMServing
from dataflow.operators.generate import BatchVQAGenerator

# 1) Initialize Model
serving = LLMServing(model_path="Qwen/Qwen2.5-VL-7B-Instruct")

# 2) Initialize Operator
generator = BatchVQAGenerator(
    serving=serving,
    system_prompt="Answer briefly."
)

# 3) Prepare Data (jsonl)
# Format: {"image": "scene.jpg", "questions": ["Weather?", "Object count?", "Action?"]}
storage = FileStorage(file_name_prefix="dense_captioning")
storage.step()

# 4) Execute Batch VQA
generator.run(
    storage=storage,
    input_prompts_key="questions",
    input_image_key="image",
    output_key="answers"
)

```

### 🧾 Output Format

The `output_key` column contains a list of strings corresponding to the input question list.

**Example Input DataFrame:**
| image | questions |
| :--- | :--- |
| `"park.jpg"` | `["Weather?", "Count?", "Action?"]` |

**Example Output DataFrame:**
| image | questions | answers |
| :--- | :--- | :--- |
| `"park.jpg"` | `["Weather?", "Count?", "Action?"]` | `["Sunny", "3 people", "Running"]` |