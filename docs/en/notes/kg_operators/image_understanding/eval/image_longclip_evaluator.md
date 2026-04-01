---
title: ImageLongCLIPEvaluator
createTime: 2025/10/15 14:30:52
# icon: material-symbols-light:image
permalink: /en/mm_operators/eval/image_longclip_evaluator/
---
## 📘 Overview

`ImageLongCLIPEvaluator` computes an **alignment score between images and long-form text** using **LongCLIP**, with scores in the range `[0, 1]`.  
Compared with standard CLIP, LongCLIP supports substantially longer textual context (in this implementation, the default is `context_length = 248`), which makes it suitable for paragraph-level description matching and alignment evaluation.

The internal pipeline is analogous to CLIP: it encodes the image and the text separately, applies L2 normalization to both embeddings, computes cosine similarity, and then maps the similarity to the interval `[0, 1]` via `(cos + 1) / 2`.




## ```__init__```
```python
def __init__(
    self,
    model_name: str = "BeichenZhang/LongCLIP-L-336px",
    device: str = None,
):
    ...
```


## `__init__` Parameters
| Parameter    | Type          | Default                          | Description |
| :----------- | :------------ | :------------------------------ | :---------- |
| `model_name` | `str`         | `"BeichenZhang/LongCLIP-L-336px"` | LongCLIP checkpoint spec. If it is a **directory path**, the operator will search for files ending with `.pt`, `.bin` or `.ckpt` and automatically pick one checkpoint to load; if it is a **file path**, that file is used directly as the checkpoint. |
| `device`     | `str \| None` | `None`                          | Inference device. Automatically selects `"cuda"` if available, otherwise falls back to `"cpu"`. |



## `run`
```python
def run(
    self,
    storage: DataFlowStorage,
    input_image_key: str = "image_path",
    input_text_key: str = "text",
    output_key: str = "longclip_score",
):
    ...
```

Parameters
| Parameter        | Type              | Default           | Description |
| :--------------- | :---------------- | :---------------- | :---------- |
| `storage`        | `DataFlowStorage` | —                 | Dataflow storage object used to read and write the DataFrame inside the operator. |
| `input_image_key`| `str`             | `"image_path"`    | Name of the input image column corresponding to file paths in the DataFrame. |
| `input_text_key` | `str`             | `"text"`          | Name of the input long-text column corresponding to paragraph-level descriptions in the DataFrame. |
| `output_key`     | `str`             | `"longclip_score"`| Name of the output score column (range `[0, 1]`) used to store LongCLIP image–text alignment scores. |




## 🧠 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import ImageLongCLIPEvaluator

# 1) Prepare FileStorage (must contain at least image_path and text columns)
storage = FileStorage(
    first_entry_file_name="./dataflow/example/test_image_eval/test_image_eval.jsonl",
    cache_path="./cache_local",
    file_name_prefix="longclip_eval",
    cache_type="jsonl"
)

# 2) Initialize the LongCLIP evaluator (model_name can be a directory or a specific checkpoint file)
evaluator = ImageLongCLIPEvaluator(
    model_name="BeichenZhang/LongCLIP-L-336px",
    device=None  # automatically selects cuda/cpu
)

# 3) Run evaluation: adds longclip_score ∈ [0, 1] for each row
cols = evaluator.run(
    storage=storage.step(),
    input_image_key="image_path",
    input_text_key="text",
    output_key="longclip_score"
)
print(cols)  # ["longclip_score"]
```

### 🧾 Default Output Format
| Field name                                   | Type     | Default | Description |
| :------------------------------------------- | :------- | :------ | :---------- |
| `image_path` (or the column given by `input_image_key`) | `string` | —      | Input image path. |
| `text` (or the column given by `input_text_key`)        | `string` | —      | Input long-text description. |
| `longclip_score` (or `output_key`)          | `float`  | —      | Long-text image–text alignment score in the range `[0, 1]`. |




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