---
title: ImageCLIPEvaluator
createTime: 2025/10/15 19:56:33
# icon: material-symbols-light:image
permalink: /en/mm_operators/eval/image_clip_evaluator/
---
## 📘 Overview
`ImageCLIPEvaluator` computes an **image–text alignment score** based on **CLIP**, with scores ranging in `[0, 1]`.  
Internally, it encodes the image and the text with CLIP → normalizes the embeddings → computes cosine similarity and linearly maps it to `[0, 1]` via `(cos + 1) / 2`.




## ```__init__```
```python
def __init__(
    self,
    model_name: str = "openai/clip-vit-base-patch32",
    device: str = None
):
    ...
```


## `init` Parameters
| Parameter    | Type          | Default                          | Description |
| :----------- | :------------ | :------------------------------- | :---------- |
| `model_name` | `str`         | `"openai/clip-vit-base-patch32"` | Local path or Hugging Face Model ID of the CLIP model; loaded via `CLIPProcessor` / `CLIPModel` (`use_safetensors=True`). |
| `device`     | `str \| None` | `None`                           | Inference device; when `None`, the operator automatically selects `"cuda"` if available, otherwise falls back to `"cpu"`. |


## `run`
```python
def run(
    self,
    storage: DataFlowStorage,
    input_image_key: str = "image_path",
    input_text_key: str = "text",
    output_key: str = "clip_score"
):
    ...
```

Parameters
| Parameter        | Type              | Default         | Description |
| :--------------- | :---------------- | :-------------- | :---------- |
| `storage`        | `DataFlowStorage` | —               | The Dataflow storage object used for reading and writing data. |
| `input_image_key`| `str`             | `"image_path"`  | Column name of the input image path. |
| `input_text_key` | `str`             | `"text"`        | Column name of the input text. |
| `output_key`     | `str`             | `"clip_score"`  | Column name for the output alignment score (range `[0, 1]`). |



## 🧠 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import ImageCLIPEvaluator

# 1) Prepare FileStorage (must contain at least image_path and text columns)
storage = FileStorage(
    first_entry_file_name="./dataflow/example/test_image_eval/test_image_eval.jsonl",
    cache_path="./cache_local",
    file_name_prefix="clip_eval",
    cache_type="jsonl"
)

# 2) Initialize the operator (can also use an HF model ID such as "openai/clip-vit-base-patch32")
evaluator = ImageCLIPEvaluator(
    model_name="openai/clip-vit-base-patch32",
    device=None  # automatically selects cuda/cpu
)

# 3) Run evaluation
cols = evaluator.run(
    storage=storage.step(),
    input_image_key="image_path",
    input_text_key="text",
    output_key="clip_score"
)
print(cols)  # ["clip_score"]
```

### 🧾 Default Output Format 
| Field name                                   | Type     | Default | Description |
| :------------------------------------------- | :------- | :------ | :---------- |
| `image_path` (or column given by `input_image_key`) | `string` | —      | Input image path. |
| `text` (or column given by `input_text_key`)        | `string` | —      | Input text. |
| `clip_score` (or `output_key`)                     | `float`  | —      | Image–text alignment score in the range `[0, 1]`. |



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
  "clip_score": 0.642
}
```