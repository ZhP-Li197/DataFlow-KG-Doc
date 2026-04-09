---
title: Multi-Role Video QA Pipeline
createTime: 2026/01/11 22:15:28
icon: mdi:image-text
permalink: /en/mm_guide/multirole_videoqa_pipeline/
---
## 1. Overview

The **Multi-Role Video QA Pipeline** leverages Multimodal Large Models (VLMs) and a Multi-Agent collaboration mechanism to automatically generate high-quality, deep Question-Answer (QA) pairs from long videos or advertising footage.

Unlike standard single-pass generation, this pipeline introduces a **Multi-Agent Iterative Refinement** phase. It first generates initial QAs, then refines them through multiple rounds of interaction simulating different agent roles (e.g., Questioner, Checker, Polisher), finally outputting logical and accurate QA data.

We support the following application scenarios:

* **Ad Video Understanding**: Extracting key selling points, emotional tone, and narrative logic from ads.
* **Complex Video Reasoning**: Constructing deep QA datasets requiring reasoning across different time segments.
* **Long Video Summarization & QA**: Handling video data containing rich Metadata (`Meta`) and multiple Clips (`Clips`).

The main process of the pipeline includes:

1. **Initial Generation**: Generates baseline QA pairs based on video metadata and clips.
2. **Multi-Agent Refinement**: Critiques, corrects, and optimizes QA pairs through multiple iterations (default 3 rounds).
3. **Final Generation**: Cleans the data and outputs the final QA set in a standard format.

---

## 2. Quick Start

### Step 1: Create a Working Directory

```bash
mkdir run_video_qa
cd run_video_qa

```

### Step 2: Prepare the Script

Save the code in the "Pipeline Example" section below as `multirole_videoqa_pipeline.py`.

### Step 3: Configure Parameters

Ensure the input data contains `Meta` and `Clips` fields.

```bash
# Install dependencies
pip install open-dataflow vllm

```

### Step 4: Run

```bash
python multirole_videoqa_pipeline.py \
  --model_path "/path/to/Qwen2.5-VL-7B-Instruct" \
  --images_file "data/adsQA.jsonl" \
  --card_id "0"

```

---

## 3. Data Flow & Logic

### 1. **Input Data**

Input data is typically pre-processed video data containing global metadata and segment information:

* **Meta**: Global description, title, or background info of the video.
* **Clips**: List of video clips, where each clip contains audio text, frame image paths, and clip descriptions.

**Input Data Example**:

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

### 2. **Core Operator Logic**

This pipeline executes through a chain of three specialized operators:

#### A. **MultiroleVideoQAInitialGenerator**

* **Function**: Acts as the "Draft Author", reading `Meta` and `Clips` to generate the first version of QA pairs using the VLM.
* **Output**: A DataFrame containing preliminary QAs.

#### B. **MultiroleVideoQAMultiAgentGenerator**

* **Function**: Acts as the "Editorial Team", polishing the draft.
* **Mechanism**: Configured with `max_iterations` (e.g., 3 rounds). During these rounds, the model may simulate different roles (e.g., a reviewer pointing out errors, a polisher improving wording) to progressively enhance QA quality.
* **Input**: Initial DataFrame.
* **Output**: Intermediate DataFrame after multiple rounds of correction.

#### C. **MultiroleVideoQAFinalGenerator**

* **Function**: Acts as the "Publisher", responsible for final formatting and cleaning.
* **Output**: Standardized `QA` list.

### 3. **Output Data**

The output data adds a high-quality QA list to the original fields:

* **QA**: List of generated QA pairs, including labels (e.g., question type), question text, and answer text.

**Output Data Example**:

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

## 4. Pipeline Example

Below is the complete `MultiRoleVideoQAPipeline` code implementation.

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
