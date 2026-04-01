---
title: ImageDeduplicateFilter
createTime: 2025/10/15 19:56:47
# icon: material-symbols-light:image
permalink: /en/mm_operators/filter/image_deduplication_filter/
---
## 📘 Overview
`ImageDeduplicateFilter` is an **image-level deduplication operator** built upon **CLIP-based image embeddings**.  
The operator encodes all images in a dataset into CLIP feature vectors and computes pairwise cosine similarities.  
For any pair of images whose similarity is **greater than or equal to `threshold`**, the operator **retains the first occurrence** and  
marks subsequent ones as near-duplicate samples to be removed.

In addition, for every retained image, the operator records its **maximum cosine similarity** with all other images in the column  
specified by `output_score_key` (by default, `max_similarity`). This value can be used for downstream quality control, auditing,  
or further manual examination of near-duplicate content.


## ```__init__```
```python
def __init__(
    self,
    model_name: str = "openai/clip-vit-base-patch32",
    threshold: float = 0.90,
    batch_size: int = 32,
    device: str = "cuda" if torch.cuda.is_available() else "cpu"
):
  ...
```

## `init` Parameters
| Parameter      | Type   | Default                                  | Description |
| :------------- | :----- | :---------------------------------------- | :---------- |
| `model_name`   | `str`  | `"openai/clip-vit-base-patch32"`         | Identifier or local path of the CLIP model used to extract image embeddings (Hugging Face Model ID or local checkpoint directory). |
| `threshold`    | `float`| `0.90`                                   | Deduplication similarity threshold. If the cosine similarity between two image embeddings is **greater than or equal to** this value, the later image in the sequence is treated as a near-duplicate and removed. |
| `batch_size`   | `int`  | `32`                                     | Batch size used during CLIP inference. Larger batch sizes improve throughput but increase GPU/CPU memory consumption. |
| `device`       | `str`  | `"cuda"` if available, otherwise `"cpu"` | Computational device used for CLIP inference. The operator automatically defaults to GPU when available; otherwise, it falls back to CPU execution. |

## `run`
```python
def run(
    self, 
    storage: DataFlowStorage,
    input_image_key: str = "image",
    output_score_key: str = "max_similarity"
) -> None:
    ...
```

Parameters
| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `storage` | `DataFlowStorage` | — | The Dataflow storage object used for reading and writing data. |
| `input_image_key` | `str` | `"image"` | The column name containing image paths or objects that can be parsed by `_load_image`. |
| `output_score_key` | `str` | `"max_similarity"` | The name of the column storing each image’s maximum similarity with all others. |


## 🧠 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import ImageDeduplicateFilter

# 1) Prepare FileStorage (must contain an "image" column)
storage = FileStorage(
    first_entry_file_name="data/dedup_input.jsonl",
    cache_path="./cache_local",
    file_name_prefix="image_dedup",
    cache_type="jsonl"
)

# 2) Initialize the operator
dedup = ImageDeduplicateFilter(
    model_name="openai/clip-vit-base-patch32",
    threshold=0.90,
    batch_size=32,
    device="cuda"  # or "cpu"
)

# 3) Execute deduplication
cols = dedup.run(
    storage=storage.step(),
    input_image_key="image",           # image column
    output_score_key="max_similarity"  # column to record max similarity
)
print(cols)  # ["image", "max_similarity"]
```

### 🧾 Default Output Format
| Field                                           | Type         | Description |
| :--------------------------------------------- | :----------- | :---------- |
| `image` (or the column specified by `input_image_key`) | `string/any` | The retained image entries after deduplication; near-duplicate images are removed according to the similarity threshold. |
| `max_similarity` (or the column specified by `output_score_key`) | `float`      | Maximum cosine similarity between this image and all other images in the dataset (for auditing and analysis; removed duplicates are not present in the final output). |


Example Input:
```jsonl
{
  "image": "a.jpg"
}
{
  "image": "b.jpg"
}
{
  "image": "a_copy.jpg"
}
```

Example Output:
```jsonl
{
  "image": "a.jpg",
  "max_similarity": 0.96
}
{
  "image": "b.jpg",
  "max_similarity": 0.12
}
```