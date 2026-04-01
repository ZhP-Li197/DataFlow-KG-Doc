---
title: 图像定位思维链 (GCoT) 生成流水线
icon: mdi:image-text
createTime: 2026/01/11 20:44:55
permalink: /zh/mm_guide/image_gcot/
---
## 1. 概述

**图像定位思维链 (GCoT) 生成流水线** 旨在自动化生成**带视觉定位的思维链（Grounded Chain-of-Thought）**数据。该流水线通过多步推理，不仅生成回答问题的逻辑步骤，还将推理过程中提到的关键物体在图像中进行空间定位（Bounding Box），从而显著提升多模态数据的可解释性和精确度。

与传统方法不同，本流水线采用 **单一 VLM（如 Qwen2.5-VL）** 同时完成“推理”和“定位”任务，流程更加精简高效。

我们支持以下应用场景：

* **增强型多模态数据构建**：为 VQA 数据集增加解释性和定位标注。
* **复杂场景理解**：生成包含物体坐标的详细推理步骤。
* **模型推理能力训练**：构建数据以训练模型“言之有物”，减少幻觉。

流水线的主要流程包括：

1. **CoT 生成**：模型生成分步推理文本，并提取关键名词。
2. **关键词解析**：从生成的文本中清洗并提取待定位的关键词。
3. **视觉定位 (Grounding)**：模型针对提取的关键词生成边界框 (BBox)。
4. **信息注入**：将 BBox 坐标回填至推理文本中，形成最终的 GCoT。

---

## 2. 快速开始

### 第一步：准备工作目录

```bash
mkdir run_gcot
cd run_gcot

```

### 第二步：准备脚本

将下文“流水线示例”中的代码保存为 `image_gcot_pipeline.py`。

### 第三步：配置运行参数

确保你拥有支持定位能力的 VLM 模型（如 Qwen2.5-VL-7B-Instruct）。

```bash
# 安装依赖
pip install open-dataflow vllm

```

### 第四步：一键运行

```bash
python image_gcot_pipeline.py \
  --model_path "/path/to/Qwen2.5-VL-3B-Instruct" \
  --input_file "data/image_qa.jsonl"

```

---

## 3. 数据流与流水线逻辑

### 1. **输入数据**

该流程的输入数据通常是标准的 VQA 数据：

* **image**：图像文件路径。
* **question**：关于图像的问题。
* **answer**：问题的标准答案（用于辅助生成 CoT）。

**输入数据示例**：

```json
{
    "image": "./images/cat_dog.jpg",
    "question": "Is the cat looking at the dog?",
    "answer": "Yes"
}

```

### 2. **核心算子逻辑**

本流水线通过组合多个细粒度算子来实现复杂的 GCoT 生成逻辑：

#### A. **CoT 生成 (PromptTemplatedVQAGenerator)**

利用预设的 `GCOT_PROMPT_TEMPLATE`，引导模型生成“步骤化推理”和“关键词列表”。

* **Prompt 策略**：要求模型按 `Step 1: ...`, `Step 2: ...`, `Keywords: ...` 格式输出。
* **输出**：包含推理文本和关键词的原始字符串。

#### B. **文本清洗与提取 (FunctionalRefiner)**

使用自定义函数对上一步的输出进行解析：

* `extract_clean_cot_logic`：剥离关键词部分，保留纯净的 CoT 文本。
* `extract_keywords_logic`：解析 `Keywords:` 后的内容，生成 Python List。

#### C. **视觉定位 (VLMBBoxGenerator)**

针对提取出的每一个关键词，调用 VLM 的定位能力生成边界框。

* **输入**：图像 + 关键词列表。
* **输出**：关键词到边界框坐标的映射字典 (Map)。

#### D. **坐标注入 (FunctionalRefiner)**

使用 `inject_bboxes_logic` 函数，将生成的 BBox 坐标智能插入回原始 CoT 文本中对应的单词之后。

### 3. **输出数据**

最终，流水线生成的输出数据将包含以下关键字段：

* **raw_cot_output**：模型原始生成的文本。
* **cleaned_cot**：清洗后的纯推理文本。
* **bbox_mapping**：关键词与其坐标的映射。
* **gcot**：最终结果，包含坐标信息的推理链。

**输出数据示例 (gcot 字段)**：

```text
Step 1: Locate the cat [200, 300, 400, 500]. The cat is sitting on the left.
Step 2: Locate the dog [500, 300, 700, 500]. The dog is sleeping on the right.
Step 3: Observe their gaze. The cat is facing the dog.
Answer: Yes

```

---

## 4. 流水线示例

以下是完整的 `ImageGCoTPipeline` 代码实现。

```python
import re
from typing import List, Dict, Any
import argparse
import torch
from dataflow.utils.storage import FileStorage
from dataflow.serving.local_model_vlm_serving import LocalModelVLMServing_vllm

from dataflow.operators.core_vision import PromptTemplatedVQAGenerator, VLMBBoxGenerator
from dataflow.operators.core_text import FunctionalRefiner
from dataflow.prompts.prompt_template import NamedPlaceholderPromptTemplate

# 定义 Prompt 模板，强制模型输出推理步骤和关键词
GCOT_PROMPT_TEMPLATE = (
    "Question: {question}\n"
    "Answer: {answer}\n\n"
    "Task: Provide a detailed step-by-step reasoning (Chain-of-Thought) that explains "
    "how to arrive at this answer based on the image.\n"
    "Then, extract key nouns and objects mentioned in your reasoning that are "
    "visible in the image and can be spatially located.\n\n"
    "Format:\n"
    "Step 1: ...\n"
    "Step 2: ...\n"
    "Answer: {answer}\n"
    "Keywords: object1, object2\n"
)

DEFAULT_BBOX_PROMPT = 'Detect "{keyword}".'

# ----------------- 辅助逻辑函数 ----------------- #

def _parse_base(text: str) -> Dict[str, Any]:
    """基础解析逻辑：分离 CoT 文本和 Keywords 行"""
    if not text: return {"cot": "", "keywords": []}
    lines = text.split('\n')
    cot_lines = []
    keywords = []
    for line in lines:
        if line.strip().lower().startswith('keywords:'):
            keyword_str = line.split(':', 1)[-1].strip()
            # 简单的分词处理
            raw_kws = [kw.strip().strip('.,;:!?"\'') for kw in keyword_str.replace(';', ',').split(',')]
            keywords = [k for k in raw_kws if k]
        else:
            cot_lines.append(line)
    return {"cot": '\n'.join(cot_lines).strip(), "keywords": keywords}

def extract_clean_cot_logic(text: str) -> str:
    return _parse_base(text)["cot"]

def extract_keywords_logic(text: str) -> List[str]:
    return _parse_base(text)["keywords"]

def inject_bboxes_logic(cot_text: str, bbox_map: Dict[str, List[str]]) -> str:
    """将 BBox 注入回 CoT 文本"""
    if not cot_text or not bbox_map: return cot_text
    # 优先匹配长词，避免子串误匹配
    sorted_keywords = sorted(bbox_map.keys(), key=lambda x: len(x), reverse=True)
    result_text = cot_text
    replaced = set()
    
    for keyword in sorted_keywords:
        if keyword in replaced: continue
        # 简单策略：只在 'Answer:' 之前注入，防止破坏答案区
        answer_pos = result_text.find('Answer:')
        search_limit = answer_pos if answer_pos != -1 else len(result_text)
        
        # 大小写不敏感查找
        pos = result_text.lower().find(keyword.lower(), 0, search_limit)
        if pos == -1: continue
        
        boxes = bbox_map[keyword] # List[str]
        box_str = "".join(boxes)
        # 替换：保留原词，追加 Box
        replacement = f"{keyword} {box_str}"
        
        result_text = result_text[:pos] + replacement + result_text[pos + len(keyword):]
        replaced.add(keyword)
    return result_text

# ----------------- 流水线定义 ----------------- #

class ImageGCoTPipeline:
    def __init__(
        self,
        model_path: str,
        *,
        first_entry_file: str,
        cache_path: str = "./cache_gcot",
        file_name_prefix: str = "gcot",
        # Keys 配置
        question_key: str = "question",
        answer_key: str = "answer",
        image_key: str = "image",
        output_key: str = "gcot",
        vllm_max_tokens: int = 512
    ):
        # 1. 存储初始化
        self.storage = FileStorage(
            first_entry_file_name=first_entry_file,
            cache_path=cache_path,
            file_name_prefix=file_name_prefix,
            cache_type="jsonl"
        )
        
        # 2. 模型服务 (单一模型)
        self.vlm_serving = LocalModelVLMServing_vllm(
            hf_model_name_or_path=model_path,
            vllm_tensor_parallel_size=1,
            vllm_temperature=0.7,
            vllm_max_tokens=vllm_max_tokens
        )
        
        self.keys = {
            "q": question_key,
            "a": answer_key,
            "img": image_key,
            "raw_cot": "raw_cot_output",
            "clean_cot": "cleaned_cot",
            "keywords": "extracted_keywords",
            "bbox_map": "bbox_mapping",
            "final": output_key
        }

        # 3. 算子链配置
        
        # Step A: 生成 CoT 和 Keywords
        self.op_gen_cot = PromptTemplatedVQAGenerator(
            serving=self.vlm_serving,
            system_prompt="You are a helpful assistant.",
            prompt_template=NamedPlaceholderPromptTemplate(template=GCOT_PROMPT_TEMPLATE)
        )
        
        # Step B: 解析清洗 CoT
        self.op_extract_cot = FunctionalRefiner(func=extract_clean_cot_logic)
        
        # Step C: 解析 Keywords
        self.op_extract_kws = FunctionalRefiner(func=extract_keywords_logic)

        # Step D: 生成 BBox (Grounding)
        self.op_bbox_gen = VLMBBoxGenerator(
            serving=self.vlm_serving,
            prompt_template=DEFAULT_BBOX_PROMPT
        )
        
        # Step E: 注入 BBox 到 CoT
        self.op_inject = FunctionalRefiner(func=inject_bboxes_logic)

    def forward(self):
        print(">>> [Pipeline] Step 1: Generating CoT...")
        self.op_gen_cot.run(
            self.storage.step(),
            input_image_key=self.keys["img"],
            output_answer_key=self.keys["raw_cot"],
            question=self.keys["q"],
            answer=self.keys["a"]
        )
        
        print(">>> [Pipeline] Step 2: Parsing Outputs...")
        self.op_extract_cot.run(
            self.storage.step(),
            output_key=self.keys["clean_cot"],
            text=self.keys["raw_cot"]
        )
        self.op_extract_kws.run(
            self.storage.step(),
            output_key=self.keys["keywords"],
            text=self.keys["raw_cot"]
        )
        
        print(">>> [Pipeline] Step 3: Generating BBoxes (Grounding)...")
        self.op_bbox_gen.run(
            self.storage.step(),
            input_image_key=self.keys["img"],
            input_kws_key=self.keys["keywords"],
            output_key=self.keys["bbox_map"]
        )
        
        print(">>> [Pipeline] Step 4: Injecting GCoT...")
        self.op_inject.run(
            self.storage.step(),
            output_key=self.keys["final"],
            cot_text=self.keys["clean_cot"],
            bbox_map=self.keys["bbox_map"]
        )
        
        print(f">>> [Pipeline] Done. Final GCoT saved to: {self.keys['final']}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input_file", default="dataflow/example/image_to_text_pipeline/image_qa_result.jsonl")
    parser.add_argument("--model_path", default="Qwen/Qwen2.5-VL-3B-Instruct")
    
    args = parser.parse_args()
    
    pipe = ImageGCoTPipeline(
        model_path=args.model_path,
        first_entry_file=args.input_file
    )
    pipe.forward()

```
