---
title: High-information Density Caption Generation for Images (ScaleCap)
createTime: 2025/10/15 17:58:50
icon: material-symbols-light:image
permalink: /en/mm_operators/generate/image_scale_caption/
---


## 📘 Overview

`ImageScaleCaptionGenerate` is an operator for generating **dense, high-information captions** for images in the ScaleCap style.
It processes each image into a detailed caption following the pipeline:

* Initial caption generation
* Sentence-level self-check (goldens)
* Object and position-related follow-up questions
* Optional second-stage filtering on answers
* Final caption integration.

Background paper:

> 🌐 **ScaleCap: Inference-Time Scalable Image Captioning via Dual-Modality Debiasing**
> arXiv: [2506.19848](https://arxiv.org/abs/2506.19848)

---

## `__init__`

```python
def __init__(
    self, 
    vlm_serving: VLMServingABC, 
    config: Optional[ImageScaleCaptionGenerateConfig] = None
)
```

### `init` Parameters

| Parameter     | Type                                        | Default | Description                                                                              |
| ------------- | ------------------------------------------- | ------- | ---------------------------------------------------------------------------------------- |
| `vlm_serving` | `VLMServingABC`                             | —       | The serving model for visual language processing.                                        |
| `config`      | `Optional[ImageScaleCaptionGenerateConfig]` | —       | Configuration object containing parameters like `max_questions` and `max_answer_tokens`. |

---

## `get_desc`

```python
@staticmethod
def get_desc(lang: str = "zh") -> str
```

Returns the operator description in either Chinese or English.

### `get_desc` Parameters

| Parameter | Type  | Default | Description                                                |
| --------- | ----- | ------- | ---------------------------------------------------------- |
| `lang`    | `str` | `"zh"`  | Language, either `"zh"` for Chinese or `"en"` for English. |

---

## `run`

```python
def run(
    self, 
    storage: DataFlowStorage,
    input_image_key: str = "image", 
    output_key: str = "scalecap_record"
)
```

### Parameters

| Parameter    | Type              | Default             | Description                                               |
| ------------ | ----------------- | ------------------- | --------------------------------------------------------- |
| `storage`    | `DataFlowStorage` | —                   | DataFlow storage interface for reading and writing data.  |
| `input_image_key`  | `str`             | `"image"`           | The column name for image paths in the input.             |
| `output_key` | `str`             | `"scalecap_record"` | The column name where the generated captions are written. |

---

## 🧠 Example Usage

```python
from dataflow.serving.local_model_vlm_serving import LocalModelVLMServing_vllm
from dataflow.operators.core_vision import ImageScaleCaptionGenerate, ImageScaleCaptionGenerateConfig

# Load the model
model = LocalModelVLMServing_vllm(
    hf_model_name_or_path="/data0/happykeyan/Models/Qwen2.5-VL-3B-Instruct"
)

# Configure the operator
cfg = ImageScaleCaptionGenerateConfig(
    tau_sentence=0.15,
    max_questions=20,
    max_init_tokens=1024,
    max_answer_tokens=256,
    second_filter=False
)

# Instantiate the operator
operator = ImageScaleCaptionGenerate(vlm_serving=model, config=cfg)

# Run the operator
operator.run(
    storage=storage,
    input_image_key="image",
    output_key="scalecap_record"
)
```

---

### 🧾 Default Output Format

| Field                 | Type        | Description                                                    |
| :-------------------- | :---------- | :------------------------------------------------------------- |
| `image`               | `str`       | Path to the input image.                                       |
| `init_caption`        | `str`       | The generated initial caption.                                 |
| `golden_sentences`    | `list[str]` | The selected golden sentences after sentence-level self-check. |
| `object_questions`    | `list[str]` | The generated questions about objects in the image.            |
| `position_questions`  | `list[str]` | The generated questions about the positions of objects.        |
| `qa_answers_filtered` | `list[str]` | The filtered answers after second-stage filtering.             |
| `final_caption`       | `str`       | The final integrated long caption.                             |

Example Input:

```jsonl
{"image": "/path/to/image.jpg"}
```

Example Output:

```jsonl
{
  "image": "/path/to/image.jpg",
  "scalecap_record": {
    "init_caption": "A man in a suit jumping above a bed in a bedroom.",
    "golden_sentences": [
        "A man is jumping above a bed.",
        "The room is a bedroom."
    ],
    "object_questions": [
        "Describe more details about the man.",
        "Describe more details about the suit."
    ],
    "position_questions": [
        "Describe more details about the position of the man.",
        "Describe more details about the position of the bed."
    ],
    "qa_answers_filtered": [
        "The man is wearing a black suit.",
        "The bed is located in the middle of the room."
    ],
    "final_caption": "A man in a black suit is jumping above a bed in a spacious bedroom."
  }
}
```