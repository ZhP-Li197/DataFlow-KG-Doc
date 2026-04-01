---
title: ImageCaptionGenerator
createTime: 2025/10/15 15:00:00
# icon: material-symbols-light:image
permalink: /en/mm_operators/generate/image_caption/
---

## 📘 Overview

`ImageCaptionGenerator` is an operator designed to **automatically generate image captions using large vision-language models (VLMs)**.  
Given input images, it constructs prompts to guide the model in producing high-quality scene or object descriptions. This is suitable for multimodal annotation, dataset construction, and image-text matching tasks.

**Features:**
* Supports batch processing of multiple images.
* Generates high-quality descriptions using VLMs like Qwen.
* Automatically handles image input and prompt construction.

---

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
| `llm_serving` | `LLMServingABC` | -       | **Model Serving Object** used to call the VLM for caption generation |

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

The `run` function executes the main caption generation workflow:
read image paths → **validate DataFrame** → construct prompts → call the model → generate text captions → write results to output.

## 🧾 `run` Parameters

| Parameter         | Type              | Default     | Description                                           |
| :---------------- | :---------------- | :---------- | :---------------------------------------------------- |
| `storage`         | `DataFlowStorage` | -           | Dataflow storage object                               |
| `input_modal_key` | `str`             | `"image"`   | **Multimodal Input Field Name** (e.g., image paths)   |
| `output_key`      | `str`             | `"output"`  | **Model Output Field Name** (the generated description text) |

-----

## 🧠 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.serving.local_model_vlm_serving import LocalModelVLMServing_vllm
from dataflow.operators.core_vision import ImageCaptionGenerator

# Step 1: Launch local model service
serving = LocalModelVLMServing_vllm(
    hf_model_name_or_path="Qwen/Qwen2.5-VL-3B-Instruct",
    vllm_tensor_parallel_size=1,
    vllm_temperature=0.7,
    vllm_top_p=0.9,
    vllm_max_tokens=512
)

# Step 2: Prepare input data
storage = FileStorage(
    first_entry_file_name="dataflow/example/image_to_text_pipeline/capsbench_captions.jsonl",
    cache_path="./cache_local",
    file_name_prefix="dataflow_cache_step",
    cache_type="jsonl",
)
storage.step() # Load data

# Step 3: Initialize and run the operator
generator = ImageCaptionGenerator(serving)
generator.run(
    storage=storage,
    input_modal_key="image",
    output_key="caption" # Explicitly specifying output field as "caption" in the example
)
```

-----

## 🧾 Default Output Format

| Field     | Type        | Description                  |
| :-------- | :---------- | :--------------------------- |
| `image`   | `List[str]` | Input image paths            |
| `caption` | `str`       | Generated image caption text |

-----

### 📥 Example Input

```jsonl
{"image": ["./test/example1.jpg"]}
{"image": ["./test/example2.jpg"]}
```

### 📤 Example Output

```jsonl
{"image": ["./test/example1.jpg"], "caption": "A young woman is standing on a city street and smiling."}
{"image": ["./test/example2.jpg"], "caption": "A cat is lying on the windowsill, with blue sky and white clouds outside."}
```