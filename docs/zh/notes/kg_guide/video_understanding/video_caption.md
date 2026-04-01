---
title: 视频描述生成流水线
createTime: 2025/07/16 14:50:59
permalink: /zh/mm_guide/video_caption_pipeline/
icon: material-symbols-light:interpreter-mode
---

# 视频描述生成流水线

## 1. 概述

**视频描述生成流水线**利用视觉-语言模型（VLM）自动为视频生成高质量的描述文本，适用于视频标注、多模态数据集构建和视频理解任务。

我们支持以下应用场景：

- 视频内容自动标注与描述生成
- 多模态训练数据集构建
- 视频理解与分析任务

流水线的主要流程包括：

1. **数据加载**：读取视频文件和对话格式数据。
2. **视频理解**：利用 VLM 模型分析视频内容。
3. **描述生成**：基于视频内容生成详细的文本描述。

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
run_dataflow_mm/pipelines/gpu_pipelines/video_caption_pipeline.py  
```

### 第三步：配置模型路径

在 `video_caption_pipeline.py` 中配置 VLM 模型路径：

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
python pipelines/gpu_pipelines/video_caption_pipeline.py
```

此外，你可以根据自己的需求选择任意其他的 Pipeline 代码运行，其运行方式都是类似的。接下来，我们会介绍在 Pipeline 中使用到的算子以及如何进行参数配置。

---

## 3. 数据流与流水线逻辑

### 1. **输入数据**

该流程的输入数据包括以下字段：

* **video**：视频文件路径列表，如 `["path/to/video.mp4"]`
* **conversation**：对话格式数据，如 `[{"from": "human", "value": ""}]`
* **image**（可选）：图像文件路径列表，用于同时处理图像

这些输入数据可以存储在指定的文件中（如 `json` 或 `jsonl`），并通过 `FileStorage` 对象进行管理和读取。在提供的示例中，默认数据路径被加载。在实际使用中，你可以修改路径以加载自定义数据和缓存路径：

```python
self.storage = FileStorage(
    first_entry_file_name="./dataflow/example/video_caption/sample_data.json",
    cache_path="./cache",
    file_name_prefix="video_caption",
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

流程的核心步骤是使用**视频描述生成器**（`VideoToCaptionGenerator`）为每个视频生成详细的文本描述。

**功能：**

* 利用 VLM 模型分析视频内容并生成描述文本
* 支持自定义描述风格和提示词
* 可配置生成参数（温度、top_p 等）

**输入**：视频文件路径和对话格式数据  
**输出**：生成的视频描述文本

**模型服务配置**：

```python
self.vlm_serving = LocalModelVLMServing_vllm(
    hf_model_name_or_path="Qwen/Qwen2.5-VL-7B-Instruct",
    hf_cache_dir="./dataflow_cache",
    vllm_tensor_parallel_size=1,          # 单卡设为 1，多卡可设为 GPU 数量
    vllm_temperature=0.7,                 # 生成温度，控制随机性
    vllm_top_p=0.9,                       # Top-p 采样参数
    vllm_max_tokens=2048,                 # 最大生成 token 数
    vllm_max_model_len=51200,             # 模型最大上下文长度
    vllm_gpu_memory_utilization=0.9       # GPU 显存利用率
)
```

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

### 3. **输出数据**

最终，流水线生成的输出数据将包含以下内容：

* **video**：原始视频路径
* **conversation**：更新后的对话数据（包含生成的提示）
* **caption**：生成的视频描述文本

**输出数据示例**：

```json
{
    "video": ["./videos/sample1.mp4"],
    "conversation": [{"from": "human", "value": "Please describe the video in detail."}],
    "caption": "这段视频展示了一个人在公园中散步的场景。天气晴朗，阳光明媚，背景中可以看到绿树和长椅。这个人穿着休闲服装，步伐悠闲，似乎在享受宁静的户外时光。"
}
```

---

## 4. 流水线示例

以下给出示例流水线，展示如何使用 VideoToCaptionGenerator 进行视频描述生成。

```python
from dataflow.operators.core_vision import VideoToCaptionGenerator
from dataflow.serving import LocalModelVLMServing_vllm
from dataflow.utils.storage import FileStorage

class VideoCaptionGenerator():
    def __init__(self):
        # -------- 存储配置 --------
        self.storage = FileStorage(
            first_entry_file_name="./dataflow/example/video_caption/sample_data.json",
            cache_path="./cache",
            file_name_prefix="video_caption",
            cache_type="json",
        )
        self.model_cache_dir = './dataflow_cache'

        # -------- VLM 模型服务 --------
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

        # -------- 视频描述生成算子 --------
        self.video_to_caption_generator = VideoToCaptionGenerator(
            vlm_serving = self.vlm_serving,
        )

    def forward(self):
        self.video_to_caption_generator.run(
            storage = self.storage.step(),
            input_image_key="image",
            input_video_key="video",
            input_conversation_key="conversation",
            output_key="caption",
        )

if __name__ == "__main__":
    # 流水线入口
    model = VideoCaptionGenerator()
    model.forward()
```
