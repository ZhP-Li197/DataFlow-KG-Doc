---
title: ContextVQA 多模态问答数据生成流水线
icon: mdi:image-text
createTime: 2025/06/16 14:30:00
permalink: /zh/mm_guide/contextvqa_pipeline/
---
## 1. 概述

**ContextVQA 多模态问答数据生成流水线**旨在从图像出发，自动生成**具备外部知识上下文的视觉问答（Context-based VQA）数据**。该流水线利用视觉语言模型（VLM）生成与图像相关的 Wikipedia 风格文章及问答对，并将其解析为结构化数据。

我们支持以下应用场景：

* **知识型 VQA 数据合成**：构建需要外部知识推理的问答数据集。
* **多模态 RAG 数据构建**：生成用于检索增强生成（RAG）训练的高质量数据。
* **视觉推理训练**：生成问题指向图像、但答案需从文本上下文推理的数据。

流水线的主要流程包括：

1. **数据加载**：读取包含图像路径的数据文件。
2. **上下文与问答生成**：利用 VLM 基于图像生成 Wikipedia 风格文章及原始问答对。
3. **数据清洗与结构化**：解析原始文本，提取结构化的 `{context, qas}` 格式。

---

## 2. 快速开始

### 第一步：准备工作目录

```bash
mkdir run_context_vqa
cd run_context_vqa

```

### 第二步：准备脚本

将下文“流水线示例”中的代码保存为 `context_vqa_pipeline.py`。

### 第三步：配置运行参数

该流水线支持命令行参数配置。你可以直接通过命令行指定模型路径和输入文件：

```bash
# 确保安装了相关依赖
pip install open-dataflow vllm

```

### 第四步：一键运行

```bash
python context_vqa_pipeline.py \
  --model_path "Qwen/Qwen2.5-VL-3B-Instruct" \
  --images_file "path/to/your/images.jsonl" \
  --cache_path "./cache_local"

```

---

## 3. 数据流与流水线逻辑

### 1. **输入数据**

该流程的输入数据主要包含以下字段：

* **image**：图像文件路径（本地路径或 URL）。
* **id**（可选）：数据的唯一标识符。

数据通过 `FileStorage` 进行管理，支持断点续传。

**输入数据示例**：

```json
[
    {
        "id": 1,
        "image": "./images/landmark.jpg"
    },
    {
        "id": 2,
        "image": "./images/animal.jpg"
    }
]

```

### 2. **核心算子逻辑**

该流水线通过串联两个核心算子来完成任务：

#### A. **FixPromptedVQAGenerator（上下文生成）**

该算子负责利用 VLM 模型，根据预设的 Prompt 模板生成原始文本。

**功能：**

* 基于图像生成一段 Wikipedia 风格的科普文章。
* 基于文章生成问答对。
* **Prompt 约束**：问题指向图像但避免直接提及物体名称；答案必须来自文章内容且非图像中的物体；答案简练。

**模型服务配置**：

```python
self.serving = LocalModelVLMServing_vllm(
    hf_model_name_or_path=model_path,
    hf_cache_dir=hf_cache_dir,
    vllm_tensor_parallel_size=1,
    vllm_temperature=0.7,  # 保持一定的创造性
    vllm_top_p=0.9,
    vllm_max_tokens=512,
)

```

**算子运行**：

```python
self.vqa_generator.run(
    storage=self.storage.step(),
    input_image_key="image",
    output_answer_key="vqa" # 输出原始生成的文本
)

```

#### B. **WikiQARefiner（结果解析）**

该算子负责将 VLM 生成的非结构化文本清洗并转换为标准格式。

**功能：**

* 清洗 Markdown 格式和多余的空白字符。
* 分离文章内容（Context）和问答对（QAs）。

**算子运行**：

```python
self.refiner.run(
    storage=self.storage.step(),
    input_key="vqa",          # 输入上一涉的原始文本
    output_key="context_vqa"  # 输出最终结构化数据
)

```

### 3. **输出数据**

最终，流水线生成的输出数据将包含以下内容：

* **image**：原始图像路径。
* **vqa**：VLM 生成的原始文本（中间结果）。
* **context_vqa**：结构化的最终结果，包含 `context`（文章）和 `qas`（问答列表）。

**输出数据示例**：

```json
{
    "id": 1,
    "image": "./images/landmark.jpg",
    "context_vqa": {
        "context": "The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris, France...",
        "qas": [
            {
                "question": "In which city is this structure located?",
                "answer": "Paris"
            },
            {
                "question": "What material is the tower primarily constructed from?",
                "answer": "wrought-iron"
            }
        ]
    }
}

```

---

## 4. 流水线示例

以下是完整的 `ContextVQAPipeline` 代码实现，支持命令行参数调用。

```python
import argparse
from dataflow.utils.storage import FileStorage
from dataflow.serving.local_model_vlm_serving import LocalModelVLMServing_vllm
from dataflow.operators.core_vision import FixPromptedVQAGenerator
from dataflow.operators.core_vision import WikiQARefiner

class ContextVQAPipeline:
    """
    一行命令即可完成图片批量 ContextVQA Caption 生成。
    """

    def __init__(
        self,
        model_path: str,
        *,
        hf_cache_dir: str | None = None,
        download_dir: str = "./ckpt",
        device: str = "cuda",
        first_entry_file: str = "dataflow/example/image_to_text_pipeline/capsbench_captions.jsonl",
        cache_path: str = "./cache_local_skvqa",
        file_name_prefix: str = "skvqa_cache_step",
        cache_type: str = "jsonl",
    ):
        # ---------- 1. Storage ----------
        self.storage = FileStorage(
            first_entry_file_name=first_entry_file,
            cache_path=cache_path,
            file_name_prefix=file_name_prefix,
            cache_type=cache_type,
        )

        # ---------- 2. Serving ----------
        self.serving = LocalModelVLMServing_vllm(
            hf_model_name_or_path=model_path,
            hf_cache_dir=hf_cache_dir,
            hf_local_dir=download_dir,
            vllm_tensor_parallel_size=1,
            vllm_temperature=0.7,
            vllm_top_p=0.9,
            vllm_max_tokens=512,
        )

        # ---------- 3. Operator ----------
        # 使用特定 Prompt 生成 Wiki 风格文章与问答
        self.vqa_generator = FixPromptedVQAGenerator(
            serving=self.serving,
            system_prompt="You are a helpful assistant.",
            user_prompt= """
            Write a Wikipedia article related to this image without directly referring to the image. Then write question answer pairs. The question answer pairs should satisfy the following criteria.
            1: The question should refer to the image.
            2: The question should avoid mentioning the name of the object in the image.
            3: The question should be answered by reasoning over the Wikipedia article.
            4: The question should sound natural and concise.
            5: The answer should be extracted from the Wikipedia article.
            6: The answer should not be any objects in the image.
            7: The answer should be a single word or phrase and list all correct answers separated by commas.
            8: The answer should not contain 'and', 'or', rather you can split them into multiple answers.
            """
        )

        # 结果清洗与结构化
        self.refiner = WikiQARefiner()

    # ------------------------------------------------------------------ #
    def forward(self):
        input_image_key = "image"
        output_answer_key = "vqa"
        output_wiki_key = "context_vqa"

        # 步骤 1: 生成原始文本
        self.vqa_generator.run(
            storage=self.storage.step(),
            input_image_key=input_image_key,
            output_answer_key=output_answer_key
        )

        # 步骤 2: 解析为结构化数据
        self.refiner.run(
            storage=self.storage.step(),
            input_key=output_answer_key,
            output_key=output_wiki_key
        )

# ---------------------------- CLI 入口 -------------------------------- #
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Batch SKVQA caption generation with DataFlow")

    parser.add_argument("--model_path", default="Qwen/Qwen2.5-VL-3B-Instruct")
    parser.add_argument("--hf_cache_dir", default="~/.cache/huggingface")
    parser.add_argument("--download_dir", default="./ckpt")
    parser.add_argument("--device", choices=["cuda", "cpu", "mps"], default="cuda")

    parser.add_argument("--images_file", default="dataflow/example/image_to_text_pipeline/capsbench_captions.jsonl")
    parser.add_argument("--cache_path", default="./cache_local")
    parser.add_argument("--file_name_prefix", default="context_vqa")
    parser.add_argument("--cache_type", default="jsonl")

    args = parser.parse_args()

    pipe = ContextVQAPipeline(
        model_path=args.model_path,
        hf_cache_dir=args.hf_cache_dir,
        download_dir=args.download_dir,
        device=args.device,
        first_entry_file=args.images_file,
        cache_path=args.cache_path,
        file_name_prefix=args.file_name_prefix,
        cache_type=args.cache_type,
    )
    pipe.forward()

```
