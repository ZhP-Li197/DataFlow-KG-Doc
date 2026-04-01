---
title: 视频链式思考问答生成（VideoCOTQAGenerator）
createTime: 2025/12/20 10:30:00
permalink: /zh/mm_operators/video_understanding/generate/video_cotqa/
---

## 📘 概述

`VideoCOTQAGenerator` 是一个用于 **生成带有链式思考（Chain-of-Thought, CoT）推理过程的视频/图像问答数据** 的算子。  
它会根据输入的问题类型（选择题、数值题、OCR等）自动构建提示词，引导模型输出结构化的推理过程和答案，适用于多模态推理数据集构建、视频理解评测等场景。

---

## 🏗️ `__init__` 函数

```python
def __init__(
    self,
    vlm_serving: VLMServingABC,
    prompt_template: Optional[VideoCOTQAGeneratorPrompt | DiyVideoPrompt | str] = None,
):
    ...
```

## 🧾 `__init__` 参数说明

| 参数名              | 类型                                                               | 默认值    | 说明                                    |
| :--------------- | :--------------------------------------------------------------- | :----- | :------------------------------------ |
| `vlm_serving`    | `VLMServingABC`                                                  | -      | VLM模型服务对象，用于调用视觉语言模型生成CoT推理和答案       |
| `prompt_template` | `VideoCOTQAGeneratorPrompt` \| `DiyVideoPrompt` \| `str` \| `None` | `None` | Prompt模板，默认使用 `VideoCOTQAGeneratorPrompt` |

---

## ⚡ `run` 函数

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

`run` 是算子主逻辑，执行CoT问答生成任务：
读取问题和多模态数据 → 构建CoT提示词 → 调用VLM生成推理过程 → 提取思考链和答案 → 写入输出文件。

## 🧾 `run` 参数说明

| 参数名                       | 类型                | 默认值               | 说明                          |
| :------------------------ | :---------------- | :---------------- | :-------------------------- |
| `storage`                 | `DataFlowStorage` | -                 | Dataflow 数据存储对象             |
| `input_video_key`         | `str`             | `"video"`         | 输入数据中视频字段名                  |
| `input_image_key`         | `str`             | `"image"`         | 输入数据中图像字段名                  |
| `input_conversation_key`  | `str`             | `"conversation"`  | 输入数据中对话字段名                  |
| `output_answer_key`       | `str`             | `"answer"`        | 模型输出的最终答案字段名                |
| `output_process_key`      | `str`             | `"process"`       | 模型输出的思考过程字段名（包含 `<think>` 标签） |
| `output_full_response_key` | `str`             | `"full_response"` | 模型输出的完整响应字段名                |

---

## 🧠 示例用法

```python
from dataflow.operators.core_vision import VideoCOTQAGenerator
from dataflow.serving import LocalModelVLMServing_vllm
from dataflow.utils.storage import FileStorage

# Step 1: 启动本地模型服务
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

# Step 2: 准备输入数据
storage = FileStorage(
    first_entry_file_name="./cot_qa_data.json",
    cache_path="./cache",
    file_name_prefix="video_cotqa",
    cache_type="json",
)
storage.step()

# Step 3: 初始化并运行算子
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

## 🧾 输入格式要求（Input Format）

| 字段             | 类型           | 说明                                                       |
| :------------- | :----------- | :------------------------------------------------------- |
| `problem_type` | `str`        | 问题类型：`multiple choice`、`numerical`、`OCR`、`free-form`、`regression` |
| `problem`      | `str`        | 问题文本                                                     |
| `options`      | `List[str]`  | 选项列表（仅适用于选择题）                                            |
| `data_type`    | `str`        | 数据类型：`video` 或 `image`                                   |
| `video`        | `List[str]`  | 视频文件路径列表（当 `data_type` 为 `video` 时）                      |
| `image`        | `List[str]`  | 图像文件路径列表（当 `data_type` 为 `image` 时）                      |
| `solution`     | `str`        | 标准答案（包含 `<answer>` 标签）                                   |
| `conversation` | `List[Dict]` | 对话历史（可选，会被自动创建或更新）                                       |

---

### 📥 示例输入

```json
{
  "problem_type": "multiple choice",
  "problem": "视频中的人在做什么？",
  "options": ["A. 跑步", "B. 游泳", "C. 骑自行车", "D. 跳舞"],
  "data_type": "video",
  "video": ["./test/example_video.mp4"],
  "solution": "<answer>C</answer>",
  "conversation": [{"from": "human", "value": ""}]
}
```

### 📤 示例输出

```json
{
  "problem_type": "multiple choice",
  "problem": "视频中的人在做什么？",
  "options": ["A. 跑步", "B. 游泳", "C. 骑自行车", "D. 跳舞"],
  "data_type": "video",
  "video": ["./test/example_video.mp4"],
  "solution": "<answer>C</answer>",
  "conversation": [
    {
      "from": "human",
      "value": "视频中的人在做什么？Options:\nA. 跑步\nB. 游泳\nC. 骑自行车\nD. 跳舞\n"
    }
  ],
  "answer": "C",
  "process": "<think>首先观察视频中的主要活动。视频显示一个人骑着自行车在公园里。从动作和场景来看，这是典型的骑自行车活动。因此答案应该是C。</think>",
  "full_response": "<think>首先观察视频中的主要活动。视频显示一个人骑着自行车在公园里。从动作和场景来看，这是典型的骑自行车活动。因此答案应该是C。</think>\n<answer>C</answer>"
}
```

---

## 🎯 支持的问题类型

### 1. 选择题 (multiple choice)
- 自动格式化选项列表
- 提取单个字母或短文本答案

### 2. 数值题 (numerical)
- 适用于需要计算的问题
- 提取数值答案

### 3. OCR 问题
- 适用于文字识别任务
- 提取识别的文本

### 4. 自由形式 (free-form)
- 开放式问答
- 提取完整文本答案

### 5. 回归问题 (regression)
- 适用于连续值预测
- 提取数值或范围答案

---

## 🎨 自定义 Prompt

默认使用 `VideoCOTQAGeneratorPrompt` 类，其 prompt 格式为：

```
{Question}

Please think about this question as if you were a human pondering deeply. Engage in an internal dialogue using expressions such as 'let me think', 'wait', 'Hmm', 'oh, I see', 'let's break it down', etc, or other natural language thought expressions. It's encouraged to include self-reflection or verification in the reasoning process. Provide your detailed reasoning between the <think> and </think> tags, and then give your final answer between the <answer> and </answer> tags.
```

该 prompt 引导模型像人类一样深入思考，使用自然语言思维表达（如"让我想想"、"等等"、"嗯"、"哦，我明白了"等），并鼓励在推理过程中包含自我反思或验证

### 方式1：使用字符串

```python
cotqa_generator = VideoCOTQAGenerator(
    vlm_serving=vlm_serving,
    prompt_template="请分析问题并用<think>标签包裹推理过程，用<answer>标签包裹最终答案。问题：{Question}"
)
```

### 方式2：使用自定义Prompt类

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

## 🔗 相关链接

- **代码:** [VideoCOTQAGenerator](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_vision/generate/video_cotqa_generator.py)
- **相关算子:**
  - [VideoToCaptionGenerator](./video_caption.md) - 视频描述生成
  - [VideoCaptionToQAGenerator](./video_qa.md) - 视频问答生成
  - [GeneralTextAnswerEvaluator](../eval/general_text_answer_evaluator.md) - 答案评估

