---
title: 金融知识图谱风险分析流水线
createTime: 2026/04/15 18:15:00
permalink: /zh/kg_guide/finkg_risk_pipeline/
icon: carbon:chart-network
---

# 金融知识图谱风险分析流水线

## 1. 概述

**金融知识图谱风险分析流水线**面向金融文本中的实体风险识别场景。它先从文本中抽取金融四元组，再按金融本体筛选目标类型相关的关系，最后围绕指定 `target_entity` 生成风险分析结果和风险分数。

该流水线适合以下任务：

- 企业、机构或金融实体的风险研判
- 金融新闻或公告中的风险线索抽取
- 基于结构化图谱关系做风险解释
- 金融图谱下游投研、合规、审计场景的数据准备

流水线主要阶段包括：

1. **金融四元组抽取**：从原始金融文本中抽取带时间的 KG 四元组。
2. **本体筛选**：仅保留目标本体类型相关的关系。
3. **风险分析**：围绕目标实体输出风险解释与风险分数。

---

## 2. 快速开始

### 第一步：准备输入数据

该流水线要求输入文件至少包含：

- `raw_chunk`
- `target_entity`

示例输入如下：

```json
[
  {
    "raw_chunk": "In 2012, Goldman Sachs underwrote three bond issuances for 1Malaysia Development Berhad (1MDB). In 2015, 1MDB faced potential default, and in 2020 Goldman Sachs agreed to pay more than $2.9 billion in fines to settle global investigations.",
    "target_entity": "Goldman Sachs"
  }
]
```

### 第二步：配置 API Key

```bash
export DF_API_KEY=sk-xxxx
```

### 第三步：初始化模型服务并运行流水线

```python
from dataflow.serving import APILLMServing_request
from dataflow.statics.pipelines.api_pipelines.finkg_risk_pipeline import FinKGRiskPipeline

llm_serving = APILLMServing_request(
    api_url="https://api.openai.com/v1/chat/completions",
    key_name_of_api_key="DF_API_KEY",
    model_name="gpt-4o-mini",
    max_workers=8,
    temperature=0.0,
)

pipeline = FinKGRiskPipeline(
    first_entry_file_name="./finkg_risk_demo.json",
    llm_serving=llm_serving,
    cache_path="./cache_finkg_risk",
    lang="en",
    target_ontology="Corporation",
)
pipeline.forward()
```

---

## 3. 数据流和流水线逻辑

### 1. 输入数据

该流水线至少需要两个输入字段：

- **raw_chunk**：金融领域原始文本。
- **target_entity**：需要做风险评估的目标实体名称。

输入示例如下：

```json
[
  {
    "raw_chunk": "In 2012, Goldman Sachs underwrote three bond issuances for 1Malaysia Development Berhad (1MDB), a Malaysian state investment fund. In 2015, 1MDB faced potential default. In October 2020, Goldman Sachs agreed to pay more than $2.9 billion in fines to settle global investigations.",
    "target_entity": "Goldman Sachs"
  }
]
```

### 2. 金融知识图谱风险分析流水线逻辑（FinKGRiskPipeline）

#### 步骤 1：金融四元组抽取（FinKGTupleExtraction）

**功能：**

- 从金融文本中抽取带时间的关系四元组
- 同时输出参与实体的本体类别

**输入**：`raw_chunk`  
**输出**：`tuple`、`entity_class`

输出四元组格式示例：

```text
<subj> Goldman Sachs <obj> 1MDB Bond <rel> underwrites <time> 2012
```

#### 步骤 2：本体筛选（FinKGTupleFilter）

**功能：**

- 根据 `target_ontology` 过滤四元组
- 保留与目标实体类别更相关的关系子集

**输入**：`tuple`、`entity_class`  
**输出**：`tuple`

#### 步骤 3：风险分析（FinKGEntityRiskAssessment）

**功能：**

- 结合过滤后的四元组和 `target_entity`
- 输出风险解释文本以及风险分数

**输入**：`tuple`、`target_entity`  
**输出**：`risk_answer`、`risk_score`

### 3. 输出数据

流水线运行结束后，常见输出字段包括：

- **tuple**：筛选后的金融四元组
- **entity_class**：实体类别标签
- **risk_answer**：风险分析结论
- **risk_score**：0 到 1 的风险分数

示例输出如下：

```json
{
  "tuple": [
    "<subj> Goldman Sachs <obj> 1MDB Bond <rel> underwrites <time> 2012",
    "<subj> 1MDB <obj> 1MDB Bond <rel> defaults_on <time> 2015",
    "<subj> SEC <obj> Goldman Sachs <rel> fined_by <time> 2020"
  ],
  "risk_answer": "Goldman Sachs is exposed to compliance and reputational risk because it underwrote the 1MDB-related bonds and was later fined during the investigation.",
  "risk_score": 0.91
}
```

---

## 4. 流水线实例

以下是 `FinKGRiskPipeline` 的完整实现。

```python
from dataflow.core import LLMServingABC
from dataflow.operators.domain_kg.financial_kg.filter.finkg_4tuple_ontology_filtering import (
    FinKGTupleFilter,
)
from dataflow.operators.domain_kg.financial_kg.generate.finkg_4tuple_extractor import (
    FinKGTupleExtraction,
)
from dataflow.operators.domain_kg.financial_kg.refine.finkg_entity_risk_assessment import (
    FinKGEntityRiskAssessment,
)
from dataflow.operators.domain_kg.utils.finkg_get_ontology import load_finkg_ontology
from dataflow.pipeline import PipelineABC
from dataflow.utils.storage import FileStorage


class FinKGRiskPipeline(PipelineABC):
    """Financial KG pipeline: raw text -> tuples -> filtered tuples -> risk answer.

    Required dataset columns:
    - `raw_chunk`: source financial text
    - `target_entity`: entity whose risk should be assessed
    """

    def __init__(
        self,
        first_entry_file_name: str,
        llm_serving: LLMServingABC,
        cache_path: str = "./cache_local",
        file_name_prefix: str = "finkg_risk_pipeline_step",
        cache_type: str = "jsonl",
        lang: str = "en",
        triple_type: str = "relation",
        target_ontology: str = "Corporation",
    ):
        super().__init__()
        if llm_serving is None:
            raise ValueError("llm_serving is required for FinKGRiskPipeline")

        self.storage = FileStorage(
            first_entry_file_name=first_entry_file_name,
            cache_path=cache_path,
            file_name_prefix=file_name_prefix,
            cache_type=cache_type,
        )
        self.ontology = load_finkg_ontology()
        self.target_ontology = target_ontology

        self.tuple_extraction_step1 = FinKGTupleExtraction(
            llm_serving=llm_serving,
            triple_type=triple_type,
            lang=lang,
        )
        self.tuple_filter_step2 = FinKGTupleFilter()
        self.risk_answer_step3 = FinKGEntityRiskAssessment(
            llm_serving=llm_serving,
            lang=lang,
        )

    def forward(self):
        self.tuple_extraction_step1.run(
            storage=self.storage.step(),
            ontology_lists=self.ontology,
            input_key="raw_chunk",
            input_key_meta=None,
            output_key="tuple",
            output_key_meta="entity_class",
        )
        self.tuple_filter_step2.run(
            storage=self.storage.step(),
            ontology_lists=self.ontology,
            input_key_tuple="tuple",
            input_key_class="entity_class",
            output_key="tuple",
            input_key_meta=None,
            target_ontology=self.target_ontology,
        )
        self.risk_answer_step3.run(
            storage=self.storage.step(),
            input_key="tuple",
            output_key="risk_answer",
            output_key_score="risk_score",
        )
```

最小调用示例如下：

```python
from dataflow.serving import APILLMServing_request
from dataflow.statics.pipelines.api_pipelines.finkg_risk_pipeline import FinKGRiskPipeline

llm_serving = APILLMServing_request(
    api_url="https://api.openai.com/v1/chat/completions",
    key_name_of_api_key="DF_API_KEY",
    model_name="gpt-4o-mini",
    max_workers=8,
    temperature=0.0,
)

pipeline = FinKGRiskPipeline(
    first_entry_file_name="./finkg_risk_demo.json",
    llm_serving=llm_serving,
    cache_path="./cache_finkg_risk",
    lang="en",
    target_ontology="Corporation",
)
pipeline.forward()
```
