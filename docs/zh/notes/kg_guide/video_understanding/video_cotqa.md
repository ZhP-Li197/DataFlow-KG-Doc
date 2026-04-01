---
title: 视频思维链问答流水线
createTime: 2025/07/16 16:30:00
permalink: /zh/mm_guide/video_cotqa_pipeline/
icon: mdi:thought-bubble
---

# 视频思维链问答流水线

## 1. 概述

**视频思维链问答流水线**（Video Chain-of-Thought QA Pipeline）通过让模型逐步推理来生成高质量的视频问答数据，并对生成的答案进行评估和过滤，适用于需要复杂推理的视频理解任务、高质量问答数据集构建和模型训练数据筛选。

我们支持以下应用场景：

- 视频推理问答数据集构建
- 复杂视频理解任务评测
- 高质量训练数据筛选
- 思维链推理能力训练

流水线的主要流程包括：

1. **CoT 问答生成**：利用 VLM 模型进行思维链推理，生成包含推理过程的答案。
2. **答案评估**：评估生成答案的质量，计算奖励分数。
3. **质量过滤**：基于奖励分数过滤低质量样本，保留高质量数据。

---

## 2. 快速开始

### 第一步：创建新的 DataFlow 工作文件夹
```bash
mkdir run_dataflow_mm
cd run_dataflow_mm
```

### 第二步：初始化 DataFlow-MM
```bash
dataflow init
```
这时你会看到：
```bash
run_dataflow_mm/pipelines/gpu_pipelines/video_cotqa_pipeline.py  
```

### 第三步：配置模型路径和过滤阈值

在 `video_cotqa_pipeline.py` 中配置 VLM 模型路径和评分阈值：

```python
# VLM 模型配置
self.vlm_serving = LocalModelVLMServing_vllm(
    hf_model_name_or_path="Qwen/Qwen2.5-VL-7B-Instruct",  # 修改为你的模型路径
    hf_cache_dir="./dataflow_cache",
    vllm_tensor_parallel_size=1,
    vllm_temperature=1.0,
    vllm_top_p=0.95,
    vllm_max_tokens=2048,
    vllm_max_model_len=51200,
    vllm_gpu_memory_utilization=0.9,
)

# 评分过滤器配置
self.score_filter = ScoreFilter(
    min_score=0.6,  # 最低奖励分数阈值
)
```

### 第四步：一键运行
```bash
python pipelines/gpu_pipelines/video_cotqa_pipeline.py
```

此外，你可以根据自己的需求调整评分阈值和评估策略。接下来，我们会详细介绍流水线中的各个步骤和参数配置。

---

## 3. 数据流与流水线逻辑

### 1. **输入数据**

该流程的输入数据包括以下字段：

* **video**：视频文件路径列表，如 `["path/to/video.mp4"]`
* **image**（可选）：图像文件路径列表
* **problem_type**：问题类型（如 "multiple choice", "free-form", "numerical" 等）
* **problem**：问题内容
* **options**：选项列表（多选题时使用，其他类型可为空列表）
* **data_type**：数据类型（"video" 或 "image"）
* **solution**：标准答案（格式为 `<answer>...</answer>`）

这些输入数据可以存储在指定的文件中（如 `json` 或 `jsonl`），并通过 `FileStorage` 对象进行管理和读取：

```python
self.storage = FileStorage(
    first_entry_file_name="./dataflow/example/video_cot_qa/sample_data.json",
    cache_path="./cache",
    file_name_prefix="video_cotqa_test",
    cache_type="json",
)
```

**输入数据示例**：

```json
[
    {
        "video": ["./dataflow/example/video_cot_qa/ytb_7nRmsEw7nsE.mp4"],
        "problem_type": "multiple choice",
        "problem": "What appears on the screen in Russian during the missile's ascent?",
        "options": [
            "A. A YouTube subscription notification",
            "B. A military command",
            "C. A warning message",
            "D. A weather update"
        ],
        "data_type": "video",
        "solution": "<answer>A</answer>"
    },
    {
        "video": ["./dataflow/example/video_cot_qa/split_8.mp4"],
        "problem_type": "free-form",
        "problem": "What cooking action does the person perform with the black frying pan on the right burner?",
        "options": [],
        "data_type": "video",
        "solution": "<answer>The person cracks an egg into the black frying pan on the right burner.</answer>"
    }
]
```

### 2. **CoT 问答生成（VideoCOTQAGenerator）**

流程的第一步是使用**思维链问答生成器**（`VideoCOTQAGenerator`）生成包含推理过程的答案。

**功能：**

* 利用 VLM 模型对视频内容进行分析和推理
* 生成包含思维链（推理步骤）的详细答案
* 输出完整的推理过程和最终答案

**输入**：视频、图像（可选）、问题  
**输出**：推理过程、最终答案、完整响应

**算子初始化**：

```python
self.video_cotqa_generator = VideoCOTQAGenerator(
    vlm_serving=self.vlm_serving,
)
```

**算子运行**：

```python
self.video_cotqa_generator.run(
    storage=self.storage.step(),
    input_video_key="video",                    # 输入视频字段
    input_image_key="image",                    # 输入图像字段（可选）
    input_conversation_key="conversation",       # 输入对话字段
    output_answer_key="answer",                 # 输出答案字段
    output_process_key="process",               # 输出推理过程字段
    output_full_response_key="full_response",   # 输出完整响应字段
)
```

### 3. **答案评估（GeneralTextAnswerEvaluator）**

流程的第二步是使用**答案评估器**（`GeneralTextAnswerEvaluator`）评估生成答案的质量并计算奖励分数。

**功能：**

* 将生成的答案与标准答案进行比较
* 计算相似度和正确性分数
* 生成奖励值用于后续过滤

**输入**：生成的完整响应、标准答案、问题类型  
**输出**：奖励分数（reward）

**算子初始化**：

```python
self.evaluator = GeneralTextAnswerEvaluator(
    use_stemmer=True,  # 使用词干提取器进行文本匹配
)
```

**参数说明**：
- `use_stemmer=True`: 启用词干提取，提高文本匹配的鲁棒性

**算子运行**：

```python
self.evaluator.run(
    storage=self.storage.step(),
    input_model_output_key="full_response",     # 输入模型输出字段
    input_gt_solution_key="solution",           # 输入标准答案字段
    input_question_type_key="problem_type",     # 输入问题类型字段
    output_reward_key="reward",                 # 输出奖励分数字段
)
```

### 4. **质量过滤（ScoreFilter）**

流程的第三步是使用**分数过滤器**（`ScoreFilter`）基于奖励分数过滤低质量样本。

**功能：**

* 根据设定的阈值过滤低质量样本
* 标记通过过滤的高质量数据
* 便于后续数据筛选和使用

**输入**：奖励分数  
**输出**：选择标记（select，布尔值）

**算子初始化**：

```python
self.score_filter = ScoreFilter(
    min_score=0.6,  # 最低奖励分数阈值（0-1之间）
)
```

**参数说明**：
- `min_score`: 最低奖励分数阈值，低于此分数的样本将被过滤

**算子运行**：

```python
self.score_filter.run(
    storage=self.storage.step(),
    input_score_key="reward",      # 输入分数字段
    output_select_key="select",    # 输出选择标记字段
)
```

### 5. **输出数据**

最终，流水线生成的输出数据将包含以下内容：

* **video**：原始视频路径
* **problem**：输入的问题
* **problem_type**：问题类型（输入）
* **options**：选项列表（输入）
* **data_type**：数据类型（输入）
* **solution**：标准答案（输入）
* **answer**：生成的最终答案
* **process**：推理过程（思维链）
* **full_response**：完整的模型响应
* **reward**：评估的奖励分数
* **select**：是否通过质量过滤（布尔值）

**输出数据示例**：

```json
{
    "video": ["./dataflow/example/video_cot_qa/split_8.mp4"],
    "problem_type": "free-form",
    "problem": "What cooking action does the person perform with the black frying pan on the right burner?",
    "options": [],
    "data_type": "video",
    "solution": "<answer>The person cracks an egg into the black frying pan on the right burner.</answer>",
    "answer": "The person cracks an egg into the black frying pan on the right burner.",
    "process": "First, I observe the kitchen setup with multiple burners. Then, I focus on the right burner where a black frying pan is placed. Next, I see the person holding an egg and cracking it into the pan.",
    "full_response": "Let me analyze the cooking action... [complete reasoning process] ...Therefore, the answer is: The person cracks an egg into the black frying pan on the right burner.",
    "reward": 0.92,
    "select": true
}
```

---

## 4. 流水线示例

以下给出示例流水线，展示如何使用 VideoCOTQATest 进行思维链问答生成、评估和过滤。

```python
from dataflow.operators.core_vision import VideoCOTQAGenerator, GeneralTextAnswerEvaluator, ScoreFilter
from dataflow.serving import LocalModelVLMServing_vllm
from dataflow.utils.storage import FileStorage
import os

class VideoCOTQATest:
    def __init__(self):
        # 初始化存储
        self.storage = FileStorage(
            first_entry_file_name="./dataflow/example/video_cot_qa/sample_data.json",
            cache_path="./cache",
            file_name_prefix="video_cotqa_test",
            cache_type="json",
        )
        
        self.model_cache_dir = './dataflow_cache'
        
        # 初始化 VLM 服务
        model_path = "Qwen/Qwen2.5-VL-7B-Instruct"
        
        self.vlm_serving = LocalModelVLMServing_vllm(
            hf_model_name_or_path=model_path,
            hf_cache_dir=self.model_cache_dir,
            vllm_tensor_parallel_size=1,
            vllm_temperature=1.0,
            vllm_top_p=0.95,
            vllm_max_tokens=2048,
            vllm_max_model_len=51200,
            vllm_gpu_memory_utilization=0.9,
        )

        # 初始化算子
        self.video_cotqa_generator = VideoCOTQAGenerator(
            vlm_serving=self.vlm_serving,
        )
        
        self.evaluator = GeneralTextAnswerEvaluator(
            use_stemmer=True
        )
        
        self.score_filter = ScoreFilter(
            min_score=0.6,
        )

    def run(self):
        print("Running VideoCOTQAGenerator pipeline...")
        
        # 步骤 1: 生成 CoT QA 响应
        print("\n[Step 1/3] Generating CoT QA responses...")
        answer_key = self.video_cotqa_generator.run(
            storage=self.storage.step(),
            input_video_key="video",
            input_image_key="image",
            input_conversation_key="conversation",
            output_answer_key="answer",
            output_process_key="process",
            output_full_response_key="full_response",
        )
        print(f"Generation finished. Output key: {answer_key}")
        
        # 步骤 2: 评估答案并计算奖励
        print("\n[Step 2/3] Evaluating answers and calculating rewards...")
        reward_key = self.evaluator.run(
            storage=self.storage.step(),
            input_model_output_key="full_response",
            input_gt_solution_key="solution",
            input_question_type_key="problem_type",
            output_reward_key="reward",
        )
        print(f"Evaluation finished. Output key: {reward_key}")
        
        # 步骤 3: 基于奖励阈值过滤
        print("\n[Step 3/3] Filtering based on reward threshold...")
        select_key = self.score_filter.run(
            storage=self.storage.step(),
            input_score_key="reward",
            output_select_key="select",
        )
        print(f"Filtering finished. Output key: {select_key}")
        
        # 验证结果
        print("\n" + "="*60)
        print("Final Results:")
        print("="*60)
        result_df = self.storage.step().read("dataframe")
        print(f"Results shape: {result_df.shape}")
        if not result_df.empty:
            print("\nColumns:", result_df.columns.tolist())
            
            # 计算并显示统计信息
            if 'reward' in result_df.columns and 'select' in result_df.columns:
                rewards = result_df['reward'].tolist()
                selects = result_df['select'].tolist()
                print(f"\nAverage reward: {sum(rewards)/len(rewards):.4f}")
                print(f"Selected samples: {sum(selects)}/{len(selects)}")
            
            # 打印结果样本
            print("\nSample results:")
            cols_to_show = ['answer', 'process', 'reward', 'select']
            available_cols = [col for col in cols_to_show if col in result_df.columns]
            print(result_df[available_cols].head())

if __name__ == "__main__":
    # 如有需要，设置可见 GPU
    # os.environ["CUDA_VISIBLE_DEVICES"] = "0"
    
    try:
        test = VideoCOTQATest()
        test.run()
    except Exception as e:
        print(f"Test failed with error: {e}")
```
