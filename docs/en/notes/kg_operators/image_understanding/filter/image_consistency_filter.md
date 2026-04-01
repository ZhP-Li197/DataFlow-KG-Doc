---
title: ImageConsistencyFilter
createTime: 2025/10/15 15:48:32
# icon: material-symbols-light:image
permalink: /en/mm_operators/filter/image_consistency_filter/
---
## 📘 Overview
`ImageConsistencyFilter` is an **NLI-based (Natural Language Inference)** consistency filtering operator.  
It evaluates whether, for the same image, the triplet  
**(caption, question, answer)** is semantically coherent; that is, whether the **answer can be logically inferred from caption + question**.

Internally, the operator treats `caption + question` as the **premise** and `answer` as the **hypothesis**, and then uses the `bart-large-mnli` model to compute the **entailment probability**.  
If this probability falls below the threshold `threshold`, the sample is deemed semantically inconsistent and is filtered out.



## ```__init__```
```python
def __init__(
    self,
    model_name: str = "facebook/bart-large-mnli",
    threshold: float = 0.35,
    device: str = None
):
    ...
```


## `init` Parameters
| Parameter   | Type          | Default                      | Description |
| :---------- | :------------ | :--------------------------- | :---------- |
| `model_name` | `str`        | `"facebook/bart-large-mnli"` | Local path or Hugging Face Model ID for the NLI model. Internally loaded via `AutoTokenizer` / `AutoModelForSequenceClassification` with `local_files_only=True`, `use_safetensors=True`, and `weights_only=False`. |
| `threshold` | `float`       | `0.35`                       | Entailment probability threshold. If the entailment probability for **caption + question → answer** is below this value, the sample is treated as semantically inconsistent and discarded. Higher values result in stricter filtering. |
| `device`    | `str \| None` | `None`                       | Inference device. If `None`, the operator automatically selects `"cuda"` when available; otherwise it falls back to `"cpu"`. |



## `run`
```python
def run(
    self,
    storage: DataFlowStorage,
    input_caption_key: str = "caption",
    input_question_key: str = "question",
    input_answer_key: str = "answer",
):
    ...

```

Parameters
| Parameter            | Type              | Default      | Description |
| :------------------- | :---------------- | :----------- | :---------- |
| `storage`            | `DataFlowStorage` | —            | Dataflow storage object used for reading from and writing to the DataFrame. |
| `input_caption_key`  | `str`             | `"caption"`  | Column name of the caption text, typically the natural-language description of the image. |
| `input_question_key` | `str`             | `"question"` | Column name of the question text associated with the image. |
| `input_answer_key`   | `str`             | `"answer"`   | Column name of the answer text, representing the response to the question. |


## 🧠 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import ImageConsistencyFilter

# 1) Prepare FileStorage (must contain at least caption / question / answer)
storage = FileStorage(
    first_entry_file_name="./dataflow/example/test_image_filter/test_image_filter.jsonl",
    cache_path="./cache_local",
    file_name_prefix="image_consistency_filter",
    cache_type="jsonl"
)

# 2) Initialize the operator (can use a local or HF model)
filt = ImageConsistencyFilter(
    model_name="facebook/bart-large-mnli",  # or a local path "../ckpt/bart-large-mnli"
    threshold=0.35,                         # entailment probability threshold
    device=None                             # automatically select cuda/cpu
)

# 3) Run filtering
cols = filt.run(
    storage=storage.step(),
    input_caption_key="caption",
    input_question_key="question",
    input_answer_key="answer"
)
print(cols)  # ["caption", "question", "answer"]
```

### 🧾 Default Output Format (Output Format)
| Field name                                       | Type    | Default | Description |
| :----------------------------------------------- | :------ | :------ | :---------- |
| `caption` (or the column specified by `input_caption_key`)  | `string` | — | Caption text retained after filtering. |
| `question` (or the column specified by `input_question_key`) | `string` | — | Question text that, together with the caption, is deemed to entail the answer. |
| `answer` (or the column specified by `input_answer_key`)     | `string` | — | Answer text whose entailment probability from caption + question is `≥ threshold` under the NLI model. |


Example Input:
```jsonl
{
  "caption":  "A groom in a black tuxedo sits in a car next to his smiling bride.",
  "question": "Where are the couple sitting?",
  "answer":   "They are sitting inside a car."
}
{
  "caption":  "A groom in a black tuxedo sits in a car next to his smiling bride.",
  "question": "What color is the sky in this picture?",
  "answer":   "The sky is green with purple stripes."
}
```

Example Output:
```jsonl
{
  "caption":  "A groom in a black tuxedo sits in a car next to his smiling bride.",
  "question": "Where are the couple sitting?",
  "answer":   "They are sitting inside a car."
}
```