---
title: ImageDiversityFilter
createTime: 2025/10/15 19:57:00
# icon: material-symbols-light:image
permalink: /en/mm_operators/filter/image_diversity_filter/
---
## 📘 Overview
`ImageDiversityFilter` is a joint **text–image deduplication operator** designed to preserve **content diversity** when cleaning multimodal datasets.  
It relies on two complementary signals:

1. **Text side**: estimates similarity between the current caption and previously retained captions using **TF–IDF with cosine similarity**.  
2. **Image side**: measures visual redundancy using **perceptual hash (pHash) Hamming distance** over images.

A sample is retained **only if** it is sufficiently novel **both** in text and image space; otherwise, it is treated as a near-duplicate and filtered out.

This dual-view strategy avoids failure modes that occur when only one modality is considered (e.g., different images with nearly identical text, or vice versa), and helps construct **de-duplicated, semantically diverse** multimodal corpora.





## ```__init__```
```python
def __init__(
    self,
    text_thresh: float = 0.8,
    hash_size: int = 8,
    img_dist_thresh: int = 5
):
    ...
```


## `init` Parameters
| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `text_thresh` | `float` | `0.8` | Text uniqueness threshold. The maximum cosine similarity with the most recent corpus (managed by the internal `TextDuplicateFilter`) must be **< this value** to be considered unique. |
| `hash_size` | `int` | `8` | Hash size used for perceptual hashing (pHash). Larger values capture finer visual details but require more computation and memory (used by `ImageDuplicateFilter`). |
| `img_dist_thresh` | `int` | `5` | Image uniqueness threshold. The minimum Hamming distance with the most recent image hashes must be **> this value** to be considered unique. |


## `run`
```python
def run(
    self,
    storage: DataFlowStorage,
    input_image_key: str = "image_path",
    input_text_key: str = "text"
):
    ...
```

Parameters
| Parameter        | Type              | Default       | Description |
| :--------------- | :---------------- | :------------ | :---------- |
| `storage`        | `DataFlowStorage` | —             | Dataflow storage object containing the multimodal table to be de-duplicated. |
| `input_image_key`| `str`             | `"image_path"`| Name of the image column. Entries should be image paths (or other disk-resident locations that `PIL` can open). |
| `input_text_key` | `str`             | `"text"`      | Name of the text column, typically a caption or description field used for computing TF–IDF similarity. |


## 🧠 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import ImageDiversityFilter

# 1) Prepare FileStorage (must contain at least "image_path" and "text" columns)
storage = FileStorage(
    first_entry_file_name="./dataflow/example/test_image_filter/test_image_filter.jsonl",
    cache_path="./cache_local",
    file_name_prefix="image_diversity_filter",
    cache_type="jsonl"
)

# 2) Initialize the operator
filt = ImageDiversityFilter(
    text_thresh=0.8,   # text similarity threshold (higher → stricter)
    hash_size=8,       # perceptual hash size
    img_dist_thresh=5  # minimum Hamming distance threshold (higher → require larger visual difference)
)

# 3) Run filtering
cols = filt.run(
    storage=storage.step(),
    input_image_key="image_path",
    input_text_key="text"
)
print(cols)  # ["image_path", "text"]
```


### 🧾 Default Output Format

| Field                                          | Type     | Default | Description |
| :-------------------------------------------- | :------- | :------ | :---------- |
| `image_path` (or the column specified by `input_image_key`) | `string` | —       | Image paths retained after filtering; only rows whose text and image are both sufficiently dissimilar from historical samples are kept. |
| `text` (or the column specified by `input_text_key`)       | `string` | —       | Text descriptions paired with the retained images, guaranteed not to be overly similar to previously kept texts in TF–IDF space. |


Example Input:
```jsonl
{
  "image_path": "a.jpg",
  "text": "A cat sitting on a wooden chair."
}
{
  "image_path": "a_dup.jpg",
  "text": "A cat sits on a wooden chair."
}
{
  "image_path": "b.jpg",
  "text": "A bus driving through a snowy mountain pass at night."
}
```

Example Output:
```jsonl
{
  "image_path": "a.jpg",
  "text": "A cat sitting on a wooden chair."
}
{
  "image_path": "b.jpg",
  "text": "A bus driving through a snowy mountain pass at night."
}
```