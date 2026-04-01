---
title: ImageQAGenerator
createTime: 2025/10/15 16:00:00
# icon: material-symbols-light:quiz
permalink: /en/mm_operators/generate/image_qa/
---

## 📘 Overview

`ImageQAGenerator` is an operator designed to **automatically generate Question-Answer (QA) pairs based on image content (Visual QA)**.  
It intelligently proposes relevant questions based on the image scene and generates corresponding reference answers.

**Features:**

  * Supports batch processing of multiple images.
  * Automatically generates relevant QA pairs using Vision-Language Models (VLMs).
  * Applicable for Visual QA dataset construction and model training.
  * Automatically handles image input and QA prompt construction.

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

The `run` function executes the main operator logic: read image paths → **validate DataFrame** → construct prompts → call the model → generate Visual QA pairs and write them to the output file.

## 🧾 `run` Parameters

| Parameter         | Type              | Default     | Description                                                               |
| :---------------- | :---------------- | :---------- | :------------------------------------------------------------------------ |
| `storage`         | `DataFlowStorage` | -           | Dataflow storage object                                                   |
| `input_modal_key` | `str`             | `"image"`   | **Multimodal Input Field Name** (e.g., image paths)                       |
| `output_key`      | `str`             | `"output"`  | **Output QA Field Name** (defaults to `output`, can be customized)        |

-----

## 🧠 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.serving.local_model_vlm_serving import LocalModelVLMServing_vllm
from dataflow.operators.core_vision import ImageQAGenerator

# Step 1: Launch local model service
serving = LocalModelVLMServing_vllm(
    hf_model_name_or_path="Qwen/Qwen2.5-VL-3B-Instruct",
    vllm_tensor_parallel_size=1,
    vllm_temperature=0.7,
    vllm_top_p=0.9,
    vllm_max_tokens=1024
)

# Step 2: Prepare input data
storage = FileStorage(
    first_entry_file_name="dataflow/example/Image2TextPipeline/test_image2qa.jsonl",
    cache_path="./cache_local",
    file_name_prefix="imageqa",
    cache_type="jsonl",
)
storage.step() # Load data

# Step 3: Initialize and run the operator
qa_generator = ImageQAGenerator(serving)
qa_generator.run(
    storage=storage,
    input_modal_key="image",
    output_key="qa_pairs" # Explicitly specifying output field as "qa_pairs" in the example
)
```

-----

## 🧾 Default Output Format

| Field      | Type                     | Description                                                          |
| :--------- | :--------------------- | :------------------------------------------------------------------- |
| `image`    | `List[str]`            | Input image paths                                                    |
| `qa_pairs` | `List[Dict[str, str]]` | Generated QA pairs, containing `question` and `answer` fields        |

> **Note:** The raw output from the model (`output_key`) is typically a single string containing all QA pairs. A subsequent operator (like `JsonParser`) is usually required to structure this output into the `List[Dict[str, str]]` format shown here.

-----

### 📥 Example Input

```jsonl
{"image": ["./test/street_scene.jpg"]}
```

### 📤 Example Output (Structured)

```jsonl
{
  "image": ["./test/street_scene.jpg"],
  "qa_pairs": [
    {"question": "How many cars are in the image?", "answer": "Two cars"},
    {"question": "What is the scene depicted in this photo?", "answer": "A city street"},
    {"question": "What is the main mode of transportation shown?", "answer": "A car"}
  ]
}
```