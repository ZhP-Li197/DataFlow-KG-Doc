---
title: 视频问答生成流水线
createTime: 2025/07/16 16:00:00
permalink: /zh/mm_guide/video_qa_pipeline/
icon: mdi:chat-question
---

# 视频问答生成流水线

## 1. 概述

**视频问答生成流水线**从视频内容自动生成高质量的问答对，通过先生成视频描述，再基于描述生成问答，适用于视频问答数据集构建、视频理解评测和多模态训练数据生成。

我们支持以下应用场景：

- 视频问答数据集自动构建
- 视频理解能力评测数据生成
- 多模态对话训练数据合成
- 视频内容理解与问答

流水线的主要流程包括：

1. **视频描述生成**：利用 VLM 模型分析视频内容并生成详细描述。
2. **问答对生成**：基于视频描述（可选结合视频）生成问题和答案。

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
run_dataflow_mm/pipelines/gpu_pipelines/video_qa_pipeline.py  
```

### 第三步：配置模型路径

在 `video_qa_pipeline.py` 中配置 VLM 模型路径：

```python
self.vlm_serving = LocalModelVLMServing_vllm(
    hf_model_name_or_path="Qwen/Qwen2.5-VL-7B-Instruct",  # 修改为你的模型路径
    hf_cache_dir="./dataflow_cache",
    vllm_tensor_parallel_size=1,
    vllm_temperature=0.7,
    vllm_top_p=0.9,
    vllm_max_tokens=2048,
    vllm_max_model_len=51200,
    vllm_gpu_memory_utilization=0.9
)
```

### 第四步：一键运行
```bash
python pipelines/gpu_pipelines/video_qa_pipeline.py
```

此外，你可以根据自己的需求调整生成策略（是否在生成 QA 时使用视频输入）。接下来，我们会详细介绍流水线中的各个步骤和参数配置。

---

## 3. 数据流与流水线逻辑

### 1. **输入数据**

该流程的输入数据包括以下字段：

* **video**：视频文件路径列表，如 `["path/to/video.mp4"]`
* **conversation**：对话格式数据，如 `[{"from": "human", "value": ""}]`
* **image**（可选）：图像文件路径列表，用于同时处理图像

这些输入数据可以存储在指定的文件中（如 `json` 或 `jsonl`），并通过 `FileStorage` 对象进行管理和读取：

```python
self.storage = FileStorage(
    first_entry_file_name="./dataflow/example/video_caption/sample_data.json",
    cache_path="./cache",
    file_name_prefix="video_vqa",
    cache_type="json",
)
```

**输入数据示例**：

```json
[
    {
        "video": ["./videos/sample1.mp4"],
        "conversation": [{"from": "human", "value": ""}]
    },
    {
        "video": ["./videos/sample2.mp4"],
        "conversation": [{"from": "human", "value": ""}]
    }
]
```

### 2. **视频描述生成（VideoToCaptionGenerator）**

流程的第一步是使用**视频描述生成器**（`VideoToCaptionGenerator`）为视频生成详细的文本描述。

**功能：**

* 利用 VLM 模型分析视频内容并生成描述文本
* 为后续的问答生成提供内容基础

**输入**：视频文件路径和对话格式数据  
**输出**：生成的视频描述文本（`caption` 字段）

**算子初始化**：

```python
self.video_to_caption_generator = VideoToCaptionGenerator(
    vlm_serving=self.vlm_serving,
)
```

**算子运行**：

```python
self.video_to_caption_generator.run(
    storage=self.storage.step(),
    input_image_key="image",              # 输入图像字段（可选）
    input_video_key="video",              # 输入视频字段
    input_conversation_key="conversation", # 输入对话字段
    output_key="caption",                 # 输出描述字段
)
```

### 3. **问答对生成（VideoCaptionToQAGenerator）**

流程的第二步是使用**问答生成器**（`VideoCaptionToQAGenerator`）基于视频描述生成问答对。

**功能：**

* 基于视频描述生成相关的问题和答案
* 支持两种模式：
  - **使用视频输入**：同时基于描述和视频内容生成 QA（更准确）
  - **仅使用描述**：仅基于文本描述生成 QA（更快速）

**输入**：视频描述、视频文件（可选）、对话数据  
**输出**：生成的问答对（`qa` 字段）

**算子初始化**：

```python
self.videocaption_to_qa_generator = VideoCaptionToQAGenerator(
    vlm_serving=self.vlm_serving,
    use_video_input=True,  # 控制是否使用视频输入
)
```

**参数说明**：
- `use_video_input=True`: 同时使用 caption 和视频生成问题
- `use_video_input=False`: 仅使用 caption 生成问题

**算子运行**：

```python
self.videocaption_to_qa_generator.run(
    storage=self.storage.step(),
    input_image_key="image",              # 输入图像字段（可选）
    input_video_key="video",              # 输入视频字段
    input_conversation_key="conversation", # 输入对话字段
    output_key="qa",                      # 输出问答字段
)
```

### 4. **输出数据**

最终，流水线生成的输出数据将包含以下内容：

* **video**：原始视频路径
* **conversation**：更新后的对话数据
* **caption**：生成的视频描述文本
* **qa**：生成的问答对（包含问题和答案）

**输出数据示例**：

```json
{
    "video": ["./videos/sample1.mp4"],
    "conversation": [{"from": "human", "value": "Please describe the video in detail."}],
    "caption": "这段视频展示了一个人在公园中散步的场景。天气晴朗，阳光明媚，背景中可以看到绿树和长椅。",
    "qa": {
        "question": "视频中的人在做什么？",
        "answer": "视频中的人正在公园中散步，享受晴朗的天气。"
    }
}
```

---

## 4. 流水线示例

以下给出示例流水线，展示如何使用 VideoVQAGenerator 进行视频问答生成。

```python
from dataflow.operators.core_vision import VideoToCaptionGenerator, VideoCaptionToQAGenerator
from dataflow.operators.conversations import Conversation2Message
from dataflow.serving import LocalModelVLMServing_vllm
from dataflow.utils.storage import FileStorage

class VideoVQAGenerator():
    def __init__(self, use_video_in_qa=True):
        """
        Args:
            use_video_in_qa: 是否在生成 QA 时输入视频。
                            True: 同时使用 caption 和视频生成问题
                            False: 仅使用 caption 生成问题（不输入视频）
        """
        self.storage = FileStorage(
            first_entry_file_name="./dataflow/example/video_caption/sample_data.json",
            cache_path="./cache",
            file_name_prefix="video_vqa",
            cache_type="json",
        )
        self.model_cache_dir = './dataflow_cache'

        self.vlm_serving = LocalModelVLMServing_vllm(
            hf_model_name_or_path="Qwen/Qwen2.5-VL-7B-Instruct",
            hf_cache_dir=self.model_cache_dir,
            vllm_tensor_parallel_size=1,
            vllm_temperature=0.7,
            vllm_top_p=0.9, 
            vllm_max_tokens=2048,
            vllm_max_model_len=51200,  
            vllm_gpu_memory_utilization=0.9
        )

        self.video_to_caption_generator = VideoToCaptionGenerator(
            vlm_serving = self.vlm_serving,
        )
        self.videocaption_to_qa_generator = VideoCaptionToQAGenerator(
            vlm_serving = self.vlm_serving,
            use_video_input = use_video_in_qa,  # 控制是否使用视频输入
        )

    def forward(self):
        self.video_to_caption_generator.run(
            storage = self.storage.step(),
            input_image_key="image",
            input_video_key="video",
            input_conversation_key="conversation",
            output_key="caption",
        )
        
        self.videocaption_to_qa_generator.run(
            storage = self.storage.step(),
            input_image_key="image",
            input_video_key="video",
            input_conversation_key="conversation",
            output_key="qa",
        )

if __name__ == "__main__":    
    # 使用视频输入来生成 QA（默认行为）
    model = VideoVQAGenerator(use_video_in_qa=True)
    
    # 不使用视频输入，仅基于 caption 生成 QA
    # model = VideoVQAGenerator(use_video_in_qa=False)
    
    model.forward()
```
