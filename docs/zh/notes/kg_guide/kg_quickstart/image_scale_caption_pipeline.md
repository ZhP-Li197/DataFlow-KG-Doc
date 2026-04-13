---
title: ScaleCap 高密度描述生成流水线
createTime: 2026/01/11 22:08:57
icon: mdi:image-text
permalink: /zh/mm_guide/image_scale_caption_pipeline/
---

## 1. 概述

**ScaleCap 高密度描述生成流水线 (Image Scale Caption Pipeline)** 是一种基于**“生成-验证-扩展-融合”**范式的先进图像描述生成方案。该流水线旨在生成**信息密度极高**且**幻觉率极低**的图像描述，特别适用于需要深度理解图像细节的场景。

该方法的理论基础源自论文 *ScaleCap: Inference-Time Scalable Image Captioning via Dual-Modality Debiasing*。它通过多轮对话和视觉自检（Visual Grounding），逐步挖掘图像中的对象与位置细节，并过滤掉模型产生的幻觉。

我们支持以下应用场景：

* **高质量多模态数据集构建**：生成比普通 Caption 更详尽、准确的训练数据。
* **细粒度图像检索**：提供包含丰富细节的索引文本。
* **盲人辅助/图像无障碍**：生成“所见即所得”的详细解说。

流水线的主要流程包括：

1. **初稿生成**：VLM 生成基础描述。
2. **视觉自检 (Debiasing)**：将描述拆分为句子，逐句验证其是否被图像证据支持（Visual Grounding）。
3. **细节追问**：针对通过验证的“黄金句子”，生成关于对象属性和位置的追问。
4. **回答与再验证**：VLM 回答追问，并再次进行视觉自检以过滤错误细节。
5. **最终融合**：将所有经过验证的信息融合成一段连贯的长描述。

---

## 2. 快速开始

### 第一步：准备工作目录

```bash
mkdir run_scalecap
cd run_scalecap

```

### 第二步：准备脚本

将下文“流水线示例”中的代码保存为 `scalecap_pipeline.py`。

### 第三步：配置运行参数

确保 VLM 模型（如 Qwen2.5-VL）路径正确。

```bash
# 安装依赖
pip install open-dataflow vllm

```

### 第四步：一键运行

```bash
python scalecap_pipeline.py \
  --model_path "/path/to/Qwen2.5-VL-3B-Instruct" \
  --input_jsonl "data/images.jsonl" \
  --output_key "final_caption"

```

---

## 3. 数据流与流水线逻辑

### 1. **输入数据**

输入数据非常简单，仅需图像路径：

* **image**：图像文件路径。

**输入数据示例**：

```json
{
    "image": "./images/complex_scene.jpg"
}

```

### 2. **核心算子逻辑**

该流水线是多个原子算子的复杂编排：

#### A. **初稿生成 (PromptedVQAGenerator)**

* **功能**：使用基础 Prompt 生成图像的初步描述 (`init_caption`)。

#### B. **视觉自检 (VisualGroundingRefiner)**

* **功能**：这是 ScaleCap 的核心防幻觉机制。
* **逻辑**：
1. 使用 `split_sentences` 将初稿拆分为单句。
2. 调用 VLM 询问：“Given the image, is the description '{text}' directly supported by visual evidence?”。
3. 仅保留回答为 "Yes" 的句子，形成 **"Golden Sentences"**。



#### C. **问题生成与解析 (PromptTemplatedQAGenerator)**

* **功能**：基于 Golden Sentences，利用 LLM 能力生成针对性的追问。
* **逻辑**：模型生成如 "Describe more details about the [Object]" 的文本，并通过 `parse_questions_logic` 自动扩展为**对象细节**和**位置关系**两类问题。

#### D. **批量回答与二次过滤 (BatchVQAGenerator & Refiner)**

* **功能**：挖掘图像深层信息。
* **逻辑**：
1. 使用 `BatchVQAGenerator` 一次性让 VLM 回答上述生成的所有问题。
2. 再次使用 `VisualGroundingRefiner` 检查这些新生成的细节是否准确。
3. 保留可靠的细节信息 (`final_details`)。



#### E. **最终融合 (PromptTemplatedQAGenerator)**

* **功能**：将“黄金句子”和“验证后的细节”重写为一段流畅的文本。
* **输出**：`final_caption`。

### 3. **输出数据**

输出数据记录了流水线的全过程，方便调试和分析：

* **init_caption**：原始生成的初稿。
* **golden_sentences**：通过第一次自检的句子列表。
* **q_list**：生成的追问列表。
* **final_details**：通过第二次自检的细节回答。
* **final_caption**：最终的高密度描述。

**输出数据示例**：

```json
{
    "image": "./images/complex_scene.jpg",
    "init_caption": "A dog sitting on a bench.",
    "golden_sentences": ["A dog is sitting on a wooden bench."],
    "q_list": ["Describe more details about the dog.", "Describe position of the bench."],
    "final_details": ["The dog is a Golden Retriever with a red collar.", "The bench is located in a park."],
    "final_caption": "A Golden Retriever with a red collar is sitting on a wooden bench located in a park..."
}

```

---

## 4. 流水线示例

以下是完整的 `ImageScaleCaptionPipeline` 代码实现。

```python
import re
import argparse
from typing import Callable, Any, List

from dataflow.utils.storage import FileStorage
from dataflow.serving.local_model_vlm_serving import LocalModelVLMServing_vllm
from dataflow.prompts.prompt_template import NamedPlaceholderPromptTemplate
from dataflow.prompts.image import ImageScaleCaptionPrompt
from dataflow.operators.core_vision import PromptedVQAGenerator, BatchVQAGenerator, VisualGroundingRefiner
from dataflow.operators.core_text import PromptTemplatedQAGenerator, FunctionalRefiner

class ImageScaleCaptionPipeline:
    def __init__(
        self,
        model_path: str,
        *,
        hf_cache_dir: str | None = None,
        download_dir: str = "./ckpt/models",
        device: str = "cuda",
        # Storage params
        first_entry_file: str = "images.jsonl",
        cache_path: str = "./cache_scalecap",
        file_name_prefix: str = "scalecap",
        cache_type: str = "jsonl",
        # Keys
        input_image_key: str = "image",
        output_key: str = "final_caption",
        # VLLM Config
        vllm_tensor_parallel_size: int = 1,
        vllm_temperature: float = 0.7,
        vllm_top_p: float = 0.9,
        vllm_max_tokens: int = 512,
    ):
        # 1. Storage
        self.storage = FileStorage(
            first_entry_file_name=first_entry_file,
            cache_path=cache_path,
            file_name_prefix=file_name_prefix,
            cache_type=cache_type,
        )

        # 2. Serving
        self.serving = LocalModelVLMServing_vllm(
            hf_model_name_or_path=model_path,
            hf_cache_dir=hf_cache_dir,
            hf_local_dir=download_dir,
            vllm_tensor_parallel_size=vllm_tensor_parallel_size,
            vllm_temperature=vllm_temperature,
            vllm_top_p=vllm_top_p,
            vllm_max_tokens=vllm_max_tokens,
        )

        # 3. Prompts
        self.prompts_db = ImageScaleCaptionPrompt().build_prompt()

        # 4. Keys
        self.input_image_key = input_image_key
        self.output_key = output_key

        # ================== Operator Initialization ==================

        # --- Step A: Generate Init Caption ---
        self.refine_const_prompt = FunctionalRefiner(func=lambda: self.prompts_db["VLM_PROMPT_1"])
        self.gen_init_caption = PromptedVQAGenerator(
            serving=self.serving,
            system_prompt="You are a helpful assistant."
        )

        # --- Step B: Refine Golden Sentences ---
        self.refine_split = FunctionalRefiner(func=split_sentences)
        # 视觉自检 (保留 Yes 的句子)
        self.refine_golden = VisualGroundingRefiner(
            serving=self.serving,
            prompt_template="Given the image, is the description '{text}' directly supported by visual evidence? Answer strictly yes or no."
        )

        # --- Step C: Generate Questions ---
        self.refine_join = FunctionalRefiner(func=join_list)
        tpl_q = NamedPlaceholderPromptTemplate(
            template=self.prompts_db["LLM_PROMPT_1"], 
            join_list_with="\n"
        )
        self.gen_questions_text = PromptTemplatedQAGenerator(
            serving=self.serving,
            prompt_template=tpl_q
        )
        self.refine_parse_qs = FunctionalRefiner(func=parse_questions_logic)

        # --- Step D: Generate Answers ---
        self.gen_answers = BatchVQAGenerator(serving=self.serving)
        self.refine_answers = VisualGroundingRefiner(
            serving=self.serving,
            prompt_template="Given the image, is the statement '{text}' grounded in the image and not generic? Answer strictly yes or no."
        )

        # --- Step E: Integrate Final Caption ---
        tpl_final = NamedPlaceholderPromptTemplate(
            template=self.prompts_db["LLM_PROMPT_4"], 
            join_list_with="\n"
        )
        self.gen_final_caption = PromptTemplatedQAGenerator(
            serving=self.serving,
            prompt_template=tpl_final
        )

    def forward(self):
        print(">>> [Pipeline] Step 0: Preparing Prompts...")
        self.refine_const_prompt.run(
            self.storage.step(), 
            output_key="init_prompt"
        )

        print(">>> [Pipeline] Step 1: Generating Initial Caption...")
        self.gen_init_caption.run(
            self.storage.step(),
            input_prompt_key="init_prompt",
            input_image_key=self.input_image_key,
            output_answer_key="init_caption"
        )

        print(">>> [Pipeline] Step 2: Refining Golden Sentences...")
        self.refine_split.run(
            self.storage.step(), 
            output_key="sentences", 
            text="init_caption"
        )
        self.refine_golden.run(
            self.storage.step(), 
            input_list_key="sentences", 
            input_image_key=self.input_image_key, 
            output_key="golden_sentences"
        )

        print(">>> [Pipeline] Step 3: Generating Details Questions...")
        self.refine_join.run(
            self.storage.step(), 
            output_key="golden_str", 
            data="golden_sentences"
        )
        self.gen_questions_text.run(
            self.storage.step(), 
            output_answer_key="raw_q_text", 
            sentence="golden_str"
        )
        self.refine_parse_qs.run(
            self.storage.step(), 
            output_key="q_list", 
            text="raw_q_text"
        )

        print(">>> [Pipeline] Step 4: Generating & Filtering Answers...")
        self.gen_answers.run(
            self.storage.step(), 
            input_prompts_key="q_list", 
            input_image_key=self.input_image_key, 
            output_key="raw_answers"
        )
        self.refine_answers.run(
            self.storage.step(), 
            input_list_key="raw_answers", 
            input_image_key=self.input_image_key, 
            output_key="final_details"
        )

        print(">>> [Pipeline] Step 5: Integrating Final Caption...")
        self.refine_join.run(
            self.storage.step(), 
            output_key="details_str", 
            data="final_details"
        )
        self.gen_final_caption.run(
            self.storage.step(),
            output_answer_key=self.output_key,
            context="golden_str",
            object_info="details_str",
            position_info="details_str"
        )

        print(f">>> [Pipeline] All Done. Result saved to: {self.storage.cache_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ScaleCap Dense Captioning Pipeline")
    
    parser.add_argument("--model_path", default="Qwen/Qwen2.5-VL-3B-Instruct")
    parser.add_argument("--hf_cache_dir", default="~/.cache/huggingface")
    parser.add_argument("--download_dir", default="./ckpt/models")
    parser.add_argument("--device", default="cuda")

    parser.add_argument("--input_jsonl", default="./dataflow/example/image_to_text_pipeline/capsbench_captions.jsonl")
    parser.add_argument("--cache_path", default="./cache_scalecap_results")
    parser.add_argument("--file_name_prefix", default="scalecap")
    parser.add_argument("--input_image_key", default="image")
    parser.add_argument("--output_key", default="final_caption")

    parser.add_argument("--tp", type=int, default=1)
    parser.add_argument("--max_tokens", type=int, default=1024)

    args = parser.parse_args()

    pipe = ImageScaleCaptionPipeline(
        model_path=args.model_path,
        hf_cache_dir=args.hf_cache_dir,
        download_dir=args.download_dir,
        device=args.device,
        first_entry_file=args.input_jsonl,
        cache_path=args.cache_path,
        file_name_prefix=args.file_name_prefix,
        input_image_key=args.input_image_key,
        output_key=args.output_key,
        vllm_tensor_parallel_size=args.tp,
        vllm_max_tokens=args.max_tokens
    )
    
    pipe.forward()

```
