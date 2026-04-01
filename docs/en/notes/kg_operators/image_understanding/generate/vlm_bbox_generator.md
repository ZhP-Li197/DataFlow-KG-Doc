---
title: VLMBBoxGenerator
createTime: 2026/01/11 21:44:23
permalink: /en/mm_operators/generate/vlm_bbox_generator/
---


## 📘 Overview

`VLMBBoxGenerator` is a **Visual Grounding Generation Operator**.

It takes an image and a list of keywords, utilizing the localization capabilities of a VLM to detect objects corresponding to each keyword and output normalized Bounding Boxes (BBoxes). This operator automatically parses the coordinate text output by the model, converting it into a standardized `[x1, y1, x2, y2]` format.

Key Features:

* **Batch Parallelism**: Automatically assembles batch requests for multiple keywords within a single image to maximize inference efficiency.
* **Coordinate Normalization**: Compatible with both 0-1000 integer coordinates and 0-1 float coordinates, unifying them into a normalized range.
* **Exception Filtering**: Automatically filters out "not found" responses or invalid parsing results.

## 🏗️ `__init__` Function

```python
def __init__(
    self, 
    serving: LLMServingABC, 
    prompt_template: str = 'Detect "{keyword}".'
):

```

### 🧾 Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `serving` | `LLMServingABC` | N/A | The model serving instance for inference (must support Grounding/BBox output, e.g., Qwen-VL). |
| `prompt_template` | `str` | `'Detect "{keyword}".'` | The prompt template used to trigger detection. Must include the `{keyword}` placeholder. |

## ⚡ `run` Function

```python
def run(
    self, 
    storage: DataFlowStorage, 
    input_image_key: str, 
    input_kws_key: str, 
    output_key: str
):
    ...

```

Executes the main logic:

1. **Read Data**
Reads the image path (`input_image_key`) and the list of keywords to detect (`input_kws_key`) from the DataFrame.
2. **Batch Inference Construction**
For each row:
* Retrieves the unique list of keywords.
* Constructs a prompt (e.g., `"Detect "cat"."`) and the corresponding image input for each keyword.
* Packages requests for all keywords of that image into a single Batch and calls `serving.generate_from_input` for parallel generation.


3. **Result Parsing**
* **Coordinate Extraction**: Uses regex to extract coordinates in `(x1, y1), (x2, y2)` format.
* **Normalization**: If coordinates are > 1 (e.g., 0-1000 scale), divides by 1000 to normalize to 0-1.
* **Formatting**: Converts coordinates to `[x1, y1, x2, y2]` string format.
* **Filtering**: Discards failed responses containing "not found".


4. **Save Results**
Constructs a dictionary `{keyword: [bbox1, bbox2, ...]}` and writes it to the `output_key` column.

### 🧾 `run` Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `storage` | `DataFlowStorage` | N/A | DataFlow storage object. |
| `input_image_key` | `str` | N/A | Column name for the image path. |
| `input_kws_key` | `str` | N/A | Column name for the keyword list (`List[str]`). |
| `output_key` | `str` | N/A | Output column name (stored as a Dictionary). |

## 🧩 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.core import LLMServing
from dataflow.operators.generate import VLMBBoxGenerator

# 1) Initialize Model (Must support Grounding)
serving = LLMServing(model_path="Qwen/Qwen2.5-VL-7B-Instruct")

# 2) Initialize Operator
generator = VLMBBoxGenerator(
    serving=serving,
    prompt_template='Find the bounding box of "{keyword}".'
)

# 3) Prepare Data
# Format: {"image": "park.jpg", "objects": ["dog", "frisbee", "tree"]}
storage = FileStorage(file_name_prefix="bbox_task")
storage.step()

# 4) Execute Detection
generator.run(
    storage=storage,
    input_image_key="image",
    input_kws_key="objects",
    output_key="bbox_result"
)

```

### 🧾 Output Format

The `output_key` column contains a dictionary (`Dict[str, List[str]]`):

| Field | Type | Description |
| --- | --- | --- |
| Keyword | `str` | The input keyword. |
| BBoxes | `List[str]` | Detected BBoxes, formatted as `"[x1, y1, x2, y2]"` (top 3 results kept). |

**JSONL Example Output:**

```json
{
  "image": "park.jpg",
  "objects": ["dog", "frisbee", "ufo"],
  "bbox_result": {
    "dog": ["[0.125, 0.450, 0.230, 0.600]"],
    "frisbee": ["[0.240, 0.500, 0.280, 0.540]"]
    // "ufo" not detected, hence not in results
  }
}

```
