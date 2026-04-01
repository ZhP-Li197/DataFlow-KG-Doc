---
title: 多角色视频问答生成(MultiRole Video QA Generation)
createTime: 2025/12/2 20:00:00
icon: material-symbols-light:video
permalink: /zh/mm_operators/generate/multirole_videoqa/
---

## 📘 概述

`MultiroleVideoQAGenerate` 是一个数据生成算子，用于**基于预处理视频数据自动创建问答对（QA Pairs）**。 
给定输入的预处理视频数据，它会构建多个与该视频相关的问答对。该算子适用于**广告视频标注**、**数据集构建**和**视频理解**任务。

**功能特性：**
* 支持**批量处理**多个预处理视频数据。
* 使用 **VLM（如 Qwen2.5-VL）**生成**高质量**的问答对。
* 自动处理视频输入并使用 Prompt 生成数据。

---

## 🏗️ `__init__` 函数

```python
def __init__(
    self,
    llm_serving: VLMServingABC
):
    ...
```
## 🧾 `__init__` 参数

| Parameter     | Type            | Default | Description                                                     |
| :------------ | :-------------- | :------ | :-------------------------------------------------------------- |
| `llm_serving` | `VLMServingABC` | -       | **Model Serving Object** used to call the VLM for QA pairs generation |

-----

## ⚡ `run` 函数

```python
def run(
        self,
        storage: DataFlowStorage,
        input_meta_key: str = "Meta", 
        input_clips_key: str = "Clips", 
        output_key: str = "QA"
):
    ...
```

The `run` function executes the main QA pairs generation workflow:
read data paths → **validate DataFrame** → construct prompts → call the model → generate QA pairs captions → write results to output.

## 🧾 `run` 参数

| Parameter         | Type              | Default     | Description                                           |
| :---------------- | :---------------- | :---------- | :---------------------------------------------------- |
| `storage`         | `DataFlowStorage` | -           | Dataflow storage object                               |
| `input_mets_key`  | `str`             | `"Meta"`    | **Multimodal Input Field Name**                       |
| `input_clips_key` | `str`             | `"Clips"`   | **Multimodal Input Field Name**                       |
| `output_key`      | `str`             | `"QA"`      | **Model Output Field Name** (the generated QA pairs)  |

-----

## 🧠 示例用法

```python
import os 
import argparse
from dataflow.serving import LocalModelVLMServing_vllm
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import MultiroleVideoQAInitialGenerator, MultiroleVideoQAMultiAgentGenerator, MultiroleVideoQAFinalGenerator

# Step 1: Launch local model service
llm_serving = LocalModelVLMServing_vllm(
            hf_model_name_or_path=model_path,
            hf_cache_dir=hf_cache_dir,
            hf_local_dir=download_dir,
            vllm_tensor_parallel_size=1, 
            vllm_temperature=0.7,
            vllm_top_p=0.9,
            vllm_max_tokens=6000,
        )

# Step 2: Prepare input data
storage = FileStorage(
            first_entry_file_name=first_entry_file,
            cache_path=cache_path,
            file_name_prefix=file_name_prefix,
            cache_type=cache_type,
        )

# Step 3: Initialize and run the operator
initial_QA_generation = MultiroleVideoQAInitialGenerator(llm_serving = self.llm_serving)
multiAgent_QA_generation = MultiroleVideoQAMultiAgentGenerator(llm_serving = self.llm_serving, max_iterations = 3)
final_QA_generation = MultiroleVideoQAFinalGenerator(llm_serving = self.llm_serving)

init_df = initial_QA_generation.run(
            storage = self.storage.step(),
            input_meta_key = self.input_meta_key, 
            input_clips_key = self.input_clips_key, 
            output_key = self.output_key
        )
middle_df = multiAgent_QA_generation.run(
            df = init_df,
            input_meta_key = self.input_meta_key, 
            input_clips_key = self.input_clips_key, 
            output_key = self.output_key
        )
final_QA_generation.run(
            storage = self.storage,
            df = middle_df,
            input_meta_key = self.input_meta_key, 
            input_clips_key = self.input_clips_key, 
            output_key = self.output_key
        )
```

-----

## 🧾 默认输出格式

| Field     | Type         | Description                      |
| :-------- | :----------- | :------------------------------- |
| `Meta`    | `str`        | Meta information for video       |
| `Clips`   | `List[Dict]` | Interleaved modality video Clips |
| `QA`      | `List[Dict]` | QA pairs                         |

-----

### 📥 示例输入

```jsonl
{"Meta": "Meta Information", "Clips": [{"Audio_Text": "Audio_Text1", "Frames_Images": ["image_path1","image_path2"], "Description": "Description1"}, {"Audio_Text": "Audio_Text2", "Frames_Images": ["image_path3","image_path4"], "Description": "Description2"}]}
```

### 📤 示例输出

```jsonl
{"Meta": "Meta Information", "Clips": [{"Audio_Text": "Audio_Text1", "Frames_Images": ["image_path1","image_path2"], "Description": "Description1"}, {"Audio_Text": "Audio_Text2", "Frames_Images": ["image_path3","image_path4"], "Description": "Description2"}], "QA":[{"Label":"label1", "Question": "Question1", "Answer": "Answer1"},{"Label":"label2", "Question": "Question2", "Answer": "Answer2"}]}
```