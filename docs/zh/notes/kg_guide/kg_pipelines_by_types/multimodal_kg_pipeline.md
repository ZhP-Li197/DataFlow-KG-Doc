---
title: 多模态知识图谱流水线
createTime: 2026/04/15 18:10:00
permalink: /zh/kg_guide/multimodal_kg_pipeline/
icon: carbon:chart-network
---

# 多模态知识图谱流水线

## 1. 概述

**多模态知识图谱流水线**面向“文本 + 图片”联合建图与问答生成场景。它先从文本中抽取实体和文本三元组，再从图片中抽取视觉三元组，随后围绕实体采样多模态子图，并基于子图和图片生成 QA 对。

该流水线适合以下任务：

- 从文本和图片中联合构建多模态 KG
- 生成带视觉证据的子图问答样本
- 为多模态图谱问答或评测准备训练数据
- 在文档页、新闻图文、图文报告等场景中做图谱增强

主要阶段包括：

1. **文本实体抽取**：从 `raw_chunk` 中识别候选实体。
2. **文本三元组抽取**：基于实体候选抽取文本关系。
3. **视觉三元组抽取**：根据图片和实体候选抽取 `depicted_in` 类视觉关系。
4. **多模态子图采样**：把文本关系、视觉关系和图片 URL 组织成多模态子图。
5. **QA 对生成**：根据子图和图片生成多模态 QA 对。

---

## 2. 快速开始

### 第一步：创建新的 DataFlow 工作目录

```bash
mkdir run_dataflow_kg
cd run_dataflow_kg
```

### 第二步：准备输入文件

将下述示例保存为 `mmkg_demo.json`。其中 `img_dict` 的 value 需要是本地可访问的图片路径。

```json
[
  {
    "raw_chunk": "Tesla unveiled the Cybertruck at a product event. Elon Musk appeared on stage and the presentation slide showed the vehicle design.",
    "img_dict": {
      "img_0": "./images/cybertruck.jpg",
      "img_1": "./images/elon_musk.jpg"
    }
  }
]
```

### 第三步：保存脚本并配置环境变量

将下方“流水线实例”中的代码保存为 `multimodal_kg_pipeline.py`，并配置：

```bash
export DF_API_KEY=sk-xxxx
export DF_MMKG_INPUT_FILE=./mmkg_demo.json
```

如果需要调整文本模型、视觉模型或采样 hop，可以修改以下参数：

```python
llm_serving = APILLMServing_request(
    api_url="https://api.openai.com/v1/chat/completions",
    key_name_of_api_key="DF_API_KEY",
    model_name="gpt-4o-mini",
    max_workers=6,
    temperature=0.0,
)

vlm_serving = APIVLMServing_openai(
    api_url="https://api.openai.com/v1",
    key_name_of_api_key="DF_API_KEY",
    model_name="o4-mini",
    max_workers=4,
    temperature=0.0,
)
```

### 第四步：运行脚本

```bash
python multimodal_kg_pipeline.py
```

---

## 3. 数据流和流水线逻辑

### 1. 输入数据

该流水线至少需要以下字段：

- **raw_chunk**：原始文本，用于实体和文本三元组抽取。
- **img_dict**：图片字典，key 为图片 ID，value 为本地图片路径。

输入示例如下：

```json
[
  {
    "raw_chunk": "Tesla unveiled the Cybertruck at a product event. Elon Musk appeared on stage and the presentation slide showed the vehicle design.",
    "img_dict": {
      "img_0": "./images/cybertruck.jpg",
      "img_1": "./images/elon_musk.jpg"
    }
  }
]
```

需要注意，当前 `MMKGEntityBasedSubgraphSampling` 更适合以**单条原始记录**为起点展开，因为它会把一个样本中的不同实体拆成多条子图记录再写回缓存。

### 2. 多模态知识图谱流水线逻辑（MultimodalKGPipeline）

#### 步骤 1：文本实体抽取（KGEntityExtraction）

**功能：**

- 从文本中抽取候选实体
- 输出逗号分隔的实体字符串，为后续文本与视觉抽取共享

**输入**：`raw_chunk`  
**输出**：`entity`

#### 步骤 2：文本三元组抽取（KGTripleExtraction）

**功能：**

- 基于 `raw_chunk` 和 `entity` 抽取文本关系三元组
- 形成多模态图谱中的文本边

**输入**：`raw_chunk`、`entity`  
**输出**：`triple`

#### 步骤 3：视觉三元组抽取（MMKGVisualTripleExtraction）

**功能：**

- 结合图片与候选实体抽取视觉事实
- 输出格式通常为 `"<subj> 实体 <rel> depicted_in <obj> 图片ID"`

**输入**：`img_dict`、`entity`  
**输出**：`vis_triple`

#### 步骤 4：多模态子图采样（MMKGEntityBasedSubgraphSampling）

**功能：**

- 综合 `triple`、`vis_triple` 和 `img_dict`
- 按实体采样文本-视觉混合子图
- 输出子图、关联视觉三元组以及对应图片 URL

**输入**：`triple`、`vis_triple`、`img_dict`  
**输出**：`subgraph`、`vis_triple`、`vis_url`

#### 步骤 5：QA 对生成（MMKGSubgraphBaseQAGeneration）

**功能：**

- 根据子图与图片生成多模态 QA 对
- 适合直接作为训练数据或评测数据的上游生成器

**输入**：`vis_url`、`subgraph`、`vis_triple`  
**输出**：`QA_pairs`

### 3. 输出数据

常见输出字段包括：

- **entity**：文本抽取的候选实体
- **triple**：文本三元组
- **vis_triple**：视觉三元组
- **subgraph**：采样后的多模态子图
- **vis_url**：子图关联的图片路径列表
- **QA_pairs**：生成出的问答对

示例输出如下：

```json
{
  "entity": "Tesla, Cybertruck, Elon Musk",
  "triple": [
    "<subj> Tesla <obj> Cybertruck <rel> unveils",
    "<subj> Elon Musk <obj> Tesla <rel> presents_for"
  ],
  "vis_triple": [
    "<subj> Cybertruck <rel> depicted_in <obj> img_0",
    "<subj> Elon Musk <rel> depicted_in <obj> img_1"
  ],
  "subgraph": [
    "<subj> Tesla <obj> Cybertruck <rel> unveils",
    "<subj> Elon Musk <obj> Tesla <rel> presents_for"
  ],
  "vis_url": [
    "./images/cybertruck.jpg"
  ],
  "QA_pairs": [
    {
      "question": "What vehicle is shown in the event image?",
      "answer": "Cybertruck."
    }
  ]
}
```

---

## 4. 流水线实例

以下是完整的 `MultimodalKGPipeline` 代码实现。

```python
import os

from dataflow.core import LLMServingABC
from dataflow.operators.general_kg.generate.kg_entity_extractor import (
    KGEntityExtraction,
)
from dataflow.operators.general_kg.generate.kg_triple_extractor import (
    KGTripleExtraction,
)
from dataflow.operators.multi_model_kg import (
    MMKGEntityBasedSubgraphSampling,
    MMKGSubgraphBaseQAGeneration,
    MMKGVisualTripleExtraction,
)
from dataflow.pipeline import PipelineABC
from dataflow.serving import APILLMServing_request, APIVLMServing_openai
from dataflow.utils.storage import FileStorage


class MultimodalKGPipeline(PipelineABC):
    """Multimodal KG pipeline: text triples + visual triples -> subgraphs -> QA pairs."""

    def __init__(
        self,
        first_entry_file_name: str,
        llm_serving: LLMServingABC,
        vlm_serving: LLMServingABC,
        cache_path: str = "./cache_local",
        file_name_prefix: str = "multimodal_kg_pipeline_step",
        cache_type: str = "json",
        lang: str = "en",
        triple_type: str = "relation",
        sampling_type: str = "hop",
        subgraph_hop: int = 2,
        quality_threshold: int = 3,
    ):
        super().__init__()
        if llm_serving is None:
            raise ValueError("llm_serving is required for MultimodalKGPipeline")
        if vlm_serving is None:
            raise ValueError("vlm_serving is required for MultimodalKGPipeline")

        self.storage = FileStorage(
            first_entry_file_name=first_entry_file_name,
            cache_path=cache_path,
            file_name_prefix=file_name_prefix,
            cache_type=cache_type,
        )
        self.sampling_type = sampling_type
        self.subgraph_hop = subgraph_hop

        self.entity_extraction_step1 = KGEntityExtraction(
            llm_serving=llm_serving,
            lang=lang,
        )
        self.text_triple_extraction_step2 = KGTripleExtraction(
            llm_serving=llm_serving,
            triple_type=triple_type,
            lang=lang,
        )
        self.visual_triple_extraction_step3 = MMKGVisualTripleExtraction(
            llm_serving=vlm_serving,
            quality_threshold=quality_threshold,
            lang=lang,
        )
        self.subgraph_sampling_step4 = MMKGEntityBasedSubgraphSampling(
            llm_serving=llm_serving,
            lang=lang,
        )
        self.qa_generation_step5 = MMKGSubgraphBaseQAGeneration(
            llm_serving=vlm_serving,
            lang=lang,
        )

    def forward(self):
        self.entity_extraction_step1.run(
            storage=self.storage.step(),
            input_key="raw_chunk",
            output_key="entity",
        )
        self.text_triple_extraction_step2.run(
            storage=self.storage.step(),
            input_key="raw_chunk",
            input_key_meta="entity",
            output_key="triple",
        )
        self.visual_triple_extraction_step3.run(
            storage=self.storage.step(),
            input_key="img_dict",
            input_key_meta="entity",
            output_key="vis_triple",
        )
        self.subgraph_sampling_step4.run(
            storage=self.storage.step(),
            input_key="triple",
            output_key="subgraph",
            vis_triple_key="vis_triple",
            sampling_type=self.sampling_type,
            hop=self.subgraph_hop,
        )
        self.qa_generation_step5.run(
            storage=self.storage.step(),
            input_key="vis_url",
            input_key_meta="subgraph",
            output_key="QA_pairs",
        )


if __name__ == "__main__":
    input_file = os.environ.get("DF_MMKG_INPUT_FILE", "")
    if not input_file:
        raise ValueError(
            "Set DF_MMKG_INPUT_FILE to a JSON file containing `raw_chunk` and `img_dict`."
        )

    llm_serving = APILLMServing_request(
        api_url="https://api.openai.com/v1/chat/completions",
        key_name_of_api_key="DF_API_KEY",
        model_name="gpt-4o-mini",
        max_workers=6,
        temperature=0.0,
    )
    vlm_serving = APIVLMServing_openai(
        api_url="https://api.openai.com/v1",
        key_name_of_api_key="DF_API_KEY",
        model_name="o4-mini",
        max_workers=4,
        temperature=0.0,
    )

    pipeline = MultimodalKGPipeline(
        first_entry_file_name=input_file,
        llm_serving=llm_serving,
        vlm_serving=vlm_serving,
        cache_path="./cache_mmkg",
        lang="en",
        sampling_type="hop",
        subgraph_hop=2,
    )
    pipeline.forward()
```
