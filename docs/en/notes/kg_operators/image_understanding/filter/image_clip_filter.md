---
title: ImageClipFilter
createTime: 2025/10/15 15:48:32
# icon: material-symbols-light:image
permalink: /en/mm_operators/filter/image_clip_filter/
---
## 📘 Overview
`ImageClipFilter` is an image–text consistency operator built on a pretrained **CLIP** model.  
It computes the **semantic similarity** between an image and its accompanying textual description, and then filters image–text pairs according to a user-specified similarity threshold.  
Pairs whose similarity score falls below the threshold are discarded as semantically inconsistent.
 



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
| Parameter    | Type          | Default                           | Description |
| :----------- | :------------ | :-------------------------------- | :---------- |
| `model_name` | `str`         | `"openai/clip-vit-base-patch32"` | Local path or Hugging Face Model ID of the CLIP model. Internally loaded via `CLIPProcessor` / `CLIPModel` with `use_safetensors=True` and `weights_only=False`. |
| `device`     | `str \| None` | `None`                            | Inference device. If `None`, the operator automatically selects `"cuda"` when available; otherwise it falls back to `"cpu"`. |




## `run`
```python
def run(
    self,
    storage: DataFlowStorage,
    input_image_key: str = "image",
    input_caption_key: str = "caption",
    threshold: float = 0.25
):
    ...
```

Parameters
| Parameter            | Type              | Default      | Description |
| :------------------- | :---------------- | :----------- | :---------- |
| `storage`            | `DataFlowStorage` | —            | Dataflow storage object used for reading and writing the DataFrame. |
| `input_image_key`    | `str`             | `"image"`    | Column name containing image paths. |
| `input_caption_key`  | `str`             | `"caption"`  | Column name containing the textual description (caption). |
| `threshold`          | `float`           | `0.25`       | Minimum CLIP similarity threshold; only image–text pairs with similarity `≥ threshold` are retained. |




## 🧠 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import ImageClipFilter

# 1) Prepare FileStorage (must contain at least `image` and `caption` columns)
storage = FileStorage(
    first_entry_file_name="./dataflow/example/test_image_filter/test_image_filter.jsonl",
    cache_path="./cache_local",
    file_name_prefix="image_clip_filter",
    cache_type="jsonl"
)

# 2) Initialize the operator (model_name can be an HF model ID such as "openai/clip-vit-base-patch32")
filt = ImageClipFilter(
    model_name="openai/clip-vit-base-patch32",
    device=None  # automatically select cuda/cpu
)

# 3) Run filtering: keep only image–text pairs with CLIP similarity ≥ 0.25
cols = filt.run(
    storage=storage.step(),
    input_image_key="image",
    input_caption_key="caption",
    threshold=0.25
)
print(cols)  # ["image", "caption"]
```

### 🧾 Default Output Format
| Field     | Type    | Default | Description |
| :-------- | :------ | :------ | :---------- |
| `image`   | `string`| —       | Image path for retained samples. |
| `caption` | `string`| —       | Textual description of retained samples (for which CLIP similarity ≥ `threshold`). |

Example Input:
```jsonl
{
  "image": "1.png",
  "caption": "A bride and groom smiling in a car."
}
{
  "image": "2.jpg",
  "caption": "A red bus driving across a snowy mountain road at night."
}
```

Example Output:
```jsonl
{
  "image": "1.png",
  "caption": "A bride and groom smiling in a car."
}
```