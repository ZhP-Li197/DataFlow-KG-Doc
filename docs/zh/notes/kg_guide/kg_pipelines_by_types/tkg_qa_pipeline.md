---
title: 时序知识图谱问答生成流水线
createTime: 2026/04/21 17:14:00
permalink: /zh/kg_guide/tkg_qa_pipeline/
icon: mdi:alarm-clock
---

# 时序知识图谱问答流水线

## 1. 概述

**时序知识图谱问答生成流水线** 面向“从自然语言文本中提取带有时间属性的知识结构，并基于特定时间范围和逻辑路径生成时序问答对”的场景。与常规知识图谱不同，时序知识图谱（Temporal Knowledge Graph, TKG）强调事实的有效时间或发生时间。该流水线能够自动提取时序事实、按时间窗口过滤、构建多跳关系路径，并最终生成与评估高质量的时间点问答对。

该流水线适合以下任务：

- 从非结构化文本中抽取带有时序信息的元组（Tuple/Triple）。
- 基于指定时间区间（如 `2021年第一季度` 到 `2023年`）对图谱进行精准的时间窗口过滤。
- 在时序图谱中进行多跳路径生成与采样。
- 基于多跳时序路径，自动化生成查询特定时间点（Time Point）的复杂问答数据集。
- 问答对自然度（Naturalness）的自动化大模型评估。

流水线的主要阶段包括：

1. **时序元组抽取**：从文本中提取带有时间约束的关系元组。
2. **时间范围过滤**：根据设定的起止时间过滤出符合条件的时序元组。
3. **关系路径生成**：在提取出的元组中生成指定跳数（如 2-hop）的关系路径。
4. **时序路径问答生成**：基于关系路径生成针对时间点的问答对（QA pairs）。
5. **问答自然度评估**：对生成的问答对进行语言流畅度和自然度的打分。

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

- 流水线脚本：`api_pipelines/tkg_qa_pipeline.py`
- 默认数据：`example/tkg_qa_pipeline_input.json`

### 步骤 3：配置 API Key

该流水线默认使用 `gpt-4o`。你需要配置 OpenAI 的 API 密钥（具体的环境变量名视你底层的 `APILLMServing_request` 实现而定，通常为 `DF_API_KEY` 或类似设定）：

```bash
export DF_API_KEY=sk-xxxx
```

### 步骤 4：一键运行

```bash
python api_pipelines/tkg_qa_pipeline.py
```

---

## 3. 数据流和流水线逻辑

### 3.1 输入数据

该流水线需要的数据格式应保存在 `tkg_qa_pipeline_input.json` 中，至少需要包含纯文本列表：

- **text**: 原始自然语言文本列表（包含丰富的时序事件）。

输入示例如下：

```json
[
  {
    "text":"Alice joined Company A in January 2021. Alice was promoted to team lead in March 2022. Bob collaborated with Alice in 2022."
  },
  {
    "text":"City X hosted the spring marathon in April 2021. The event returned in April 2022. Tourists increased after the 2022 race."
  }
]
```

### 3.2 时序知识图谱问答流水线逻辑（TKGQA_APIPipeline）

#### 步骤 1：时序元组抽取（TKGTupleExtraction）

**功能：**
基于大模型从文本中提取出带有时间约束的关系三元组或元组。
**输入**：`text`  
**输出**：`tuple`

#### 步骤 2：时间范围过滤（TKGTupleTimeFilter）

**功能：**
根据指定的起始时间和结束时间对元组进行过滤，保留发生在指定时间窗口内的事件。
**输入**：`tuple`  
**输出**：`filtered_tuple`  
**参数**：`query_time_start="Q1 2021"`, `query_time_end="2023"`

#### 步骤 3：关系路径生成（KGRelationTuplePathGenerator）

**功能：**
在提取出的元组集合中，生成长度为 k（`k=2`）的连通关系路径，用于支持后续的多跳复杂推理问答。
**输入**：`tuple`  
**输出**：`hop_paths` (存储于 meta 级)

#### 步骤 4：时序路径问答生成（TKGTuplePathQAGeneration）

**功能：**
基于上述生成的路径数据，针对特定跳数（`hop=2`）生成询问具体时间点（`qa_type="time_point"`）的问答对，生成数量受 `num_q=5` 控制。
**输入**：`hop_paths` (meta)  
**输出**：`QA_pairs` (meta)

#### 步骤 5：问答自然度评估（KGQANaturalEvaluator）

**功能：**
对步骤 4 生成的 2-hop 问答对（键名为 `2_QA_pairs`）进行自然度和语言质量的大模型评估。
**输入**：`2_QA_pairs`  
**输出**：`naturalness_scores`

### 3.3 输出数据

流水线执行完毕后，DataFlow 的存储中将包含以下核心字段：

- **tuple**：提取出的所有时序元组。
- **filtered_tuple**：经过时间窗口（如 2021 Q1 - 2023）过滤后的时序元组。
- **hop_paths**：生成的 2 跳实体关系路径。
- **2_QA_pairs**：基于 2 跳路径生成的关于“时间点”的复杂问答对。
- **naturalness_scores**：问答对的自然度评估分数。

示例输出概念（实际结构取决于具体的算子底层实现）：

```json
{
    "2_hop_paths":"<subj> Alice <obj> Company A <rel> joined <time> January 2021 || <subj> Bob <obj> Alice <rel> collaborated with <time> 2022",
    "2_QA_pairs":[
      {
        "question":"When did Alice join Company A?",
        "answer":"January 2021"
      },
      {
        "question":"At what time did Bob collaborate with Alice?",
        "answer":"2022"
      }
    ],
    "naturalness_scores":[
      1,
      0.5
    ]
}
```

---

## 4. 流水线实例

以下为 `tkg_qa_pipeline.py` 的完整代码结构：

```python
from pathlib import Path

import pandas as pd

from dataflow.serving import APILLMServing_request
from dataflow.utils.storage import FileStorage

from dataflow.operators.general_kg.eval.kg_qa_natural_eval import KGQANaturalEvaluator
from dataflow.operators.general_kg.filter.kg_rel_tuple_path_sampling import (
    KGRelationTuplePathGenerator,
)
from dataflow.operators.temporal_kg import TKGTupleExtraction
from dataflow.operators.temporal_kg import TKGTuplePathQAGeneration
from dataflow.operators.temporal_kg import TKGTupleTimeFilter

class TKGQA_APIPipeline:
    def __init__(self):
        self.storage = FileStorage(
            first_entry_file_name="../example_data/tkg_qa_pipeline_input.json",
            cache_path="./cache_local",
            file_name_prefix="tkg_qa_pipeline",
            cache_type="json",
        )

        self.llm_serving = APILLMServing_request(
            api_url="https://api.openai.com/v1/chat/completions",
            model_name="gpt-4o",
            max_workers=30,
        )

        self.temporal_tuple_extraction_step1 = TKGTupleExtraction(
            llm_serving=self.llm_serving,
            triple_type="relation",
            lang="en",
        )

        self.temporal_time_filter_step2 = TKGTupleTimeFilter(
            merge_to_input=True,
        )

        self.path_generation_step3 = KGRelationTuplePathGenerator(
            llm_serving=self.llm_serving,
            lang="en",
            k=2,
        )

        self.temporal_path_qa_generation_step4 = TKGTuplePathQAGeneration(
            llm_serving=self.llm_serving,
            lang="en",
            hop=2,
            qa_type="time_point",
            num_q=5,
        )

        self.qa_natural_eval_step5 = KGQANaturalEvaluator(
            llm_serving=self.llm_serving,
            lang="en",
        )

    def forward(self):
        self.temporal_tuple_extraction_step1.run(
            storage=self.storage.step(),
            input_key="text",
            output_key="tuple",
        )

        self.temporal_time_filter_step2.run(
            storage=self.storage.step(),
            input_key="tuple",
            output_key="filtered_tuple",
            query_time_start="Q1 2021",
            query_time_end="2023",
        )

        self.path_generation_step3.run(
            storage=self.storage.step(),
            input_key="tuple",
            output_key_meta="hop_paths",
        )

        self.temporal_path_qa_generation_step4.run(
            storage=self.storage.step(),
            input_key_meta="hop_paths",
            output_key_meta="QA_pairs",
        )

        self.qa_natural_eval_step5.run(
            storage=self.storage.step(),
            input_key="2_QA_pairs",
            output_key="naturalness_scores",
        )


if __name__ == "__main__":
    model = TKGQA_APIPipeline()
    model.forward()
```