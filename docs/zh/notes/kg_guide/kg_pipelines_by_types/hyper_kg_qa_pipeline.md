---
title: 超关系知识图谱流水线
createTime: 2026/04/21 16:21:21
permalink: /zh/kg_guide/hyper_kg_qa_pipeline/
icon: mdi:book-multiple-outline
---

# 超关系知识图谱流水线

## 1. 概述

**超关系知识图谱流水线** 面向“给定自然语言文本，提取超关系图谱（Hyper-Relational KG）三元组，过滤特定属性子图，并据此生成及评估问答对”的场景。该流水线能够处理比传统三元组更复杂的图谱结构（例如带有时间、地点等修饰属性的超关系三元组），并以此为基础自动生成高质量的图谱问答（KG-QA）数据集。

该流水线适合以下任务：

- 复杂文本的超关系三元组抽取
- 基于特定属性（如时间 `<Time>`）的子图检索与过滤
- 基于超关系图谱的多跳或复杂问答对（QA pairs）自动生成
- 问答对自然度（Naturalness）的自动化大模型评估

流水线的主要阶段包括：

1. **超关系三元组抽取**：从纯文本中提取包含修饰属性的超关系三元组集合。
2. **属性子图过滤**：根据指定的属性标签（如 `<Time>`）对生成的三元组进行过滤，保留相关的子图。
3. **子图问答生成**：基于过滤后的子图生成指定数量和类型的问答对。
4. **问答自然度评估**：对生成的问答对进行语言自然度和流畅度的打分评估。

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

- 流水线脚本：`api_pipelines/hyper_kg_qa_pipeline.py`
- 默认数据：`example/hyper_kg_qa_pipeline_input.json`

### 步骤 3：配置 API Key

该流水线默认使用 `gpt-4o`。你需要配置 OpenAI 的 API 密钥（具体的环境变量名视你底层的 `APILLMServing_request` 实现而定，通常为 `DF_API_KEY` 或类似设定）：

```bash
export DF_API_KEY=sk-xxxx
```

### 步骤 4：一键运行

```bash
python api_pipelines/hyper_kg_qa_pipeline.py
```

---

## 3. 数据流和流水线逻辑

### 3.1 输入数据

该流水线需要的数据格式应保存在 `hyper_kg_qa_pipeline_input.json` 中，至少需要以下字段：

- **text**: 原始自然语言文本列表。

输入示例如下：

```json
[
  {
    "text": "In March 2022, Alice joined Company A in Beijing. In July 2023, Alice led Project Orion for Company A in Shanghai. Bob collaborated with Alice on Project Orion in Shanghai during 2023."
  },
  {
    "text": "In April 2021, City X hosted the Spring Marathon in Riverside Park. In April 2022, City X hosted the Spring Marathon again in Riverside Park. Club Y won multiple titles at the 2022 event."
  },
  {
    "text": "In January 2020, Hospital Z launched a vaccination program in Shenzhen. In June 2021, Hospital Z expanded the program to Guangzhou. Doctors from Hospital Z reported higher participation in 2021."
  }
]
```

### 3.2 超关系知识图谱问答流水线逻辑（HyperKGQA_APIPipeline）

#### 步骤 1：超关系三元组抽取（HRKGTripleExtraction）

**功能：**

- 基于大模型从文本中提取出超关系三元组（包含主体、客体、关系以及诸如时间、地点等修饰属性）。

**输入**：`text`  
**输出**：`tuple`

**算子运行：**

```python
self.hyper_triple_extraction_step1.run(
    storage=self.storage.step(),
    input_key="text",
    output_key="tuple",
)
```

#### 步骤 2：属性子图过滤（HRKGRelationTripleAttributeFilter）

**功能：**

- 过滤出包含特定属性修饰符（如 `<Time>`）的子图数据，以缩小后续 QA 生成的范围。

**输入**：`tuple`  
**输出**：`subgraph`  
**参数**：`attr_tag="<Time>"`

#### 步骤 3：子图问答生成（HRKGRelationTripleSubgraphQAGeneration）

**功能：**

- 基于过滤出的具有特定属性的子图，调用大模型生成数值型或其他特定类型（如 `qa_type="num"`）的问答对。
- 控制生成数量（如 `num_q=5`）。

**输入**：`subgraph`  
**输出**：`QA_pairs`

#### 步骤 4：问答自然度评估（KGQANaturalEvaluator）

**功能：**

- 让大模型对生成的问答对进行自然度和语言质量评估，通常输出评分或评价结果。

**输入**：`QA_pairs`  
**输出**：`naturalness_scores`

### 3.3 输出数据

流水线执行完毕后，DataFlow 的存储（默认路径为 `./cache_local`）中将包含以下输出字段：

- **text**：原始数据。
- **tuple**：提取出的超关系三元组。
- **subgraph**：过滤掉不包含目标属性后的图谱结构。
- **QA_pairs**：生成的问答对（包含问题和答案）。
- **naturalness_scores**：问答对的自然度评估分数。

示例输出概念（实际结构取决于具体的算子底层实现）：

```json
{
  "text":"In January 2020, Hospital Z launched a vaccination program in Shenzhen. In June 2021, Hospital Z expanded the program to Guangzhou. Doctors from Hospital Z reported higher participation in 2021.",
  "tuple":[
    "<subj> Hospital Z <obj> Vaccination Program <rel> Launched <Time> January 2020 <Location> Shenzhen",
    "<subj> Hospital Z <obj> Vaccination Program <rel> Expanded <Time> June 2021 <Location> Guangzhou",
    "<subj> Doctors from Hospital Z <obj> Participation <rel> Reported <Time> 2021 <Degree> Higher"
  ],
  "subgraph":[
    "<subj> Hospital Z <obj> Vaccination Program <rel> Launched <Time> January 2020 <Location> Shenzhen",
    "<subj> Hospital Z <obj> Vaccination Program <rel> Expanded <Time> June 2021 <Location> Guangzhou",
    "<subj> Doctors from Hospital Z <obj> Participation <rel> Reported <Time> 2021 <Degree> Higher"
  ],
  "QA_pairs":[
    {
      "question":"In which locations did Hospital Z's vaccination program take place over time?",
      "answer":"Shenzhen, Guangzhou"
    },
    {
      "question":"What are the times associated with the launch and expansion of Hospital Z's vaccination program?",
      "answer":"January 2020, June 2021"
    },
    {
      "question":"What changes related to vaccination programs at Hospital Z were reported in 2021?",
      "answer":"Vaccination Program Expanded, Doctors Participation Higher"
    }
  ],
  "naturalness_scores":[
    1,
    0.5,
    0.5
  ]
}
```

---

## 4. 流水线实例

以下为 `hyper_kg_qa_pipeline.py` 的完整代码结构：

```python
from dataflow.serving import APILLMServing_request
from dataflow.utils.storage import FileStorage

from dataflow.operators.general_kg.eval.kg_qa_natural_eval import KGQANaturalEvaluator
from dataflow.operators.hyper_relation_kg import HRKGRelationTripleAttributeFilter
from dataflow.operators.hyper_relation_kg import (
    HRKGTripleExtraction,
)
from dataflow.operators.hyper_relation_kg import (
    HRKGRelationTripleSubgraphQAGeneration,
)


class HyperKGQA_APIPipeline:
    def __init__(self):
        self.storage = FileStorage(
            first_entry_file_name="../example_data/hyper_kg_qa_pipeline_input.json",
            cache_path="./cache_local",
            file_name_prefix="hyper_kg_qa_pipeline",
            cache_type="json",
        )

        self.llm_serving = APILLMServing_request(
            api_url="https://api.openai.com/v1/chat/completions",
            model_name="gpt-4o",
            max_workers=30,
        )

        self.hyper_triple_extraction_step1 = HRKGTripleExtraction(
            llm_serving=self.llm_serving,
            lang="en",
        )

        self.subgraph_filter_step2 = HRKGRelationTripleAttributeFilter(
            lang="en",
        )

        self.subgraph_qa_generation_step3 = HRKGRelationTripleSubgraphQAGeneration(
            llm_serving=self.llm_serving,
            lang="en",
            qa_type="set",
            num_q=3,
        )

        self.qa_natural_eval_step4 = KGQANaturalEvaluator(
            llm_serving=self.llm_serving,
            lang="en",
        )

    def forward(self):
        self.hyper_triple_extraction_step1.run(
            storage=self.storage.step(),
            input_key="text",
            output_key="tuple",
        )

        self.subgraph_filter_step2.run(
            storage=self.storage.step(),
            input_key="tuple",
            output_key="subgraph",
            attr_tag="<Time>",
        )

        self.subgraph_qa_generation_step3.run(
            storage=self.storage.step(),
            input_key="subgraph",
            output_key="QA_pairs",
        )

        self.qa_natural_eval_step4.run(
            storage=self.storage.step(),
            input_key="QA_pairs",
            output_key="naturalness_scores",
        )


if __name__ == "__main__":
    model = HyperKGQA_APIPipeline()
    model.forward()
```