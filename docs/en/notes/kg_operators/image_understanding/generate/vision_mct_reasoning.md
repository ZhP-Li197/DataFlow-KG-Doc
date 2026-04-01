---
title: Multi-modal Reasoning Chain Generation from MCTS Trees (Grounded-RL)
createTime: 2025/10/15 17:59:19
icon: material-symbols-light:image
permalink: /en/mm_operators/generate/vision_mct_reasoning/
---

## 📘 Overview

`VisionMCTSReasoningSFTGenerate` is an operator designed to **construct coordinate-grounded reasoning chains** from either **MCTS search trees** or **direct vision-language model (VLM) prompting**.

It converts multi-branch reasoning paths into single `<think>…</think>` and `<answer>…</answer>` chains and outputs them as **SFT-ready JSON records** for supervised fine-tuning or RL pretraining.

Paper reference:

> 🌐 **Grounded Reinforcement Learning for Visual Reasoning**
> arXiv: [2505.23678](https://arxiv.org/abs/2505.23678)

---

## `__init__`

```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    prompt_type: str = "web_grounding",
    val_size: float = 0.05,
    log_to_wandb: bool = False,
    max_samples_per_file: int = 10000,
    draw_points: bool = True,
    seed: int = 42,
)
```

### `init` Parameters

| Parameter              | Type            | Default           | Description                                                                       |
| ---------------------- | --------------- | ----------------- | --------------------------------------------------------------------------------- |
| `llm_serving`          | `LLMServingABC` | —                 | Vision-Language model wrapper (e.g., `LocalModelVLMServing_vllm`).                |
| `prompt_type`          | `str`           | `"web_grounding"` | System prompt template: one of `web_grounding`, `spatial`, `web_action`, `vstar`. |
| `val_size`             | `float`         | `0.05`            | Fraction of data used for validation.                                             |
| `log_to_wandb`         | `bool`          | `False`           | Whether to log reasoning chains to Weights & Biases.                              |
| `max_samples_per_file` | `int`           | `10000`           | Max number of reasoning chains retained per sample.                               |
| `draw_points`          | `bool`          | `True`            | Whether to overlay (x, y) reasoning points on the image.                          |
| `seed`                 | `int`           | `42`              | Random seed for reproducibility.                                                  |

---

## `run`

```python
def run(
    self,
    storage: DataFlowStorage,
    input_question_key: str = "question",
    input_image_key: str = "image",
    input_tree_key: Optional[str] = "tree",
    input_true_answer_key: str = "true_answer",
    output_key: str = "sft_entry",
)
```

### Parameters

| Parameter         | Type              | Default         | Description                           |
| ----------------- | ----------------- | --------------- | ------------------------------------- |
| `storage`         | `DataFlowStorage` | —               | DataFlow storage interface.           |
| `input_question_key`    | `str`             | `"question"`    | Column for input question text.       |
| `input_image_key`       | `str`             | `"image"`       | Column for image file path.           |
| `input_tree_key`        | `Optional[str]`   | `"tree"`        | MCTS search tree field, if available. |
| `input_true_answer_key` | `str`             | `"true_answer"` | Ground-truth coordinate or answer.    |
| `output_key`      | `str`             | `"sft_entry"`   | Output column name for SFT entries.   |

---

## 🧠 Example Usage

```python
from dataflow.serving.local_model_vlm_serving import LocalModelVLMServing_vllm
from dataflow.operators.core_vision import VisionMCTSReasoningSFTGenerate

model = LocalModelVLMServing_vllm(
    hf_model_name_or_path="/data0/happykeyan/Models/Qwen2.5-VL-3B-Instruct"
)

op = VisionMCTSReasoningSFTGenerate(
    llm_serving=model,
    prompt_type="web_grounding",
    val_size=0.0,
    log_to_wandb=False,
    draw_points=True,
)

op.run(
    storage=storage,
    input_question_key="question",
    input_image_key="image",
    input_true_answer_key="true_answer",
    output_key="sft_entry",
)
```

---

### 🧾 Default Output Format

| Field       | Type         | Description                                      |
| :---------- | :----------- | :----------------------------------------------- |
| `id`        | `str`        | Unique identifier.                               |
| `metadata`  | `dict`       | Placeholder metadata.                            |
| `messages`  | `list[dict]` | Dialogue with system, user, and assistant turns. |
| `images`    | `list[str]`  | List of image paths.                             |
| `gt_answer` | `str`        | Ground truth answer (coordinate or text).        |

Example Input:

```jsonl
{"question": "Locate the pendant center in the image.", "image": "./image3.png", "true_answer": "[420, 560]"}
```

Example Output:

```json
{
  "id": "0_0",
  "metadata": {},
  "messages": [
    {"role": "system", "content": "<system prompt>"},
    {"role": "user", "content": "Locate the pendant center in the image."},
    {"role": "assistant", "content": "<think> ... (420,560) ... </think><answer> (420,560) </answer>"}
  ],
  "images": ["./image3.png"],
  "gt_answer": "[420, 560]"
}
```