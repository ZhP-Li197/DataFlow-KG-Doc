---
title: Image Grounded Chain-of-Thought Generation (GCoT)
createTime: 2025/10/22 18:00:00
icon: material-symbols-light:quiz
permalink: /en/mm_operators/generate/image_gcot/
---

## 📘 Overview

`ImageGCoTGenerate` is a **Grounded Chain-of-Thought (GCoT) generation operator** that automatically generates reasoning processes with visual grounding that can improve the interpretability and accuracy of multimodal reasoning tasks, suitable for visual question answering, image understanding, scene description, and more.

Background paper:

> 🌐 **Bootstrapping Grounded Chain-of-Thought in Multimodal LLMs for Data-Efficient Model Adaptation**
> arXiv: [2507.02859](https://arxiv.org/abs/2507.02859)

---

## 🏗️ `__init__` Function
```python
def __init__(
    self,
    llm_serving: Optional[LLMServingABC] = None,
    model_path: str = "AIDC-AI/Ovis2.5-9B",
    model_base: str = None,
    conv_mode: str = "vicuna_v1",
    temperature: float = 0.0,
    top_p: float = None,
    num_beams: int = 1,
    max_new_tokens: int = 512,
    device: str = "cuda"
):
    ...
```

## 🧾 `__init__` Parameters

| Parameter        | Type                      | Default                | Description                                              |
| :--------------- | :------------------------ | :--------------------- | :------------------------------------------------------- |
| `llm_serving`    | `Optional[LLMServingABC]` | `None`                 | Qwen model service for CoT generation and keyword extraction |
| `model_path`     | `str`                     | `"AIDC-AI/Ovis2.5-9B"` | Ovis2.5 model path for visual grounding                  |
| `model_base`     | `str`                     | `None`                 | Base model path (for LoRA)                               |
| `conv_mode`      | `str`                     | `"vicuna_v1"`          | Conversation mode                                        |
| `temperature`    | `float`                   | `0.0`                  | Sampling temperature (0 for greedy decoding)             |
| `top_p`          | `float`                   | `None`                 | Nucleus sampling parameter                               |
| `num_beams`      | `int`                     | `1`                    | Number of beams for beam search                          |
| `max_new_tokens` | `int`                     | `512`                  | Maximum number of tokens to generate                     |
| `device`         | `str`                     | `"cuda"`               | Device to run on                                         |

---

## ⚡ `run` Function
```python
def run(
    self,
    storage: DataFlowStorage,
    input_question_key: str = "question",
    input_answer_key: str = "answer",
    input_image_key: str = "image",
    output_key: str = "gcot",
    save_intermediate: bool = True,
    qwen_unload_callback = None
):
    ...
```

Executes the complete GCoT generation pipeline:
1. Use Qwen to generate Chain-of-Thought and extract keywords
2. Use Ovis to perform visual grounding for keywords
3. Inject grounding information into CoT to generate GCoT

## 🧾 `run` Parameters

| Parameter              | Type              | Default      | Description                                           |
| :--------------------- | :---------------- | :----------- | :---------------------------------------------------- |
| `storage`              | `DataFlowStorage` | -            | Dataflow storage object                               |
| `input_question_key`         | `str`             | `"question"` | Input question field name                             |
| `input_answer_key`           | `str`             | `"answer"`   | Input answer field name                               |
| `input_image_key`            | `str`             | `"image"`    | Input image field name                                |
| `output_key`           | `str`             | `"gcot"`     | Output GCoT field name                                |
| `save_intermediate`    | `bool`            | `True`       | Whether to save intermediate results and visualizations |
| `qwen_unload_callback` | `Callable`        | `None`       | Callback function to unload Qwen model (for memory management) |

---

## 🧠 Example Usage
```python
from dataflow.utils.storage import FileStorage
from dataflow.serving.local_model_vlm_serving import LocalModelVLMServing_vllm
from dataflow.operators.core_vision.generate import ImageGCoTGenerate

# Step 1: Initialize Qwen model service
qwen_serving = LocalModelVLMServing_vllm(
    hf_model_name_or_path="/models/Qwen2.5-VL-3B-Instruct",
    hf_cache_dir="/cache",
    vllm_tensor_parallel_size=1,
    vllm_temperature=0.7,
    vllm_top_p=0.9,
    vllm_max_tokens=512
)

# Step 2: Prepare input data
storage = FileStorage(
    first_entry_file_name="data/gqa_test.json",
    cache_path="./cache_gcot",
    file_name_prefix="gcot_result",
    cache_type="json"
)
storage.step()

# Step 3: Initialize and run the operator
gcot_generator = ImageGCoTGenerate(
    llm_serving=qwen_serving,
    model_path="AIDC-AI/Ovis2.5-9B",
    temperature=0.0,
    device="cuda"
)

# Define Qwen unload callback (optional, for memory management)
def unload_qwen():
    del qwen_serving
    import torch
    torch.cuda.empty_cache()

gcot_generator.run(
    storage=storage,
    input_question_key="question",
    input_answer_key="answer",
    input_image_key="image",
    output_key="gcot",
    save_intermediate=True,
    qwen_unload_callback=unload_qwen
)
```

---

## 🧾 Default Output Format

| Field      | Type              | Description                                                    |
| :--------- | :---------------- | :------------------------------------------------------------- |
| `question` | `str`             | Input question                                                 |
| `answer`   | `str`             | Input answer                                                   |
| `image`    | `str`             | Image path                                                     |
| `cot`      | `str`             | Original Chain-of-Thought (without grounding)                  |
| `keywords` | `List[str]`       | Keywords extracted by Qwen                                     |
| `bboxes`   | `Dict[str, List]` | Mapping from keywords to bounding boxes                        |
| `gcot`     | `str`             | Grounded Chain-of-Thought (keywords with spatial coordinates)  |

---

### 📥 Example Input
```json
{
  "question": "Is the cat on the table?",
  "answer": "yes",
  "image": "/images/2404565.jpg",
  "imageId": "2404565"
}
```

### 📤 Example Output
```json
{
  "question": "Is the cat on the table?",
  "answer": "yes",
  "image": "/images/2404565.jpg",
  "cot": "Step 1: Locate the cat in the image. The cat is visible on the right side.\nStep 2: Locate the table. The wooden table is in the center.\nStep 3: Check if cat is on the table. Yes, the cat is sitting on top of the table.\nAnswer: yes",
  "keywords": ["cat", "table"],
  "bboxes": {
    "cat": ["[0.650, 0.234, 0.823, 0.567]"],
    "table": ["[0.123, 0.456, 0.890, 0.912]"]
  },
  "gcot": "Step 1: Locate the cat [0.650, 0.234, 0.823, 0.567] in the image. The cat is visible on the right side.\nStep 2: Locate the table [0.123, 0.456, 0.890, 0.912]. The wooden table is in the center.\nStep 3: Check if cat is on the table. Yes, the cat is sitting on top of the table.\nAnswer: yes"
}
```

---