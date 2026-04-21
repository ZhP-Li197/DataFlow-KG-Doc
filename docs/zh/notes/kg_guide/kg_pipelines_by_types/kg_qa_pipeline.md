---
title: 知识图谱问答流水线 (KG QA Pipeline)
createTime: 2026/04/21 17:05:00
permalink: /zh/kg_guide/kg_qa_pipeline/
icon: solar:document-text-outline
---

# 知识图谱问答流水线

## 1. 概述

**知识图谱问答流水线 (KGQA_APIPipeline)** 面向“给定自然语言纯文本，全自动构建知识图谱并生成及评估高质量问答对”的端到端场景。它从非结构化文本出发，依次进行实体识别、关系三元组抽取、图谱构建与降噪，再通过子图采样与密度过滤筛选出高质量知识子图，最后基于子图生成问答对（QA pairs）并进行语言自然度评估。

该流水线适合以下任务：

- 从非结构化文本到结构化图谱的全链路构建
- 构建基于知识图谱的问答数据集（KG-QA Dataset）
- 提取特定跳数（如 2-hop）与规模的连通子图
- 自动化过滤低质量/稀疏图谱，控制大模型问答生成的质量与幻觉问题

流水线的主要阶段包括：

1. **实体抽取**：从文本中提取关键实体。
2. **三元组抽取与去重**：结合文本和实体提取关系三元组，并进行去重清洗。
3. **子图采样**：基于实体进行多跳子图采样。
4. **子图规模评估与过滤**：计算子图的节点数、边数和密度，并按密度区间进行过滤。
5. **子图问答生成**：基于过滤后的高质量子图生成指定类型和数量的问答对。
6. **问答自然度评估**：对生成的问答对进行自然度和语言质量评估。

---

## 2. 快速开始

### 步骤 1：创建新的 DataFlow 工作目录

```bash
mkdir run_dataflow_kg
cd run_dataflow_kg
```

### 步骤 2：初始化流水线代码和默认数据

```bash
dfkg init
```

初始化后会生成：

- 流水线脚本：`api_pipelines/kg_qa_pipeline.py`
- 默认数据：`example/kg_qa_pipeline_input.json`

### 步骤 3：配置 API Key

该流水线默认使用 `gpt-4o`。你需要配置 OpenAI 的 API 密钥（具体的环境变量名视你底层的 `APILLMServing_request` 实现而定，通常为 `DF_API_KEY` 或类似设定）：

```bash
export DF_API_KEY=sk-xxxx
```

### 步骤 4：一键运行

```bash
python api_pipelines/kg_qa_pipeline.py
```

---

## 3. 数据流和流水线逻辑

### 3.1 输入数据

该流水线至少需要输入纯文本列表，数据保存在 `kg_qa_pipeline_input.json` 中：

- **text**: 原始自然语言文本列表。

输入示例如下：

```json
[
  {
    "text": "Marie Curie studied at the University of Paris. Pierre Curie collaborated with Marie Curie. Marie Curie discovered radium with Pierre Curie."
  },
  {
    "text": "Ada Lovelace worked with Charles Babbage on the Analytical Engine. Charles Babbage designed the Analytical Engine. Ada Lovelace wrote detailed notes about the machine."
  },
  {
    "text": "The Nile flows through Egypt. Cairo is the capital of Egypt. Alexandria is a major city in Egypt."
  }
]
```

### 3.2 知识图谱问答流水线逻辑（KGQA_APIPipeline）

#### 步骤 1：实体抽取（KGEntityExtraction）
**功能：** 基于大模型从纯文本中识别和提取关键实体。
**输入**：`text`  
**输出**：`entity`

#### 步骤 2：三元组抽取（KGTripleExtraction）
**功能：** 结合原文本和上一步提取出的实体，抽取图谱关系三元组（`triple_type="relation"`）。
**输入**：`text`, `entity` (作为 meta 信息)  
**输出**：`triple`

#### 步骤 3：三元组去重（KGTupleRemoveRepeated）
**功能：** 清洗并移除重复的三元组数据，保证图谱纯净度。
**输入**：`triple`  
**输出**：`triple`

#### 步骤 4：子图采样（KGEntityBasedSubgraphSampling）
**功能：** 在去重后的三元组图谱中，基于实体进行特定跳数的子图游走与采样（如 `hop=2`, `M=5`）。
**输入**：`triple`  
**输出**：`subgraph`

#### 步骤 5：子图规模评估（KGSubgraphScaleEvaluator）
**功能：** 评估生成的子图规模，计算出节点数、边数和图密度。
**输入**：`subgraph`  
**输出**：`num_nodes`, `num_edges`, `density`

#### 步骤 6：子图规模过滤（KGSubgraphScaleFilter）
**功能：** 基于计算出的密度阈值（`min_score=0.1`, `max_score=1.0`）对子图进行过滤，剔除过于稀疏或异常的图谱。
**输入**：`subgraph`, `density`

#### 步骤 7：子图问答生成（KGRelationTripleSubgraphQAGeneration）
**功能：** 基于过滤后的高质量子图，调用大模型生成数值型问答对（`qa_type="num"`, `num_q=5`）。
**输入**：`subgraph`  
**输出**：`QA_pairs`

#### 步骤 8：问答自然度评估（KGQANaturalEvaluator）
**功能：** 对生成的问答对进行自然度、流畅性的大模型自动评估。
**输入**：`QA_pairs`  
**输出**：`naturalness_scores`

### 3.3 输出数据

运行结束后，`./cache_local` 的对应执行步骤文件中将逐步产生如下关键字段：

- **entity**：提取出的实体列表。
- **triple**：去重后的关系三元组。
- **subgraph**：经过采样和密度过滤的图谱。
- **num_nodes / num_edges / density**：图谱规模与密度指标。
- **QA_pairs**：基于图谱生成的问答对集合。
- **naturalness_scores**：每个问答对自然度评价打分。

示例输出概念（实际结构取决于具体的算子底层实现）：

```json
{
    "subgraph":[
        "<subj> Marie Curie <obj> University Paris <rel> studied_at",
        "<subj> Pierre Curie <obj> Marie Curie <rel> collaborated_with",
        "<subj> Marie Curie <obj> Pierre Curie <rel> collaborated_with",
        "<subj> Marie Curie <obj> radium <rel> discovered",
        "<subj> Pierre Curie <obj> radium <rel> discovered"
    ],
    "num_nodes":4,
    "num_edges":5,
    "density":0.4166666667,
    "QA_pairs":[
        {
        "question":"How many individuals collaborated with Marie Curie and also discovered radium?",
        "answer":1
        },
        {
        "question":"How many unique entities did Marie Curie have a relationship with, according to the triples?",
        "answer":3
        },
        {
        "question":"What is the total number of collaborative relationships involving Marie Curie and Pierre Curie?",
        "answer":2
        },
        {
        "question":"How many entities are associated with the discovery of radium?",
        "answer":2
        },
        {
        "question":"What is the difference between the number of entities Marie Curie collaborated with and the number of entities she discovered radium with?",
        "answer":1
        }
    ],
    "naturalness_scores":[
        0.5,
        0,
        0.5,
        0.5,
        0.5
    ]
}
```

---

## 4. 流水线实例

以下为 `kg_qa_pipeline.py` 的完整代码结构：

```python
from dataflow.serving import APILLMServing_request
from dataflow.utils.storage import FileStorage

from dataflow.operators.general_kg.eval.kg_qa_natural_eval import KGQANaturalEvaluator
from dataflow.operators.general_kg.eval.kg_subgraph_scale_eval import KGSubgraphScaleEvaluator
from dataflow.operators.general_kg.filter.kg_rel_tuple_subgraph_sampling import (
    KGEntityBasedSubgraphSampling,
)
from dataflow.operators.general_kg.filter.kg_subgraph_scale_filtering import (
    KGSubgraphScaleFilter,
)
from dataflow.operators.general_kg.filter.kg_tuple_remove_repeated import (
    KGTupleRemoveRepeated,
)
from dataflow.operators.general_kg.generate.kg_entity_extractor import KGEntityExtraction
from dataflow.operators.general_kg.generate.kg_rel_triple_subgraph_qa_generator import (
    KGRelationTripleSubgraphQAGeneration,
)
from dataflow.operators.general_kg.generate.kg_triple_extractor import KGTripleExtraction


class KGQA_APIPipeline:
    def __init__(self):
        self.storage = FileStorage(
            first_entry_file_name="../example_data/kg_qa_pipeline_input.json",
            cache_path="./cache_local",
            file_name_prefix="kg_qa_pipeline",
            cache_type="json",
        )

        self.llm_serving = APILLMServing_request(
            api_url="https://api.openai.com/v1/chat/completions",
            model_name="gpt-4o",
            max_workers=30,
        )

        self.entity_extraction_step1 = KGEntityExtraction(
            llm_serving=self.llm_serving,
            lang="en",
        )

        self.triple_extraction_step2 = KGTripleExtraction(
            llm_serving=self.llm_serving,
            triple_type="relation",
            lang="en",
        )

        self.triple_dedup_step3 = KGTupleRemoveRepeated()

        self.subgraph_sampling_step4 = KGEntityBasedSubgraphSampling(
            llm_serving=self.llm_serving,
            lang="en",
        )

        self.subgraph_scale_eval_step5 = KGSubgraphScaleEvaluator()

        self.subgraph_scale_filter_step6 = KGSubgraphScaleFilter()

        self.subgraph_qa_generation_step7 = KGRelationTripleSubgraphQAGeneration(
            llm_serving=self.llm_serving,
            lang="en",
            qa_type="num",
            num_q=5,
        )

        self.qa_natural_eval_step8 = KGQANaturalEvaluator(
            llm_serving=self.llm_serving,
            lang="en",
        )

    def forward(self):
        self.entity_extraction_step1.run(
            storage=self.storage.step(),
            input_key="text",
            output_key="entity",
        )

        self.triple_extraction_step2.run(
            storage=self.storage.step(),
            input_key="text",
            input_key_meta="entity",
            output_key="triple",
        )

        self.triple_dedup_step3.run(
            storage=self.storage.step(),
            input_key="triple",
            output_key="triple",
        )

        self.subgraph_sampling_step4.run(
            storage=self.storage.step(),
            input_key="triple",
            output_key="subgraph",
            sampling_type="hop",
            hop=2,
            M=5,
        )

        self.subgraph_scale_eval_step5.run(
            storage=self.storage.step(),
            input_key="subgraph",
            output_key1="num_nodes",
            output_key2="num_edges",
            output_key3="density",
        )

        self.subgraph_scale_filter_step6.run(
            storage=self.storage.step(),
            input_key="subgraph",
            output_key="density",
            min_score=0.1,
            max_score=1.0,
        )

        self.subgraph_qa_generation_step7.run(
            storage=self.storage.step(),
            input_key="subgraph",
            output_key="QA_pairs",
        )

        self.qa_natural_eval_step8.run(
            storage=self.storage.step(),
            input_key="QA_pairs",
            output_key="naturalness_scores",
        )


if __name__ == "__main__":
    model = KGQA_APIPipeline()
    model.forward()
```