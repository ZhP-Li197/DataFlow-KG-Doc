---
title: Video Chain-of-Thought QA Generation (VideoCOTQAGenerator)
createTime: 2025/12/20 10:30:00
permalink: /en/mm_operators/video_understanding/generate/video_cotqa/
---

## 📘 Overview

`VideoCOTQAGenerator` is an operator for **generating video/image question-answering data with Chain-of-Thought (CoT) reasoning** .  
It automatically constructs prompts based on input problem types (multiple choice, numerical, OCR, etc.) and guides the model to output structured reasoning processes and answers. Suitable for multimodal reasoning dataset construction, video understanding evaluation, and more.

---

## 🏗️ `__init__` Function

```python
def __init__(
    self,
    vlm_serving: VLMServingABC,
    prompt_template: Optional[VideoCOTQAGeneratorPrompt | DiyVideoPrompt | str] = None,
):
    ...
```

## 🧾 `__init__` Parameters

| Parameter         | Type                                                              | Default | Description                                         |
| :---------------- | :--------------------------------------------------------------- | :------ | :-------------------------------------------------- |
| `vlm_serving`     | `VLMServingABC`                                                  | -       | VLM model serving for generating CoT reasoning      |
| `prompt_template` | `VideoCOTQAGeneratorPrompt` \| `DiyVideoPrompt` \| `str` \| `None` | `None`  | Prompt template, defaults to `VideoCOTQAGeneratorPrompt` |

---

## ⚡ `run` Function

```python
def run(
    self,
    storage: DataFlowStorage,
    input_video_key: str = "video",
    input_image_key: str = "image",
    input_conversation_key: str = "conversation",
    output_answer_key: str = "answer",
    output_process_key: str = "process",
    output_full_response_key: str = "full_response",
):
    ...
```

`run` is the main logic for CoT QA generation:
Read questions and multimodal data → Build CoT prompts → Call VLM to generate reasoning → Extract thinking chain and answer → Write to output.

## 🧾 `run` Parameters

| Parameter                  | Type              | Default           | Description                                  |
| :------------------------- | :---------------- | :---------------- | :------------------------------------------- |
| `storage`                  | `DataFlowStorage` | -                 | DataFlow storage object                      |
| `input_video_key`          | `str`             | `"video"`         | Field name for videos in input               |
| `input_image_key`          | `str`             | `"image"`         | Field name for images in input               |
| `input_conversation_key`   | `str`             | `"conversation"`  | Field name for conversations in input        |
| `output_answer_key`        | `str`             | `"answer"`        | Field name for final answer output           |
| `output_process_key`       | `str`             | `"process"`       | Field name for thinking process (with `<think>` tags) |
| `output_full_response_key` | `str`             | `"full_response"` | Field name for full response output          |

---

## 🧠 Example Usage

```python
from dataflow.operators.core_vision import VideoCOTQAGenerator
from dataflow.serving import LocalModelVLMServing_vllm
from dataflow.utils.storage import FileStorage

# Step 1: Initialize VLM service
vlm_serving = LocalModelVLMServing_vllm(
    hf_model_name_or_path="Qwen/Qwen2.5-VL-7B-Instruct",
    hf_cache_dir="./model_cache",
    vllm_tensor_parallel_size=1,
    vllm_temperature=0.7,
    vllm_top_p=0.9,
    vllm_max_tokens=4096,
    vllm_max_model_len=51200,
    vllm_gpu_memory_utilization=0.9
)

# Step 2: Prepare input data
storage = FileStorage(
    first_entry_file_name="./cot_qa_data.json",
    cache_path="./cache",
    file_name_prefix="video_cotqa",
    cache_type="json",
)
storage.step()

# Step 3: Initialize and run operator
cotqa_generator = VideoCOTQAGenerator(
    vlm_serving=vlm_serving,
)
cotqa_generator.run(
    storage=storage,
    input_video_key="video",
    input_conversation_key="conversation",
    output_answer_key="answer",
    output_process_key="process",
    output_full_response_key="full_response"
)
```

---

## 🧾 Input Format Requirements

| Field          | Type         | Description                                                    |
| :------------- | :----------- | :------------------------------------------------------------- |
| `problem_type` | `str`        | Problem type: `multiple choice`, `numerical`, `OCR`, `free-form`, `regression` |
| `problem`      | `str`        | Problem text                                                   |
| `options`      | `List[str]`  | Option list (for multiple choice only)                         |
| `data_type`    | `str`        | Data type: `video` or `image`                                  |
| `video`        | `List[str]`  | Video file path list (when `data_type` is `video`)            |
| `image`        | `List[str]`  | Image file path list (when `data_type` is `image`)            |
| `solution`     | `str`        | Ground truth answer (with `<answer>` tags)                    |
| `conversation` | `List[Dict]` | Conversation history (optional, will be auto-created/updated)  |

---

### 📥 Example Input

```json
{
  "problem_type": "multiple choice",
  "problem": "What is the person doing in the video?",
  "options": ["A. Running", "B. Swimming", "C. Cycling", "D. Dancing"],
  "data_type": "video",
  "video": ["./test/example_video.mp4"],
  "solution": "<answer>C</answer>",
  "conversation": [{"from": "human", "value": ""}]
}
```

### 📤 Example Output

```json
{
  "problem_type": "multiple choice",
  "problem": "What is the person doing in the video?",
  "options": ["A. Running", "B. Swimming", "C. Cycling", "D. Dancing"],
  "data_type": "video",
  "video": ["./test/example_video.mp4"],
  "solution": "<answer>C</answer>",
  "conversation": [
    {
      "from": "human",
      "value": "What is the person doing in the video?Options:\nA. Running\nB. Swimming\nC. Cycling\nD. Dancing\n"
    }
  ],
  "answer": "C",
  "process": "<think>First, observe the main activity in the video. The video shows a person riding a bicycle in the park. From the actions and scene, this is a typical cycling activity. Therefore, the answer should be C.</think>",
  "full_response": "<think>First, observe the main activity in the video. The video shows a person riding a bicycle in the park. From the actions and scene, this is a typical cycling activity. Therefore, the answer should be C.</think>\n<answer>C</answer>"
}
```

---

## 🎯 Supported Problem Types

### 1. Multiple Choice
- Automatically formats option list
- Extracts single letter or short text answer

### 2. Numerical
- For calculation-based problems
- Extracts numerical answer

### 3. OCR
- For text recognition tasks
- Extracts recognized text

### 4. Free-form
- Open-ended questions
- Extracts complete text answer

### 5. Regression
- For continuous value prediction
- Extracts numerical or range answer

---

## 🎨 Custom Prompts

The default uses the `VideoCOTQAGeneratorPrompt` class with the following prompt format:

```
{Question}

Please think about this question as if you were a human pondering deeply. Engage in an internal dialogue using expressions such as 'let me think', 'wait', 'Hmm', 'oh, I see', 'let's break it down', etc, or other natural language thought expressions. It's encouraged to include self-reflection or verification in the reasoning process. Provide your detailed reasoning between the <think> and </think> tags, and then give your final answer between the <answer> and </answer> tags.
```

This prompt guides the model to think deeply like a human, using natural language thought expressions (such as "let me think", "wait", "Hmm", "oh, I see", etc.), and encourages including self-reflection or verification in the reasoning process

### Method 1: Using a String

```python
cotqa_generator = VideoCOTQAGenerator(
    vlm_serving=vlm_serving,
    prompt_template="Analyze the problem and wrap reasoning in <think> tags, final answer in <answer> tags. Question: {Question}"
)
```

### Method 2: Using a Custom Prompt Class

```python
from dataflow.prompts.video import DiyVideoPrompt

custom_prompt = DiyVideoPrompt(
    "Analyze the question step by step:\n{Question}\n\nFormat: <think>reasoning</think>\n<answer>final answer</answer>"
)

cotqa_generator = VideoCOTQAGenerator(
    vlm_serving=vlm_serving,
    prompt_template=custom_prompt
)
```

---

## 🔗 Related Links

- **Code:** [VideoCOTQAGenerator](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_vision/generate/video_cotqa_generator.py)
- **Related Operators:**
  - [VideoToCaptionGenerator](./video_caption.md) - Video Caption Generation
  - [VideoCaptionToQAGenerator](./video_qa.md) - Video QA Generation
  - [GeneralTextAnswerEvaluator](../eval/general_text_answer_evaluator.md) - Answer Evaluation

