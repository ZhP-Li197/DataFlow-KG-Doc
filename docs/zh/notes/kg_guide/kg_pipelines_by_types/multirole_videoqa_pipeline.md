---
title: 多角色视频问答生成流水线
createTime: 2026/01/11 22:15:28
icon: mdi:image-text
permalink: /zh/mm_guide/multirole_videoqa_pipeline/
---
## 1. 概述

**多角色视频问答生成流水线 (MultiRole Video QA Pipeline)** 旨在利用多模态大模型（VLM）和多智能体（Multi-Agent）协作机制，自动从长视频或广告视频中生成高质量、深度的问答对（QA Pairs）。

与普通的单次生成不同，该流水线引入了**多智能体迭代优化**环节。它首先生成初始问答，然后通过模拟不同角色的智能体（如提问者、检查者、润色者）进行多轮交互和修正，最终输出逻辑严密、信息准确的问答数据。

我们支持以下应用场景：

* **广告视频理解**：提取广告中的关键卖点、情感倾向和叙事逻辑。
* **复杂视频推理**：构建需要跨时间段推理的深度问答数据集。
* **长视频摘要与问答**：处理包含丰富元数据（Meta）和多个片段（Clips）的视频数据。

流水线的主要流程包括：

1. **初始生成 (Initial Generation)**：基于视频元数据和片段生成基础问答对。
2. **多智能体协作 (Multi-Agent Refinement)**：通过多轮迭代（默认 3 轮），对问答对进行批判、修正和优化。
3. **最终整合 (Final Generation)**：清洗数据，输出标准格式的最终问答集。

---

## 2. 快速开始

### 第一步：准备工作目录

```bash
mkdir run_video_qa
cd run_video_qa

```

### 第二步：准备脚本

将下文“流水线示例”中的代码保存为 `multirole_videoqa_pipeline.py`。

### 第三步：配置运行参数

确保输入数据包含 `Meta` 和 `Clips` 字段。

```bash
# 安装依赖
pip install open-dataflow vllm

```

### 第四步：一键运行

```bash
python multirole_videoqa_pipeline.py \
  --model_path "/path/to/Qwen2.5-VL-7B-Instruct" \
  --images_file "data/adsQA.jsonl" \
  --card_id "0"

```

---

## 3. 数据流与流水线逻辑

### 1. **输入数据**

输入数据通常是经过预处理的视频数据，包含全局元数据和分段信息：

* **Meta**：视频的全局描述、标题或背景信息。
* **Clips**：视频片段列表，每个片段包含音频文本、帧图像路径和片段描述。

**输入数据示例**：

```json
{
    "Meta": "A commercial for a new sports car featuring dynamic driving scenes.",
    "Clips": [
        {
            "Audio_Text": "Experience the speed.",
            "Frames_Images": ["./frames/001.jpg", "./frames/002.jpg"],
            "Description": "Car accelerating on a highway."
        },
        {
            "Audio_Text": "Safety meets luxury.",
            "Frames_Images": ["./frames/003.jpg"],
            "Description": "Interior shot showing leather seats."
        }
    ]
}

```

### 2. **核心算子逻辑**

该流水线通过三个专门的算子串联执行：

#### A. **MultiroleVideoQAInitialGenerator（初始生成器）**

* **功能**：作为“初稿作者”，它读取 `Meta` 和 `Clips`，利用 VLM 生成第一版问答对。
* **输出**：包含初步 QA 的 DataFrame。

#### B. **MultiroleVideoQAMultiAgentGenerator（多智能体优化器）**

* **功能**：作为“编辑团队”，它对初稿进行打磨。
* **机制**：设置 `max_iterations`（如 3 次），在多轮次中，模型可能扮演不同角色（如审核员指出错误、润色员优化措辞），逐步提升 QA 质量。
* **输入**：初始 DataFrame。
* **输出**：经过多轮修正后的中间态 DataFrame。

#### C. **MultiroleVideoQAFinalGenerator（最终生成器）**

* **功能**：作为“出版商”，它负责最终的格式化和清洗。
* **输出**：标准化的 `QA` 列表。

### 3. **输出数据**

输出数据在原有字段基础上增加了高质量的问答列表：

* **QA**：生成的问答对列表，包含标签（如问题类型）、问题文本和答案文本。

**输出数据示例**：

```json
{
    "Meta": "...",
    "Clips": [...],
    "QA": [
        {
            "Label": "Feature Extraction",
            "Question": "What specific features of the car are highlighted in the interior shots?",
            "Answer": "The video highlights the luxury leather seats and the advanced dashboard interface."
        },
        {
            "Label": "Narrative Analysis",
            "Question": "How does the audio complement the visual transition?",
            "Answer": "The narration 'Experience speed' coincides with the acceleration scene, reinforcing the dynamic visual."
        }
    ]
}

```

---

## 4. 流水线示例

以下是完整的 `MultiRoleVideoQAPipeline` 代码实现。

```python
import argparse
import os 
from dataflow.serving import LocalModelVLMServing_vllm
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import (
    MultiroleVideoQAInitialGenerator, 
    MultiroleVideoQAMultiAgentGenerator, 
    MultiroleVideoQAFinalGenerator
)

try:
    import torch
    # 多进程启动方式设置为 spawn，避免 CUDA 初始化冲突
    if 'spawn' not in torch.multiprocessing.get_all_start_methods():
        torch.multiprocessing.set_start_method('spawn', force=True)
except ImportError:
    pass


class MultiRoleVideoQAPipeline():
    def __init__(
        self,
        model_path: str,
        *,
        hf_cache_dir: str | None = None,
        download_dir: str = "./ckpt",
        first_entry_file: str = "/dataflow/example/ads_QA/adsQA.jsonl",
        cache_path: str = "./cache_local",
        file_name_prefix: str = "dataflow_cache_step",
        cache_type: str = "jsonl",
        # Keys Configuration
        Meta_key: str = "Meta",
        clips_key: str = "Clips", 
        output_key: str = "QA"
    ):
        # 1. 存储初始化
        self.storage = FileStorage(
            first_entry_file_name=first_entry_file,
            cache_path=cache_path,
            file_name_prefix=file_name_prefix,
            cache_type=cache_type,
        )
        
        # 强制设置 vLLM 的多进程方法
        os.environ['VLLM_WORKER_MULTIPROC_METHOD'] = "spawn"

        # 2. VLM 服务初始化
        self.llm_serving = LocalModelVLMServing_vllm(
            hf_model_name_or_path=model_path,
            hf_cache_dir=hf_cache_dir,
            hf_local_dir=download_dir,
            vllm_tensor_parallel_size=1, 
            vllm_temperature=0.7,
            vllm_top_p=0.9,
            vllm_max_tokens=6000, # 视频问答通常需要较长的 Context
        )

        # 3. 算子链初始化
        # 阶段一：初始生成
        self.initial_QA_generation = MultiroleVideoQAInitialGenerator(llm_serving = self.llm_serving)
        
        # 阶段二：多智能体迭代优化 (核心差异点)
        self.multiAgent_QA_generation = MultiroleVideoQAMultiAgentGenerator(
            llm_serving = self.llm_serving, 
            max_iterations = 3
        )
        
        # 阶段三：最终格式化
        self.final_QA_generation = MultiroleVideoQAFinalGenerator(llm_serving = self.llm_serving)

        self.input_meta_key = Meta_key
        self.input_clips_key = clips_key
        self.output_key = output_key

    def forward(self):
        print(">>> [Pipeline] Step 1: Initial QA Generation...")
        init_df = self.initial_QA_generation.run(
            storage = self.storage.step(),
            input_meta_key = self.input_meta_key, 
            input_clips_key = self.input_clips_key, 
            output_key = self.output_key
        )
        
        print(">>> [Pipeline] Step 2: Multi-Agent Refinement (3 iterations)...")
        # 注意：此算子接收上一阶段的 DataFrame (init_df) 作为输入
        middle_df = self.multiAgent_QA_generation.run(
            df = init_df,
            input_meta_key = self.input_meta_key, 
            input_clips_key = self.input_clips_key, 
            output_key = self.output_key
        )
        
        print(">>> [Pipeline] Step 3: Finalizing QA Pairs...")
        self.final_QA_generation.run(
            storage = self.storage,
            df = middle_df,
            input_meta_key = self.input_meta_key, 
            input_clips_key = self.input_clips_key, 
            output_key = self.output_key
        )
        print(">>> [Pipeline] Done.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Batch video QA generation with DataFlow (Single GPU)")

    parser.add_argument("--model_path", default="../../Models/Qwen2.5-VL-7B-Instruct",
                                 help="Path to the local model or HuggingFace repo ID.")
    parser.add_argument("--hf_cache_dir", default="~/.cache/huggingface",
                                 help="HuggingFace cache directory.")
    parser.add_argument("--download_dir", default="./ckpt",
                                 help="Local directory for downloading models.")
    
    parser.add_argument("--card_id", type=str, default="0",
                                 help="The single CUDA device ID to use (e.g., '0' or '1').")
    
    parser.add_argument("--images_file", default="./dataflow/example/ads_QA/adsQA.jsonl",
                                 help="Path to the first entry file for DataFlow.")
    parser.add_argument("--cache_path", default="./cache_local",
                                 help="Directory for caching DataFlow steps.")
    parser.add_argument("--file_name_prefix", default="caption",
                                 help="Prefix for cache file names.")
    parser.add_argument("--cache_type", default="jsonl",
                                 help="Type of cache file (e.g., jsonl).")

    args = parser.parse_args()

    os.environ['CUDA_VISIBLE_DEVICES'] = args.card_id.replace(' ', '')
    
    pipe = MultiRoleVideoQAPipeline(
        model_path=args.model_path,
        hf_cache_dir=args.hf_cache_dir,
        download_dir=args.download_dir,
        first_entry_file=args.images_file,
        cache_path=args.cache_path,
        file_name_prefix=args.file_name_prefix,
        cache_type=args.cache_type,
    )
    pipe.forward()

```
