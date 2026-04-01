---
title: PromptedVQAGenerator
createTime: 2026/01/11 21:37:37
permalink: /en/mm_operators/generate/prompted_vqa_generator/
---
## 📘 Overview

`PromptedVQAGenerator` is a **General-Purpose Multimodal VQA Operator**.

It reads **Prompts** and **Optional Media Paths (Image/Video)** directly from a DataFrame to generate answers. This operator is highly flexible:

* **Multimodal Support**: Performs VQA with text and image/video inputs.
* **Pure Text Support**: Automatically switches to pure text chat mode if no image or video columns are provided or if paths are empty.
* **Flexible Input Formats**: Can read raw text prompts or parse conversation-style lists.
* **Compatibility**: Automatically handles Chat Template encapsulation for local models (Local VLLM) and direct calls for API models.

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
| `serving` | `LLMServingABC` | N/A | The model serving instance for inference (supports Local or API models). |
| `system_prompt` | `str` | `"You are..."` | The system prompt sent to the model. |

## ⚡ `run` Function

```python
def run(
    self, 
    storage: DataFlowStorage,
    input_prompt_key: str = None,
    input_conversation_key: str = None,
    input_image_key: str = None,
    input_video_key: str = None,
    output_answer_key: str = "answer",
):
    ...

```

Executes the main logic:

1. **Data Loading & Prompt Extraction**
* Reads the DataFrame from `storage`.
* **Prompt Source (Mutually Exclusive)**:
* `input_prompt_key`: Reads the text string from this column as the User Prompt.
* `input_conversation_key`: Reads the conversation list (List[Dict]) and extracts the content of the first User Message.




2. **Media Processing**
* Attempts to read `input_image_key` and `input_video_key`.
* **Pure Text Mode Detection**: If media columns are not provided or media paths are empty/None for a row, the operator constructs a **Pure Text** request without `<image>` or `<video>` placeholders.


3. **Input Construction & Inference**
* **Local Mode**: Uses `process_vision_info` to handle images/videos and applies the Chat Template.
* **API Mode**: Passes raw prompts and media path lists directly.
* Calls `serving.generate_from_input` for batch inference.


4. **Save Results**
* Writes the generated output to the `output_answer_key` column.



### 🧾 `run` Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `storage` | `DataFlowStorage` | N/A | DataFlow storage object. |
| `input_prompt_key` | `str` | `None` | **Text Prompt Column**. Mutually exclusive with `conversation_key`. |
| `input_conversation_key` | `str` | `None` | **Conversation Column**. Mutually exclusive with `prompt_key`. Extracts the first user input if used. |
| `input_image_key` | `str` | `None` | **(Optional)** Image path column. Treated as a pure text task if empty. |
| `input_video_key` | `str` | `None` | **(Optional)** Video path column. |
| `output_answer_key` | `str` | `"answer"` | Output column name for generated results. |

## 🧩 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.core import LLMServing
from dataflow.operators.generate import PromptedVQAGenerator

# 1) Initialize Model
serving = LLMServing(model_path="Qwen/Qwen2.5-VL-3B-Instruct")

# 2) Initialize Operator
generator = PromptedVQAGenerator(
    serving=serving,
    system_prompt="You are a helpful assistant."
)

# 3) Prepare Data (jsonl)
# Sample A: {"image": "1.jpg", "question": "Describe this image."}
# Sample B: {"question": "What is AI?"} (No image, pure text)
storage = FileStorage(file_name_prefix="mixed_tasks")
storage.step()

# 4) Execute Generation
generator.run(
    storage=storage,
    input_prompt_key="question",  # Read prompt from 'question' column
    input_image_key="image",      # Read image from 'image' column (optional)
    output_answer_key="answer"
)

```

### 🧾 Input/Output Example

**Input DataFrame:**
| image | question |
| :--- | :--- |
| `"/data/cat.jpg"` | `"What animal is this?"` |
| `None` | `"Explain quantum physics briefly."` |

**Output DataFrame:**
| image | question | answer |
| :--- | :--- | :--- |
| `"/data/cat.jpg"` | `"What animal is this?"` | `"It is a cat."` |
| `None` | `"Explain quantum physics briefly."` | `"Quantum physics is the study of..."` |