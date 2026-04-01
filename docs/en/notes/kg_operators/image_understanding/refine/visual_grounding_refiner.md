---
title: VisualGroundingRefiner
createTime: 2026/01/11 20:33:54
permalink: /en/mm_operators/refine/visual_grounding_refiner/
---
## 📘 Overview

`VisualGroundingRefiner` is a **Visual Consistency Refinement Operator** designed to eliminate "hallucinations" in multimodal text generation.

This operator takes a list of text items (e.g., tags, sentences, or attributes) and an image, and performs **item-wise Visual Verification** using a VLM. It employs a "Yes/No" discrimination mechanism, retaining only the text items that the model confirms as "Yes" (consistent with the image), thereby filtering out non-existent objects or incorrect descriptions.

## `__init__` Function

```python
def __init__(
    self, 
    serving: LLMServingABC, 
    prompt_template: str, 
    system_prompt: str = "You are a helpful assistant."
):

```

### Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `serving` | `LLMServingABC` | N/A | The model serving instance for inference (must support VLM multimodal inference). |
| `prompt_template` | `str` | N/A | The prompt template used for verification. **Must include the `{text}` placeholder** and be designed to elicit a "Yes" or "No" response. |
| `system_prompt` | `str` | `"You are..."` | The system prompt sent to the model. |

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
Retrieves the list of texts to be verified (`input_list_key`) and the corresponding image path (`input_image_key`) from the DataFrame.
2. **Batch Construction**
For each `item` in the text list:
* Generates a query using `prompt_template.format(text=item)`.
* Constructs a multimodal message containing `[Image, Text]`.


3. **Batch Inference**
* Packages multiple text verification requests for the single image into a batch.
* Calls `serving.generate_from_input` for parallel inference to get responses.


4. **Filtering Logic**
* Checks if the model's response contains `"yes"` (case-insensitive).
* **Keeps** items where the answer is Yes, and **Discards** items where the answer is No or ambiguous.


5. **Save Results**
Writes the filtered list to the `output_key`.

### Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `storage` | `DataFlowStorage` | N/A | DataFlow storage object. |
| `input_list_key` | `str` | N/A | Column name containing the list of texts to verify (List[str]). |
| `input_image_key` | `str` | N/A | Column name containing the image path. |
| `output_key` | `str` | N/A | Output column name for the verified list. |

## 🧠 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.core import LLMServing
from dataflow.operators.refine import VisualGroundingRefiner

# 1) Initialize Model Serving
serving = LLMServing(model_path="Qwen/Qwen-VL-Chat", device="cuda")

# 2) Initialize Refiner
# Key: The template must ask for a Yes/No answer
refiner = VisualGroundingRefiner(
    serving=serving,
    prompt_template="Look at the image. Is the object '{text}' visible in the scene? Answer only Yes or No."
)

# 3) Execute
refiner.run(
    storage=storage,
    input_list_key="candidate_tags",  # e.g., ["Cat", "Dog", "UFO"]
    input_image_key="image_path",
    output_key="verified_tags"
)

```

### 🧾 Output Format

The `output_key` column contains the filtered list of strings:

Example Input (`candidate_tags`):

```json
["Cat", "Grass", "Flying Saucer"]

```

*(Assuming the image shows a cat on grass)*

Example Output (`verified_tags`):

```json
["Cat", "Grass"]

```