---
title: ImageVQAScoreEvaluator
createTime: 2025/10/15 14:52:29
# icon: material-symbols-light:image
permalink: /en/mm_operators/eval/image_vqa_evaluator/
---
## 📘 Overview
`ImageVQAScoreEvaluator` leverages a **BLIP visual question answering (VQA) model** to compute a **Yes-probability score** that quantifies whether an image is aligned with a given textual description, with values in the interval `[0, 1]`.  
The core idea is as follows: the textual description is wrapped into an English interrogative prompt of the form *“Does this image match the description?”*, using `"yes"` and `"no"` as candidate answers.  
The model is then queried twice with `"yes"` and `"no"` as labels, and their respective losses are converted into relative probabilities. The normalized probability assigned to `"yes"` is taken as the image–text consistency score.


## ```__init__```
```python
def __init__(
    self,
    model_name: str = "Salesforce/blip-vqa-base",
    device: str = None,
    local_only: bool = True,
):
  ...
```


## `init` Parameters
| Parameter    | Type          | Default                       | Description |
| :----------- | :------------ | :---------------------------- | :---------- |
| `model_name` | `str`         | `"Salesforce/blip-vqa-base"`  | Hugging Face Model ID or local path of the BLIP VQA model; loaded via `BlipProcessor` / `BlipForQuestionAnswering`. |
| `device`     | `str \| None` | `None`                        | Inference device. When `None`, the operator automatically selects `"cuda"` if available; otherwise it falls back to `"cpu"`. |
| `local_only` | `bool`        | `True`                        | Whether to load model weights strictly from local files. When `True`, the model is loaded with `local_files_only=True` (recommended for offline or restricted-network environments). |



## `run`
```python
def run(
    self,
    storage: DataFlowStorage,
    input_image_key: str = "image_path",
    input_text_key: str = "text",
    output_key: str = "vqa_score"
):
    ...
```

Parameters
| Parameter        | Type              | Default         | Description |
| :--------------- | :---------------- | :-------------- | :---------- |
| `storage`        | `DataFlowStorage` | —               | Dataflow storage object used for reading and writing the DataFrame. |
| `input_image_key`| `str`             | `"image_path"`  | Name of the column containing image paths. |
| `input_text_key` | `str`             | `"text"`        | Name of the column containing textual descriptions (which will be wrapped into English questions). |
| `output_key`     | `str`             | `"vqa_score"`   | Name of the output field storing the VQA score (range `[0, 1]`), representing the model’s probability that “the image matches the description”. |



## 🧠 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import ImageVQAScoreEvaluator

# 1) Prepare FileStorage (must contain at least image_path and text columns)
storage = FileStorage(
    first_entry_file_name="./dataflow/example/test_image_eval/test_image_eval.jsonl",
    cache_path="./cache_local",
    file_name_prefix="vqa_eval",
    cache_type="jsonl"
)

# 2) Initialize the VQA-based evaluator (can be pointed to a local model path)
evaluator = ImageVQAScoreEvaluator(
    model_name="Salesforce/blip-vqa-base",
    device=None,      # automatically selects cuda/cpu
    local_only=True   # load from local files only (recommended offline)
)

# 3) Run evaluation: adds vqa_score ∈ [0, 1] for each row
cols = evaluator.run(
    storage=storage.step(),
    input_image_key="image_path",
    input_text_key="text",
    output_key="vqa_score"
)
print(cols)  # ["vqa_score"]
```

### 🧾 Default Output Format 
| Field name                                     | Type     | Default | Description |
| :--------------------------------------------- | :------- | :------ | :---------- |
| `image_path` (or the column given by `input_image_key`) | `string` | —      | Input image path. |
| `text` (or the column given by `input_text_key`)        | `string` | —      | Input textual description. |
| `vqa_score` (or `output_key`)                 | `float`  | —      | Yes-probability produced by BLIP VQA for the question “Does this image match the description?”, in the range `[0, 1]`. |



Example Input:
```jsonl
{
  "image_path": "1.png",
  "text": "The image shows a man and a woman in what appears to be a car."
}
```

Example Output:
```jsonl
{
  "image_path": "1.png",
  "text": "The image shows a man and a woman in what appears to be a car.",
  "vqa_score": 0.774
}
```