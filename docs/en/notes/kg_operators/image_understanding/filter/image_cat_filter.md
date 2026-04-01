---
title: ImageCatFilter
createTime: 2025/10/15 15:00:00
# icon: material-symbols-light:image
permalink: /en/mm_operators/filter/image_cat_filter/
---
## 📘 Overview
`ImageCatFilter` is a caption-quality filtering operator inspired by the **Caption-as-Teacher** paradigm. It combines a **BART-large-MNLI natural language inference (NLI) model** with optional **Tesseract OCR**, and applies a three-stage criterion—**semantic complexity**, **action description**, and **OCR-style transcription**—to image–text pairs. The operator is designed to retain only captions that are semantically rich and genuinely describe the visual content of the corresponding image.


## ```__init__```
```python
def __init__(
    self,
    model_name: str = "facebook/bart-large-mnli",
    complexity_thresh: float = 0.4,
    min_caps: int = 2,
    action_thresh: float = 0.4,
    ocr_overlap_threshold: float = 0.2,
    ocr_nli_thresh: float = 0.6,
    device: str | None = None,
):
  ...
```


## `init` Parameters
| Parameter              | Type              | Default                       | Description |
| :--------------------- | :---------------- | :---------------------------- | :---------- |
| `model_name`           | `str`             | `"facebook/bart-large-mnli"`  | Name or local path of the pretrained NLI model. Loaded via `AutoTokenizer` and `AutoModelForSequenceClassification`. |
| `complexity_thresh`    | `float`           | `0.4`                         | Entailment probability threshold used when matching the caption against a set of “capability hypotheses”. Entailment scores above this threshold indicate that the corresponding capability is covered by the caption. |
| `min_caps`             | `int`             | `2`                           | Minimum number of capability hypotheses that must be supported by the caption (e.g., actions, interactions, scene details) for it to be considered sufficiently complex. |
| `action_thresh`        | `float`           | `0.4`                         | Entailment probability threshold for the `ACTION_HYPOTHESIS` (“The caption clearly describes an action happening in the scene.”). Captions below this threshold are considered to lack adequate action description. |
| `ocr_overlap_threshold`| `float`           | `0.2`                         | Jaccard-overlap threshold between OCR tokens and caption tokens. Only when this overlap is high will the operator further check via NLI whether the caption is primarily an OCR transcription. |
| `ocr_nli_thresh`       | `float`           | `0.6`                         | Entailment probability threshold for `OCR_ONLY_HYPOTHESIS` (“The caption mainly transcribes the visible text in the image instead of describing the visual scene.”). Samples with high overlap and entailment above this threshold are treated as OCR transcriptions and removed. |
| `device`               | `str \| None`     | `None`                        | Inference device. If `None`, the operator automatically selects `"cuda"` when available; otherwise it falls back to `"cpu"`. |


## `run`
```python
def run(
    self,
    storage: DataFlowStorage,
    input_image_key: str = "image",
    input_caption_key: str = "caption",
):
    ...
```

Parameters
| Parameter            | Type              | Default       | Description |
| :------------------- | :---------------- | :------------ | :---------- |
| `storage`            | `DataFlowStorage` | —             | Dataflow storage object used to read and write the DataFrame. |
| `input_image_key`    | `str`             | `"image"`     | Name of the column containing image paths. |
| `input_caption_key`  | `str`             | `"caption"`   | Name of the column containing the English image descriptions. |



## 🧠 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import ImageCatFilter

# 1) Prepare FileStorage (must contain at least `image` and `caption` columns)
storage = FileStorage(
    first_entry_file_name="./dataflow/example/test_image_filter/test_image_filter.jsonl",
    cache_path="./cache_local",
    file_name_prefix="cat_filter",
    cache_type="jsonl"
)

# 2) Initialize the CatFilter operator (complexity and OCR-related thresholds can be tuned)
cat_filter = ImageCatFilter(
    model_name="facebook/bart-large-mnli",
    complexity_thresh=0.4,
    min_caps=2,
    action_thresh=0.4,
    ocr_overlap_threshold=0.2,
    ocr_nli_thresh=0.6,
    device=None  # automatically selects cuda/cpu
)

# 3) Run filtering: retain only captions that are semantically complex, action-descriptive,
#    and not mere OCR transcriptions
cols = cat_filter.run(
    storage=storage.step(),
    input_image_key="image",
    input_caption_key="caption",
)
print(cols)  # ["image", "caption"]
```

### 🧾 Default Output Format 
| Field name                                  | Type     | Default | Description |
| :------------------------------------------ | :------- | :------ | :---------- |
| `image` (or the column specified by `input_image_key`)    | `string` | —      | Input image path. |
| `caption` (or the column specified by `input_caption_key`)| `string` | —      | Input English image description. |


Example Input:
```jsonl
{
  "image_path": "1.png",
  "caption": "A bride smiles while the groom points ahead inside a car, their hands resting together on the seat."
}
{
  "image_path": "2.jpg",
  "caption": "SALE SALE SALE 50% OFF"
}

```

Example Output:
```jsonl
{
  "image_path": "1.png",
  "caption": "A bride smiles while the groom points ahead inside a car, their hands resting together on the seat."
}
```