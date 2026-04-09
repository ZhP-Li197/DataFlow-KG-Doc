---
title: 长视频推理问答流水线（API版）
createTime: 2025/07/16 17:00:00
permalink: /zh/mm_guide/video_longvideo_cotqa_api_pipeline/
icon: carbon:flow-stream
---

# 长视频推理问答流水线（API版）

## 1. 概述

**长视频推理问答流水线**（API版）是一个完整的端到端解决方案，通过场景检测将长视频分割成片段，为每个片段生成字幕，合并字幕后生成推理问答，最后优化和重新格式化推理数据。全流程使用 API 模型，适用于长视频理解、复杂推理问答数据集构建和大规模数据处理。

我们支持以下应用场景：

- 长视频理解与分析
- 复杂推理问答数据集构建
- 多步骤推理能力训练数据生成
- 大规模视频数据处理（基于 API）

流水线包含三个主要阶段：

**阶段 1：视频字幕生成**
1. 视频信息提取
2. 场景检测与分割
3. 片段元数据生成
4. 视频片段切割保存
5. 为每个片段生成字幕（使用 VLM API）
6. 合并字幕到原始视频

**阶段 2：推理问答生成**
1. 准备数据
2. 基于合并字幕生成推理问答（使用 LLM API）
3. 解析推理结果为结构化数据

**阶段 3：推理数据重新格式化**
1. 加载解析后的推理数据
2. 构建重新格式化提示词
3. 生成优化后的推理数据（使用 LLM API）

---

## 2. 快速开始

### 第一步：配置 API Key

在脚本中设置 API Key 环境变量：

```python
import os
os.environ["DF_API_KEY"] = "your_api_key"  # 主要 API Key
# os.environ["OPENROUTER_API_KEY"] = "your_openrouter_key"  # 可选：如果使用 OpenRouter
```

### 第二步：创建新的 DataFlow 工作文件夹
```bash
mkdir run_dataflow_mm
cd run_dataflow_mm
```

### 第三步：初始化 DataFlow-MM
```bash
dataflow init
```
这时你会看到：
```bash
run_dataflow_mm/pipelines/gpu_pipelines/video_longvideo_cotqa_api_pipeline.py  
```

### 第四步：配置参数

在 `video_longvideo_cotqa_api_pipeline.py` 中配置视频处理和 API 服务参数：

```python
pipeline = LongVideoPipelineAPI(
    # 视频处理参数
    backend="opencv",
    ext=False,
    frame_skip=0,
    start_remove_sec=0.0,
    end_remove_sec=0.0,
    min_seconds=0.0,
    max_seconds=10.0,
    use_adaptive_detector=False,
    overlap=False,
    use_fixed_interval=True,
    
    # VLM API 参数（用于字幕生成）
    vlm_api_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
    vlm_api_key_name="DF_API_KEY",
    vlm_model_name="qwen3-vl-8b-instruct",
    vlm_max_workers=10,
    vlm_timeout=1800,
    
    # LLM API 参数（用于推理生成）
    llm_api_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
    llm_api_key_name="DF_API_KEY",
    llm_model_name="qwen2.5-72b-instruct",
    llm_max_workers=10,
    llm_timeout=1800,
    
    # LLM API 参数（用于推理重新格式化）
    reformat_api_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
    reformat_api_key_name="DF_API_KEY",
    reformat_model_name="qwen2.5-72b-instruct",
    reformat_max_workers=10,
    reformat_timeout=1800,
    
    video_save_dir="./cache/video_clips",
)
```

### 第五步：一键运行
```bash
python pipelines/gpu_pipelines/video_longvideo_cotqa_api_pipeline.py
```

---

## 3. 数据流与流水线逻辑

### 1. **输入数据**

该流程的输入数据包括以下字段：

* **video**：视频文件路径
* **conversation**（可选）：对话格式数据

这些输入数据可以存储在指定的文件中（如 `json` 或 `jsonl`），并通过 `FileStorage` 对象进行管理和读取：

```python
storage = FileStorage(
    first_entry_file_name="./dataflow/example/video_split/sample_data.json",
    cache_path="./cache",
    file_name_prefix="video_longvideo_cotqa_api",
    cache_type="json",
)
```

**输入数据示例**：

```json
[
    {"video": ["./videos/long_video1.mp4"]},
    {"video": ["./videos/long_video2.mp4"]}
]
```

---

### **阶段 1：视频字幕生成**

#### 步骤 1：视频信息提取（VideoInfoFilter）

**功能：** 提取视频的基础信息（帧率、分辨率、时长等）

**算子初始化**：
```python
self.video_info_filter = VideoInfoFilter(
    backend="opencv",
    ext=False,
)
```

**算子运行**：
```python
self.video_info_filter.run(
    storage=storage.step(),
    input_video_key="video",
    output_key="video_info",
)
```

#### 步骤 2：场景检测（VideoSceneFilter）

**功能：** 基于场景变化或固定间隔分割视频

**算子初始化**：
```python
self.video_scene_filter = VideoSceneFilter(
    frame_skip=0,
    start_remove_sec=0.0,
    end_remove_sec=0.0,
    min_seconds=2.0,
    max_seconds=15.0,
    disable_parallel=True,
    use_adaptive_detector=False,  # 是否使用自适应检测器
    overlap=False,                # 是否使用重叠分割策略
    use_fixed_interval=False,     # 是否使用固定间隔分割
)
```

**算子运行**：
```python
self.video_scene_filter.run(
    storage=storage.step(),
    input_video_key="video",
    video_info_key="video_info",
    output_key="video_scene",
)
```

#### 步骤 3：片段元数据生成（VideoClipFilter）

**功能：** 基于场景检测结果生成每个片段的详细元数据

**算子初始化**：
```python
self.video_clip_filter = VideoClipFilter()
```

**算子运行**：
```python
self.video_clip_filter.run(
    storage=storage.step(),
    input_video_key="video",
    video_info_key="video_info",
    video_scene_key="video_scene",
    output_key="video_clip",
)
```

#### 步骤 4：视频切割保存（VideoClipGenerator）

**功能：** 根据片段元数据将视频切割并保存为独立文件

**算子初始化**：
```python
self.video_clip_generator = VideoClipGenerator(
    video_save_dir="./cache/video_clips",
)
```

**算子运行**：
```python
self.video_clip_generator.run(
    storage=storage.step(),
    video_clips_key="video_clip",
    output_key="video",
)
```

#### 步骤 5：字幕生成（VideoToCaptionGenerator + API）

**功能：** 使用 VLM API 为每个视频片段生成详细字幕

**算子初始化**：
```python
# 初始化 VLM API 服务
self.vlm_serving = APIVLMServing_openai(
    api_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
    key_name_of_api_key="DF_API_KEY",
    model_name="qwen3-vl-8b-instruct",
    max_workers=10,
    timeout=1800
)

# 初始化字幕生成器
self.video_to_caption_generator = VideoToCaptionGenerator(
    vlm_serving=self.vlm_serving,
    prompt_template="Elaborate on the visual and narrative elements of the video in detail.",
)
```

**算子运行**：
```python
self.video_to_caption_generator.run(
    storage=storage.step(),
    input_image_key="image",
    input_video_key="video",
    input_conversation_key="conversation",
    output_key="caption",
)
```

#### 步骤 6：字幕合并（VideoMergedCaptionGenerator）

**功能：** 将所有片段的字幕合并到原始视频级别

**算子初始化**：
```python
self.video_merged_caption_generator = VideoMergedCaptionGenerator(
    caption_key="caption",
)
```

**算子运行**：
```python
self.video_merged_caption_generator.run(
    storage=storage.step(),
    output_key="captions",
)
```

---

### **阶段 2：推理问答生成**

#### 步骤 1：数据准备

**功能：** 准备合并后的字幕数据用于推理问答生成

```python
df = storage.step().read("dataframe")
if "captions" in df.columns:
    df["caption"] = df["captions"]
if "conversation" not in df.columns:
    df["conversation"] = [[{"from": "human", "value": ""}]] * len(df)
storage.write(df)
```

#### 步骤 2：推理问答生成（VideoCaptionToQAGenerator + API）

**功能：** 基于合并字幕生成多步骤推理问答

**算子初始化**：
```python
# 初始化 LLM API 服务
self.llm_serving = APIVLMServing_openai(
    api_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
    key_name_of_api_key="DF_API_KEY",
    model_name="qwen2.5-72b-instruct",
    max_workers=10,
    timeout=1800
)

# 自定义推理问答提示词
REASONING_QA_PROMPT = """
Based on the following captions for a video, generate a challenging multiple-choice question 
that requires **multiple reasoning steps** and deep understanding to answer.
...
"""

# 初始化推理问答生成器
self.reasoning_qa_generator = VideoCaptionToQAGenerator(
    vlm_serving=self.llm_serving,
    prompt_template=DiyVideoPrompt(REASONING_QA_PROMPT),
    use_video_input=False,  # 使用纯文本模式
)
```

**算子运行**：
```python
self.reasoning_qa_generator.run(
    storage=storage.step(),
    input_conversation_key="conversation",
    output_key="reasoning",
)
```

#### 步骤 3：推理结果解析

**功能：** 将生成的推理文本解析为结构化数据

```python
parsed_results = []
for idx, row in df.iterrows():
    if "reasoning" in row and row["reasoning"]:
        parsed = parse_reasoning(row["reasoning"])
        parsed_results.append(parsed)
df["parsed_reasoning"] = parsed_results
```

**解析后的结构**：
- `QUESTION`: 问题文本
- `OPTIONS`: 选项（A, B, C, D）
- `ANSWER`: 正确答案
- `REASONS`: 推理步骤（包含时间戳）

---

### **阶段 3：推理数据重新格式化**

#### 步骤 1：加载解析后的数据

从前一阶段加载结构化的推理数据。

#### 步骤 2：构建重新格式化提示词

**功能：** 为每个推理问答构建优化提示词

```python
REFORMAT_PROMPT_TEMPLATE = """
You are an advanced AI language model designed to refine logical reasoning 
while maintaining accuracy. Your task is to optimize the provided reasoning 
so that it is more natural, logically coherent, and easy to read.
...
"""

for idx, row in df.iterrows():
    parsed = row.get("parsed_reasoning", {})
    prompt = REFORMAT_PROMPT_TEMPLATE.format(
        question=full_question,
        answer=answer,
        reason=reason_text
    )
    prompts.append(prompt)
```

#### 步骤 3：生成优化后的推理（PromptedVQAGenerator + API）

**功能：** 使用 LLM API 优化和重新格式化推理文本

**算子初始化**：
```python
# 初始化重新格式化 API 服务（可以使用不同的模型）
self.reformat_serving = APIVLMServing_openai(
    api_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
    key_name_of_api_key="DF_API_KEY",
    model_name="qwen2.5-72b-instruct",
    max_workers=10,
    timeout=1800
)

# 初始化提示词生成器
self.prompted_vqa_generator = PromptedVQAGenerator(
    serving=self.reformat_serving,
)
```

**算子运行**：
```python
self.prompted_vqa_generator.run(
    storage=storage.step(),
    input_conversation_key="conversation",
    output_answer_key="reformatted_reasoning",
)
```

---

### 2. **输出数据**

最终，流水线生成的输出数据将包含以下内容：

* **id**：视频标识符
* **captions**：合并后的视频字幕（包含时间戳）
* **num_clips**：视频片段数量
* **reasoning**：原始推理问答文本
* **parsed_reasoning**：结构化的推理数据
  - `QUESTION`: 问题
  - `OPTIONS`: 选项字典
  - `ANSWER`: 答案
  - `REASONS`: 推理步骤字典
* **prompt**：重新格式化推理的完整提示词
* **full_question**：完整的问题（含选项）
* **conversation**：重新格式化阶段的对话数据
* **reformatted_reasoning**：优化后的推理文本（用于训练）

**输出数据示例**：

```json
[
    {
        "id": "video1",
        "captions": "From 0 to 10, 视频开始显示一个人走进房间...\nFrom 10 to 20, 那个人拿起一本书...",
        "num_clips": 2,
        "reasoning": "QUESTION: 基于视频内容，这个人的主要目标是什么？\nOPTIONS:\nA. 寻找钥匙\nB. 阅读书籍\nC. 整理房间\nD. 打电话\nANSWER: B\nREASONS:\n##### From 0 to 10:\n- 观察到人物进入房间\n- 环境显示有书架\n##### From 10 to 20:\n- 人物直接走向书架\n- 拿起一本书并打开",
        "parsed_reasoning": {
            "QUESTION": "基于视频内容，这个人的主要目标是什么？",
            "OPTIONS": {
                "A": "寻找钥匙",
                "B": "阅读书籍",
                "C": "整理房间",
                "D": "打电话"
            },
            "ANSWER": "B",
            "REASONS": {
                "Step 1": {
                    "timestamp": "0 to 10",
                    "reasons": ["观察到人物进入房间", "环境显示有书架"]
                },
                "Step 2": {
                    "timestamp": "10 to 20",
                    "reasons": ["人物直接走向书架", "拿起一本书并打开"]
                }
            }
        },
        "prompt": "\nYou are an advanced AI language model designed to refine logical reasoning...\n\"question\": \"基于视频内容，这个人的主要目标是什么？...\"\n\"answer\": \"B\"\n\"reason\": \"Start thinking...\"",
        "full_question": "基于视频内容，这个人的主要目标是什么？\nA. 寻找钥匙\nB. 阅读书籍\nC. 整理房间\nD. 打电话",
        "conversation": [
            {
                "from": "human",
                "value": "You are an advanced AI language model designed to refine logical reasoning..."
            }
        ],
        "reformatted_reasoning": "视频开始显示一个人走进房间，从画面中可以看到房间内有一个书架，这为我们提供了重要的环境线索。分析这个人的行为，我们注意到他的目光和身体动作都明确地指向书架的方向，表明他对书架上的内容有特定的兴趣。接下来，在视频的第二部分，这个人直接走向书架，没有任何犹豫或对房间其他物品的关注，这进一步证实了他的目标非常明确。最关键的证据是，他从书架上拿起一本书并立即打开开始阅读，这个动作直接揭示了他进入房间的真实意图。综合这些连续的行为和场景细节，可以清楚地推断出这个人的主要目标是阅读书籍。因此，正确答案是 B。"
    }
]
```

---

## 4. 流水线示例

以下给出完整的流水线代码示例：

```python
import os
os.environ["DF_API_KEY"] = "your_api_key"

from dataflow.core.Operator import OperatorABC
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import (
    VideoInfoFilter, VideoSceneFilter, VideoClipFilter,
    VideoClipGenerator, VideoToCaptionGenerator,
    VideoMergedCaptionGenerator, VideoCaptionToQAGenerator,
    PromptedVQAGenerator
)
from dataflow.serving.api_vlm_serving_openai import APIVLMServing_openai
from dataflow.prompts.video import DiyVideoPrompt

# 字幕生成提示词
VIDEO_CAPTION_PROMPT = (
    "Elaborate on the visual and narrative elements of the video in detail."
)

# 推理问答生成提示词
REASONING_QA_PROMPT = """
Based on the following captions for a video, generate a challenging 
multiple-choice question that requires **multiple reasoning steps**...
"""

# 重新格式化提示词
REFORMAT_PROMPT_TEMPLATE = """
You are an advanced AI language model designed to refine logical reasoning...
"""

class LongVideoPipelineAPI(OperatorABC):
    def __init__(
        self,
        backend="opencv",
        ext=False,
        frame_skip=0,
        min_seconds=2.0,
        max_seconds=15.0,
        use_fixed_interval=False,
        # VLM API 参数
        vlm_api_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        vlm_api_key_name="DF_API_KEY",
        vlm_model_name="qwen3-vl-8b-instruct",
        vlm_max_workers=10,
        # LLM API 参数
        llm_api_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        llm_api_key_name="DF_API_KEY",
        llm_model_name="qwen2.5-72b-instruct",
        llm_max_workers=10,
        # 重新格式化 API 参数
        reformat_api_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        reformat_api_key_name="DF_API_KEY",
        reformat_model_name="qwen2.5-72b-instruct",
        reformat_max_workers=10,
        video_save_dir="./cache/video_clips",
    ):
        # 初始化视频处理算子
        self.video_info_filter = VideoInfoFilter(backend=backend, ext=ext)
        self.video_scene_filter = VideoSceneFilter(...)
        self.video_clip_filter = VideoClipFilter()
        self.video_clip_generator = VideoClipGenerator(video_save_dir=video_save_dir)
        
        # 初始化 VLM API 服务（字幕生成）
        self.vlm_serving = APIVLMServing_openai(
            api_url=vlm_api_url,
            key_name_of_api_key=vlm_api_key_name,
            model_name=vlm_model_name,
            max_workers=vlm_max_workers,
        )
        self.video_to_caption_generator = VideoToCaptionGenerator(
            vlm_serving=self.vlm_serving,
            prompt_template=VIDEO_CAPTION_PROMPT,
        )
        self.video_merged_caption_generator = VideoMergedCaptionGenerator()
        
        # 初始化 LLM API 服务（推理生成）
        self.llm_serving = APIVLMServing_openai(
            api_url=llm_api_url,
            key_name_of_api_key=llm_api_key_name,
            model_name=llm_model_name,
            max_workers=llm_max_workers,
        )
        self.reasoning_qa_generator = VideoCaptionToQAGenerator(
            vlm_serving=self.llm_serving,
            prompt_template=DiyVideoPrompt(REASONING_QA_PROMPT),
            use_video_input=False,
        )
        
        # 初始化 LLM API 服务（重新格式化）
        self.reformat_serving = APIVLMServing_openai(
            api_url=reformat_api_url,
            key_name_of_api_key=reformat_api_key_name,
            model_name=reformat_model_name,
            max_workers=reformat_max_workers,
        )
        self.prompted_vqa_generator = PromptedVQAGenerator(
            serving=self.reformat_serving,
        )
    
    def run(
        self,
        storage,
        input_video_key="video",
        input_conversation_key="conversation",
        output_key="caption",
    ):
        # ========== 阶段 1：视频字幕生成 ==========
        # 步骤 1-4: 视频处理
        self.video_info_filter.run(storage=storage.step(), ...)
        self.video_scene_filter.run(storage=storage.step(), ...)
        self.video_clip_filter.run(storage=storage.step(), ...)
        self.video_clip_generator.run(storage=storage.step(), ...)
        
        # 步骤 5-6: 字幕生成与合并
        self.video_to_caption_generator.run(storage=storage.step(), ...)
        self.video_merged_caption_generator.run(storage=storage.step(), ...)
        
        # ========== 阶段 2：推理问答生成 ==========
        # 数据准备
        df = storage.step().read("dataframe")
        # ... 数据准备逻辑 ...
        
        # 生成推理问答
        self.reasoning_qa_generator.run(storage=storage.step(), ...)
        
        # 解析推理结果
        # ... 解析逻辑 ...
        
        # ========== 阶段 3：推理数据重新格式化 ==========
        # 构建提示词并生成优化后的推理
        self.prompted_vqa_generator.run(storage=storage.step(), ...)
        
        return "reformatted_reasoning"

if __name__ == "__main__":
    storage = FileStorage(
        first_entry_file_name="./dataflow/example/video_split/sample_data.json",
        cache_path="./cache",
        file_name_prefix="video_longvideo_cotqa_api",
        cache_type="json",
    )
    
    pipeline = LongVideoPipelineAPI(
        use_fixed_interval=True,
        min_seconds=0.0,
        max_seconds=10.0,
        vlm_model_name="qwen3-vl-8b-instruct",
        llm_model_name="qwen2.5-72b-instruct",
        reformat_model_name="qwen2.5-72b-instruct",
    )
    
    pipeline.run(storage=storage)
```