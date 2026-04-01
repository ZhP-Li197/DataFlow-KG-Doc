---
title: PromptTemplatedVQAGenerator
createTime: 2026/01/11 21:25:34
permalink: /en/mm_operators/generate/prompt_templated_vqa_generator/
---
## 📘 Overview

`PromptTemplatedVQAGenerator` is a **Template-Based Multimodal VQA Operator**. It allows users to dynamically inject multiple fields from a DataFrame into a predefined Prompt Template to generate customized text instructions, which are then combined with image or video inputs for batch inference.

Unlike standard VQA operators, this operator supports complex prompt construction logic (e.g., dynamically filling in categories, context descriptions, etc.), making it highly suitable for scenarios requiring **structured prompt engineering**, such as attribute-guided image captioning or controlled dialogue simulation.

## 🏗️ `__init__` Function

```python
def __init__(
    self,
    serving: LLMServingABC,
    prompt_template: NamedPlaceholderPromptTemplate,
    system_prompt: str = "You are a helpful assistant.",
):

```

### 🧾 Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `serving` | `LLMServingABC` | N/A | The model serving instance for inference (must support multimodal inputs). |
| `prompt_template` | `NamedPlaceholderPromptTemplate` | N/A | A template object implementing `build_prompt` to convert dictionary data into a string prompt. |
| `system_prompt` | `str` | `"You are..."` | The system prompt sent to the model. |

## ⚡ `run` Function

```python
def run(
    self,
    storage: DataFlowStorage,
    input_image_key: str = "image",
    input_video_key: str = "video",
    output_answer_key: str = "answer",
    **input_keys,
):
    ...

```

Executes the main logic:

1. **Read Data**
Reads the DataFrame from `storage`.
2. **Dynamic Prompt Construction**
Iterates through each row of the DataFrame:
* Extracts data from columns specified in `input_keys` (e.g., `descriptions` column, `type` column).
* Calls `prompt_template.build_prompt()` to fill these values into the template, generating a unique `prompt_text` for that sample.


3. **Multimodal Input Assembly**
* Reads media paths from `input_image_key` or `input_video_key`.
* Packages the generated text prompt with the corresponding image/video data into the format required by the model.


4. **Inference & Output**
* Calls the model service for batch generation.
* Writes the results to the column specified by `output_answer_key` and saves the updated DataFrame.



### 🧾 `run` Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `storage` | `DataFlowStorage` | N/A | DataFlow storage object. |
| `input_image_key` | `str` | `"image"` | Column name for image paths (mutually exclusive with video_key). |
| `input_video_key` | `str` | `"video"` | Column name for video paths (mutually exclusive with image_key). |
| `output_answer_key` | `str` | `"answer"` | Column name for the generated output. |
| `**input_keys` | `kwargs` | N/A | **Key Parameter**. Defines the mapping between template placeholders and DataFrame columns.<br>

<br>Format: `template_var="dataframe_column"`. |

## 🧩 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.core import LLMServing
from dataflow.prompts.prompt_template import NamedPlaceholderPromptTemplate
from dataflow.operators.generate import PromptTemplatedVQAGenerator

# 1) Define a template with placeholders
# We want the model to check for a specific object type, referencing existing descriptions
TEMPLATE = (
    "Context: {descriptions}\n\n"
    "Task: Describe the appearance of {type} in the image based on the context above."
)
prompt_template = NamedPlaceholderPromptTemplate(template=TEMPLATE)

# 2) Initialize Operator
op = PromptTemplatedVQAGenerator(
    serving=LLMServing(model_path="Qwen/Qwen2.5-VL-3B-Instruct"),
    prompt_template=prompt_template
)

# 3) Prepare Data (assuming jsonl has image, meta_desc, obj_type columns)
storage = FileStorage(file_name_prefix="vqa_task")
storage.step()

# 4) Run Operator: Map 'meta_desc' to {descriptions}, 'obj_type' to {type}
op.run(
    storage=storage,
    input_image_key="image",
    output_answer_key="generated_caption",
    # Dynamic Mapping:
    descriptions="meta_desc", 
    type="obj_type"
)

```

### 🧾 Input/Output Example

**Input DataFrame Row:**
| image | meta_desc | obj_type |
| :--- | :--- | :--- |
| `"/path/to/car.jpg"` | `"A photo taken on a sunny day."` | `"vintage car"` |

**Constructed Prompt:**

> "Context: A photo taken on a sunny day.\n\nTask: Describe the appearance of **vintage car** in the image based on the context above."

**Output DataFrame Row:**
| image | meta_desc | obj_type | generated_caption |
| :--- | :--- | :--- | :--- |
| `"/path/to/car.jpg"` | `...` | `...` | `"The vintage car is red with..."` |