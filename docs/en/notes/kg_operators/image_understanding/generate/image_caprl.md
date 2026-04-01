---
title: Image MCQ Synthesis with Dual With/Without-Image Filtering (CapRLMCQGenerate)
createTime: 2025/10/28 15:00:00
icon: material-symbols-light:image
permalink: /en/mm_operators/generate/image_caprl/
---

## 📘 Overview

`CapRLMCQGenerate` builds **five MCQs per image** and performs **dual filtering** to guarantee **visual dependency**:

* Generate MCQs via a VLM, following a strict Markdown-like template.
* For each MCQ, perform `rotate_num` **option shuffles** to robustly estimate accuracy.
* **Visual condition**: query with the image (optionally appending `E) None of the above`), require a **single letter** answer.
* **Text-only condition**: query **without** the image; again require a letter only.
* **Keep** an MCQ iff `visual_acc ≥ pass_visual_min` and `text_acc ≤ pass_textual_max`.

Kept items are placed in `kept_qas` with full audit trails in `filter_stats`, ready for **verifiable-reward RL**.

Background paper:

> 🌐 **CapRL: Stimulating Dense Image Caption Capabilities via Reinforcement Learning**
> arXiv: [2509.22647](https://arxiv.org/abs/2509.22647)

---

## `__init__`

```python
@OPERATOR_REGISTRY.register()
class CapRLMCQGenerate(OperatorABC):
    def __init__(self, vlm_serving: VLMServingABC, config: Optional[CapRLMCQConfig] = None):
        ...
```

### Parameters

| Parameter   | Type             | Default  | Description                                                                    |
| ----------- | ---------------- | -------- | ------------------------------------------------------------------------------ |
| vlm_serving | `VLMServingABC`  | required | Must support `generate_from_input_messages` (+ `image_list`, `system_prompt`). |
| config      | `CapRLMCQConfig` | `None`   | Operator config (see below).                                                   |

#### `CapRLMCQConfig` fields

(identical to the Chinese table; copied here for clarity)

| Field                     | Type  | Default | Description                                                                          |
| ------------------------- | ----- | ------: | ------------------------------------------------------------------------------------ |
| expected_mcq_num          | int   |       5 | Max MCQs to keep from parsing.                                                       |
| max_mcq_tokens            | int   |    2048 | Token budget expectation when generating MCQs (actual budget controlled by serving). |
| rotate_num                | int   |       4 | Shuffles per MCQ for robust accuracy estimation.                                     |
| add_none_above_for_visual | bool  |    True | Append `E) None of the above` under the visual condition if not present.             |
| pass_visual_min           | float |     1.0 | Minimum with-image accuracy threshold (1.0 = all shuffles correct).                  |
| pass_textual_max          | float |     0.0 | Maximum text-only accuracy threshold (0.0 = all shuffles wrong).                     |
| input_jsonl_path          | str?  |    None | Input path when not using DataFrame mode.                                            |
| output_jsonl_path         | str?  |    None | Output path in non-DF mode (defaults to `*.caprl_mcq.jsonl`).                        |
| dedup_questions           | bool  |    True | Deduplicate by `(question, answer)`.                                                 |

---

## `run`

```python
def run(
    self,
    storage: DataFlowStorage,
    input_image_key: str = "image",
    output_key: str = "cap_rl_qa",
):
    ...
```

### Behavior

Reads images, generates MCQs, parses, rotates, validates under both conditions, filters, and writes the **full JSON object** back to `output_key` (DataFrame) or to JSONL on disk.

### Parameters

| Parameter  | Type              | Default       | Description                                |
| ---------- | ----------------- | ------------- | ------------------------------------------ |
| storage    | `DataFlowStorage` | required      | IO and caching.                            |
| input_image_key  | str               | `"image"`     | Input field (image path).                  |
| output_key | str               | `"cap_rl_qa"` | Output field to store the full stats JSON. |

---

## 🧠 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.serving.local_model_vlm_serving import LocalModelVLMServing_vllm
from dataflow.operators.core_vision import CapRLMCQGenerate
from your_configs import CapRLMCQConfig

storage = FileStorage("./images.jsonl", "./cache_local", "caprl_mcq", "jsonl")

serving = LocalModelVLMServing_vllm(
    hf_model_name_or_path="/data0/Models/Qwen2.5-VL-3B-Instruct",
    vllm_tensor_parallel_size=1,
    vllm_temperature=0.1,
    vllm_top_p=0.9,
    vllm_max_tokens=512,
)

cfg = CapRLMCQConfig(
    rotate_num=4,
    pass_visual_min=1.0,
    pass_textual_max=0.0,
    add_none_above_for_visual=True,
    dedup_questions=True,
)

op = CapRLMCQGenerate(serving, cfg)
op.run(storage=storage.step(), input_image_key="image", output_key="cap_rl_qa")
```

---

## 🧾 Default Output Format

Same as the Chinese section (the JSON object under `cap_rl_qa`), including:

* `raw_mcq_text`, `parsed_qa_list`, `filter_stats` (with `trials` details), `kept_qas`, `num_kept`, `num_all`, and `config`.

**Example input (jsonl)**

```jsonl
{"image": "./dataflow/example/image_to_text_pipeline/capsbench_images/2.png"}
```

**Example output (excerpt)**

```jsonl
{
  "image": "./dataflow/example/image_to_text_pipeline/capsbench_images/2.png",
  "cap_rl_qa": {
    "image": "./dataflow/example/image_to_text_pipeline/capsbench_images/2.png",
    "raw_mcq_text": "#### 1. **What is the main theme of the playlist?** ...",
    "parsed_qa_list": [
      {
        "question": "What is the main theme of the playlist?\n   - A) Relaxation\n   - B) Fitness\n   - C) Romance\n   - D) Jazz",
        "options": {"A":"Relaxation","B":"Fitness","C":"Romance","D":"Jazz"},
        "answer": "B",
        "answer_text": "Fitness"
      },
      ...
    ],
    "filter_stats": [
      {
        "qa": {...},
        "trials": [
          {"rotated_answer":"A","visual_output":"A","visual_pred":"A","visual_correct":true,"text_output":"D","text_pred":"D","text_correct":false},
          ...
        ],
        "visual_acc": 1.0,
        "text_acc": 0.0,
        "keep": true
      },
      ...
    ],
    "kept_qas": [
      { "question": "... main theme ...", "answer": "B", ... },
      { "question": "... woman holding ...", "answer": "B", ... }
    ],
    "num_kept": 2,
    "num_all": 5,
    "config": {
      "rotate_num": 4,
      "pass_visual_min": 1.0,
      "pass_textual_max": 0.0,
      "add_none_above_for_visual": true
    }
  }
}

```