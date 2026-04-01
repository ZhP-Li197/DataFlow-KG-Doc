---
title: PersQAGenerator
createTime: 2025/10/15 18:20:00
# icon: material-symbols-light:quiz
permalink: /en/mm_operators/generate/image_pers_qa/
---

## 📘 Overview

`PersQAGenerator` is an operator designed to **generate personalized image Question-Answer (QA) pairs based on large vision-language models (VLMs)**.  
It performs the following steps:

  * Automatically assigns a name tag to the main character in the image (hardcoded as `<mam>` in the implementation).
  * Randomly selects an appropriate question from predefined templates.
  * Guides the VLM to start the answer with the character's name tag.
  * Outputs structured QA pairs, suitable for multimodal QA dataset construction and character role understanding evaluation.

**Features:**

  * Supports generating personalized QA for specific characters in images.
  * Automatically assigns name tags (e.g., `<mam>`) to the main subject.
  * Randomly selects relevant questions from predefined templates.
  * Requires the model to start answers with the main character's name tag.
  * Supports batch processing of multiple images.
  * Output includes the complete Question-Answer pair in the format: `Question: ..., Answer: ...`.

-----

## 🏗️ `__init__` Function

```python
def __init__(
    self,
    llm_serving: LLMServingABC
):
    ...
```

## 🧾 `__init__` Parameters

| Parameter     | Type            | Default | Description                                                     |
| :------------ | :-------------- | :------ | :-------------------------------------------------------------- |
| `llm_serving` | `LLMServingABC` | -       | **Model Serving Object** used to call the VLM for QA generation |

-----

## ⚡ `run` Function

```python
def run(
    self,
    storage: DataFlowStorage,
    input_modal_key: str = "image",
    output_key: str = "output"
):
    ...
```

The `run` function executes the main QA generation logic: read image paths → construct questions and prompts → call the model → return structured QA results.

## 🧾 `run` Parameters

| Parameter         | Type              | Default     | Description                                                          |
| :---------------- | :---------------- | :---------- | :------------------------------------------------------------------- |
| `storage`         | `DataFlowStorage` | -           | Dataflow storage object                                              |
| `input_modal_key` | `str`             | `"image"`   | **Multimodal Input Field Name** (image path)                         |
| `output_key`      | `str`             | `"output"`  | **Model Output Field Name** (personalized QA text, defaults to `output`) |

-----

## 🧠 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.serving.local_model_vlm_serving import LocalModelVLMServing_vllm
from dataflow.operators.core_vision import PersQAGenerator

# Step 1: Launch local model service
serving = LocalModelVLMServing_vllm(
    hf_model_name_or_path="Qwen/Qwen2.5-VL-3B-Instruct",
    vllm_tensor_parallel_size=1,
    vllm_temperature=0.7,
    vllm_top_p=0.9,
    vllm_max_tokens=512
)

# Step 2: Set up storage
storage = FileStorage(
    first_entry_file_name="dataflow/example/Image2TextPipeline/test_image2caption.jsonl",
    cache_path="./cache_local",
    file_name_prefix="pers_qa",
    cache_type="jsonl",
)
storage.step()

# Step 3: Initialize and run the operator
generator = PersQAGenerator(serving)
generator.run(
    storage=storage,
    input_modal_key="image",
    output_key="pers_qa"
)
```

-----

## 🧾 Default Output Format

| Field     | Type        | Description                                                          |
| :-------- | :---------- | :------------------------------------------------------------------- |
| `image`   | `List[str]` | Input image paths                                                    |
| `pers_qa` | `str`       | Generated personalized QA pair text, format: `Question: ..., Answer: ...` |

-----

### 📥 Example Input

```jsonl
{"image": ["./test/example1.jpg"]}
{"image": ["./test/example2.jpg"]}
```

### 📤 Example Output

```jsonl
{"image": ["./test/example1.jpg"], "pers_qa": "Question: <mam> is doing what?, Answer: <mam> is smiling at the camera."}
{"image": ["./test/example2.jpg"], "pers_qa": "Question: Where is <mam>?, Answer: <mam> is in a cafe."}
```

> **Tips:** Using a stronger Multimodal Large Language Model (MLLM) can ensure more accurate format generation.