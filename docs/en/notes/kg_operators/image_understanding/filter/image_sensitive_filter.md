---
title: ImageSensitiveFilter
createTime: 2025/10/15 15:31:35
# icon: material-symbols-light:image
permalink: /en/mm_operators/filter/image_sensitive_filter/
---
## 📘 Overview
`ImageSensitiveFilter` is a **multi-label safety filtering operator** built on top of the **BART Large MNLI** zero-shot natural language inference model.  
It evaluates multiple text fields associated with an image and automatically identifies and filters samples containing the following **high-risk content categories**:

- Sexual content (pornography, nudity, etc.)
- Violence or physical harm
- Suicide or self-harm
- Hate speech
- Harassment or insults
- Threats or intimidation

Unlike traditional keyword-based blacklists, this operator leverages NLI-style reasoning between **input text** and **natural-language risk descriptions** to decide whether sensitive content is present. This design is more **flexible and extensible**, and is particularly suitable for safety- and compliance-critical cleaning of multimodal datasets.



## ```__init__```
```python
def __init__(
    self,
    model_name: str = "facebook/bart-large-mnli",
    threshold: float = 0.5,
    device: str | None = None,
):
    ...
```


## `init` Parameters
| Parameter   | Type              | Default                      | Description |
| :---------- | :---------------- | :--------------------------- | :---------- |
| `model_name` | `str`            | `"facebook/bart-large-mnli"` | Local path or Hugging Face Model ID of the NLI model. Internally loaded via `AutoTokenizer` / `AutoModelForSequenceClassification` (`local_files_only=True`, `use_safetensors=True`, `weights_only=False`). |
| `threshold` | `float`           | `0.5`                        | **Entailment probability threshold** for risk categories. If the entailment probability for any risk label is `≥ threshold`, the corresponding text is deemed *unsafe*. Higher values lead to stricter filtering. |
| `device`    | `str \| None`     | `None`                       | Inference device. If `None`, the operator automatically selects `"cuda"` when available; otherwise it falls back to `"cpu"`. |


## `run`
```python
def run(
    self,
    storage: DataFlowStorage,
    input_image_key: str,
    input_text_keys: list
):
    ...
```

Parameters
| Parameter        | Type              | Default | Description |
| :--------------- | :---------------- | :------ | :---------- |
| `storage`        | `DataFlowStorage` | —       | Dataflow storage object used to read and write the underlying DataFrame. |
| `input_image_key` | `str`            | —       | Name of the column containing image paths (e.g., `"image"`). Used only to check path existence; no visual inference is performed. |
| `input_text_keys` | `list[str]`      | —       | List of text column names to be evaluated for safety (e.g., `["caption", "question", "answer"]`). Each of these fields is scored against all risk labels. |




## 🧠 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import ImageSensitiveFilter

# 1) Prepare FileStorage (must contain at least "image" and caption-like columns)
storage = FileStorage(
    first_entry_file_name="./dataflow/example/test_image_filter/test_image_filter.jsonl",
    cache_path="./cache_local",
    file_name_prefix="imgtext_sensitive_filter",
    cache_type="jsonl"
)

# 2) Initialize the operator (using either a local or HF model)
filt = ImageSensitiveFilter(
    model_name="facebook/bart-large-mnli",  # or a local checkpoint path
    threshold=0.5,                          # risk decision threshold
    device=None                             # automatically choose cuda/cpu
)

# 3) Run filtering: jointly check image path + multiple text fields for sensitive content
cols = filt.run(
    storage=storage.step(),
    input_image_key="image",
    input_text_keys=["caption", "question", "answer"]
)
print(cols)  # ["image", "caption", "question", "answer"]
```

### 🧾 Default Output Format

| Field                                       | Type    | Default | Description |
| :----------------------------------------- | :------ | :------ | :---------- |
| column specified by `input_image_key`      | `string`| —       | Original image-path column; after filtering, only rows that pass the safety check are retained. |
| columns specified by `input_text_keys`     | `string`| —       | Original text columns (caption / question / answer, etc.); after filtering, only rows whose texts are all judged safe are retained. |


Example Input:
```jsonl
{
  "image_path": "1.png",
  "text": "A bride and groom smiling in a car."
}
{
  "image_path": "2.jpg",
  "text": "Some abusive or hateful phrase here."
}
```

Example Output:
```jsonl
{
  "image_path": "1.png",
  "text": "A bride and groom smiling in a car."
}
```