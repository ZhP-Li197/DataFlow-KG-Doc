---
title: ImageAestheticFilter
createTime: 2025/10/15 15:45:04
# icon: material-symbols-light:image
permalink: /en/mm_operators/filter/image_aesthetic_filter/
---
## 📘 Overview
`ImageAestheticFilter` performs **basic quality and aesthetic filtering** over input images by jointly evaluating:

- Sharpness (degree of blur)
- Global brightness (overly dark / overly bright)
- Contrast (whether the image appears flat and washed-out)
- Proportions of near-black / near-white pixels (whether the image is almost entirely black or white)

The operator is intended to remove **low-quality images** that are blurry, strongly mis-exposed, or almost uniform in color, thereby providing cleaner inputs for subsequent detection, recognition, retrieval, or generation tasks.



## ```__init__```
```python
def __init__(
    self,
    blur_thresh: float = 150.0,
    brightness_range: tuple[float, float] = (30, 230),
    contrast_thresh: float = 40.0,
    max_black_ratio: float = 0.90,
    max_white_ratio: float = 0.90
):
  ...
```


## `init` Parameters
| Parameter          | Type                    | Default               | Description |
| :----------------- | :---------------------- | :-------------------- | :---------- |
| `blur_thresh`      | `float`                 | `150.0`               | Sharpness threshold based on the variance of the Laplacian. Higher values correspond to sharper images; images with values below this threshold are treated as blurry. |
| `brightness_range` | `tuple[float, float]`   | `(30, 230)`           | Admissible range of global brightness (mean grayscale intensity). Images with mean intensity below the lower bound are considered too dark; those above the upper bound are considered too bright. Only images whose mean lies within this interval are regarded as properly exposed. |
| `contrast_thresh`  | `float`                 | `40.0`                | Contrast threshold based on the standard deviation of the grayscale image. Values below this threshold indicate insufficient contrast (visually “flat” or washed-out images). |
| `max_black_ratio`  | `float`                 | `0.90`                | Maximum allowed proportion of **near-black pixels** (`gray < 10`). Images exceeding this ratio are treated as almost entirely black. |
| `max_white_ratio`  | `float`                 | `0.90`                | Maximum allowed proportion of **near-white pixels** (`gray > 245`). Images exceeding this ratio are treated as almost entirely white. |



## `run`
```python
def run(
    self,
    storage: DataFlowStorage,
    input_image_key: str = "image_path",
):
    ...
```

Parameters
| Parameter        | Type              | Default         | Description |
| :--------------- | :---------------- | :-------------- | :---------- |
| `storage`        | `DataFlowStorage` | —               | Dataflow storage object used to read and write the DataFrame. |
| `input_image_key`| `str`             | `"image_path"`  | Name of the column containing image paths. |



## 🧠 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import ImageAestheticFilter

# 1) Prepare FileStorage (must contain at least an image_path column)
storage = FileStorage(
    first_entry_file_name="./dataflow/example/test_image_filter/test_image_filter.jsonl",
    cache_path="./cache_local",
    file_name_prefix="aes_filter",
    cache_type="jsonl"
)

# 2) Initialize the aesthetic filter (thresholds can be tuned as needed)
aes_filter = ImageAestheticFilter(
    blur_thresh=150.0,
    brightness_range=(30, 230),
    contrast_thresh=40.0,
    max_black_ratio=0.90,
    max_white_ratio=0.90,
)

# 3) Run filtering: only images passing the quality checks are retained
cols = aes_filter.run(
    storage=storage.step(),
    input_image_key="image_path",
)
print(cols)  # ["image_path"]
```

### 🧾 Default Output Format
| Field name                                      | Type      | Default | Description |
| :---------------------------------------------- | :-------- | :------ | :---------- |
| `image_path` (or the column specified by `input_image_key`) | `string`  | —      | Input image path. |
| `quality`                                      | `boolean` | —      | Indicates whether the image passes the aesthetic/quality filter. Only rows with `quality == true` are preserved in the final output. |


Example Input:
```jsonl
{
  "image_path": "1.png"
}
{
  "image_path": "2.jpg"
}
```

Example Output:
```jsonl
{
  "image_path": "1.png",
  "quality": true
}
```