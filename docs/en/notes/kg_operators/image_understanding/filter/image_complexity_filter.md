---
title: ComplexityFilter
createTime: 2025/10/15 16:10:28
# icon: material-symbols-light:image
permalink: /en/mm_operators/filter/complexity_filter/
---
## 📘 Overview
`ComplexityFilter` is an **NLI-based (Natural Language Inference)** text filtering operator designed to evaluate whether a caption simultaneously covers multiple **visual capability dimensions** (e.g., color, shape, action recognition, counting, spatial relations).  
The operator thereby estimates the **capability richness** of a caption.

For each caption, the operator constructs a set of hypothesis sentences using a common template, e.g.  
`"The following text describes {}."`  
An MNLI-style model is then used to compute the **entailment probability** for each capability hypothesis.  
If the number of “hit” capabilities (those whose entailment probability exceeds a threshold `min_k`) meets or exceeds a user-specified threshold, the sample is retained; otherwise it is filtered out.



## ```__init__```
```python
def __init__(
    self,
    model_name: str = "facebook/bart-large-mnli",
    threshold: float = 0.4,
    min_k: int = 2,
    device: str = None
):
  ...
```


## `init` Parameters
| Parameter    | Type          | Default                     | Description |
| :----------- | :------------ | :-------------------------- | :---------- |
| `model_name` | `str`         | `"facebook/bart-large-mnli"` | Local path or Hugging Face Model ID of the NLI model. Internally loaded using `AutoTokenizer` / `AutoModelForSequenceClassification` with `local_files_only=True`, `use_safetensors=True`, and `weights_only=False`. |
| `threshold`  | `float`       | `0.4`                       | Minimum entailment probability required to mark a single capability as “hit”. Higher values yield stricter filtering. |
| `min_k`      | `int`         | `2`                         | Minimum number of capability dimensions that must be hit. Captions with fewer than `min_k` hits are discarded. |
| `device`     | `str \| None` | `None`                      | Inference device. If `None`, the operator automatically selects `"cuda"` when available; otherwise it falls back to `"cpu"`. |

## `run`
```python
def run(
    self,
    storage: DataFlowStorage,
    input_caption_key: str = "caption"
):
    ...
```

Parameters
| Parameter          | Type              | Default      | Description |
| :----------------- | :---------------- | :----------- | :---------- |
| `storage`          | `DataFlowStorage` | —            | Dataflow storage object used for reading and writing the DataFrame. |
| `input_caption_key`| `str`             | `"caption"`  | Name of the text column to be evaluated, usually the image description (caption) field. |


## 🧠 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import ComplexityFilter

# 1) Prepare FileStorage (must contain at least a `caption` column)
storage = FileStorage(
    first_entry_file_name="./dataflow/example/test_image_filter/test_image_filter.jsonl",
    cache_path="./cache_local",
    file_name_prefix="complexity_filter",
    cache_type="jsonl"
)

# 2) Initialize the operator (can use a local or HF model)
filt = ComplexityFilter(
    model_name="facebook/bart-large-mnli",  # or "../ckpt/bart-large-mnli"
    threshold=0.4,                          # entailment probability threshold
    min_k=2,                                # require at least 2 capability hits
    device=None                             # automatically select cuda/cpu
)

# 3) Run filtering
cols = filt.run(
    storage=storage.step(),
    input_caption_key="caption"
)
print(cols)  # ["caption"]
```

### 🧾 Default Output Format
| Field name                                      | Type    | Default | Description |
| :--------------------------------------------- | :------ | :------ | :---------- |
| `caption` (or the column specified by `input_caption_key`) | `string` | — | Caption text retained after filtering; only samples with a number of capability hits `≥ min_k` are kept. |


Example Input:
```jsonl
{
  "caption": "A red double-decker bus turns left at a city intersection while pedestrians wait at the crosswalk."
}
{
  "caption": "SALE SALE SALE 50% OFF"
}
{
  "caption": "Two kids count seashells on a sandy beach while their mother reads under a blue umbrella."
}

```

Example Output:
```jsonl
{
  "caption": "A red double-decker bus turns left at a city intersection while pedestrians wait at the crosswalk."
}
{
  "caption": "Two kids count seashells on a sandy beach while their mother reads under a blue umbrella."
}
```