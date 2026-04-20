---
title: 基于知识图谱增强检索流水线
createTime: 2026/04/15 18:00:00
permalink: /zh/kg_guide/graph_rag_pipeline/
icon: solar:routing-3-bold
---

# 基于知识图谱增强检索流水线

## 1. 概述

**基于知识图谱增强检索流水线**(GraphRAG)面向“已有知识图谱 triples + 用户问题列表”的问答场景。它会先从问题中抽取检索语义，再围绕问题实体做子图检索，随后把检索到的子图组织成提示词，调用大模型生成答案，并对答案做难度评估、合理性评估和过滤。

该流水线适合以下任务：

- 基于已有三元组集合的图谱问答
- 对一批问题进行统一的 GraphRAG 推理
- 为图谱问答结果增加难度标签与可信度打分
- 在离线数据集上快速验证 GraphRAG 效果

流水线的主要阶段包括：

1. **查询语义抽取**：从问题中抽取实体和关系线索。
2. **子图检索**：以实体为中心，从 `triple` 中检索 k-hop 子图。
3. **答案生成**：基于子图提示词生成回答。
4. **问题难度评估**：为每个问题打上 easy / medium / hard 等标签。
5. **答案合理性评估**：根据问题和答案计算合理性分数。
6. **答案过滤**：剔除合理性分数过低的答案。

---

## 2. 快速开始

### 步骤 1：创建新的 DataFlow 工作目录

```bash
mkdir run_dataflow_kg
cd run_dataflow_kg
```

### 步骤 2：准备脚本

将下方“流水线实例”中的代码保存为 `graph_rag_pipeline.py`。

该脚本默认读取仓库中的测试文件：

```python
dataflow/data_for_operator_testing/graphrag.json
```

### 步骤 3：配置 API Key 与模型服务

运行前先配置大模型 API Key：

```bash
export DF_API_KEY=sk-xxxx
```

如果需要修改模型地址、模型名、缓存路径或跳数，可以调整以下参数：

```python
llm_serving = APILLMServing_request(
    api_url="https://api.openai.com/v1/chat/completions",
    key_name_of_api_key="DF_API_KEY",
    model_name="gpt-4o-mini",
    max_workers=8,
    temperature=0.0,
)

pipeline = GraphRAGPipeline(
    first_entry_file_name="dataflow/data_for_operator_testing/graphrag.json",
    llm_serving=llm_serving,
    cache_path="./cache_graph_rag",
    hop=1,
    lang="en",
)
```

### 步骤 4：一键运行

```bash
python graph_rag_pipeline.py
```

运行完成后，缓存目录中会依次保存查询语义、子图提示词、答案、难度标签、合理性得分和过滤后的答案结果。

---

## 3. 数据流和流水线逻辑

### 3.1 输入数据

该流水线至少需要以下字段：

- **question**：问题列表。当前实现建议每一行放一个问题列表，而不是“一行一个问题”。
- **triple**：知识图谱三元组列表，格式为 `"<subj> ... <obj> ... <rel> ..."`。

当前测试数据中的一条输入样例如下：

```json
[
  {
    "question": [
      "On which date was Polar Lights released?",
      "Who is Henry trained by?",
      "Which organization that Lucy joins inspires Henry?",
      "Which cities has Maple Leaves performed in?"
    ],
    "triple": [
      "<subj> Henry <obj> Maria Rodriguez <rel> is_trained_by",
      "<subj> Henry <obj> Maple Leaves <rel> forms",
      "<subj> Lucy <obj> University Toronto <rel> studies_at",
      "<subj> Maple Leaves <obj> Polar Lights <rel> releases",
      "<subj> Polar Lights <obj> August 12 2020 <rel> is_released_on",
      "<subj> Lucy <obj> Clean Earth <rel> joins",
      "<subj> Henry <obj> Lucy <rel> is_inspired_by",
      "<subj> Maple Leaves <obj> Paris <rel> performs_in",
      "<subj> Maple Leaves <obj> Berlin <rel> performs_in",
      "<subj> Maple Leaves <obj> Rome <rel> performs_in"
    ]
  }
]
```

### 3.2 GraphRAG 流水线逻辑（GraphRAGPipeline）

该流水线串联了 6 个算子，核心思路是“问题语义抽取 -> 子图检索 -> 回答生成 -> 质量评估”。

#### 步骤 1：查询语义抽取（KGGraphRAGQueryExtraction）

**功能：**

- 从问题列表中抽取实体线索和关系线索
- 为后续子图检索提供实体种子

**输入**：`question`  
**输出**：`entities`、`relations`

**算子运行：**

```python
self.query_extraction_step1.run(
    storage=self.storage.step(),
    input_key="question",
    output_keys=["entities", "relations"],
)
```

#### 步骤 2：子图检索（KGGraphRAGSubgraphRetrieval）

**功能：**

- 基于 `entities` 和 `triple` 做 k-hop 子图检索
- 将检索结果整理成可直接送入大模型的 `subgraph_prompt`

**输入**：`question`、`entities`、`triple`  
**输出**：`subgraph_prompt`

**算子运行：**

```python
self.subgraph_retrieval_step2.run(
    storage=self.storage.step(),
    output_key="subgraph_prompt",
)
```

#### 步骤 3：答案生成（KGGraphRAGGetAnswer）

**功能：**

- 使用 `subgraph_prompt` 约束模型只基于图谱事实回答
- 为每个问题生成对应答案

**输入**：`question`、`subgraph_prompt`  
**输出**：`answer`

**算子运行：**

```python
self.answer_generation_step3.run(
    storage=self.storage.step(),
    input_keys=["question", "subgraph_prompt"],
    output_key="answer",
)
```

#### 步骤 4：问题难度评估（KGRAGQuestionDifficultyEvaluation）

**功能：**

- 对问题做粗粒度难度标注
- 便于后续按难度分析问答效果

**输入**：`question`  
**输出**：`question_difficulty`

#### 步骤 5：答案合理性评估（KGRAGQuestionPlausibilityEvaluation）

**功能：**

- 结合问题与答案给出合理性得分
- 得分越高，说明答案和问题更匹配、回答更可信

**输入**：`question`、`answer`  
**输出**：`question_plausibility_score`

#### 步骤 6：答案过滤（KGRAGAnswerPlausibilityFilter）

**功能：**

- 根据合理性分数过滤答案
- 分数不在阈值区间的答案会被替换为空项

**输入**：`answer`、`question_plausibility_score`  
**输出**：`filtered_answer`

### 3.3 输出数据

流水线运行完成后，常见输出字段包括：

- **entities**：每个问题对应的实体列表
- **relations**：每个问题对应的关系线索
- **subgraph_prompt**：检索后的子图提示词
- **answer**：模型生成的原始回答
- **question_difficulty**：问题难度标签
- **question_plausibility_score**：答案合理性得分
- **filtered_answer**：过滤后的答案

示例输出如下：

```json
{
  "entities": [
    ["Polar Lights"],
    ["Henry"],
    ["Lucy", "Henry"],
    ["Maple Leaves"]
  ],
  "relations": [
    ["release_date"],
    ["trained_by"],
    ["joins", "inspires"],
    ["performed_in"]
  ],
  "answer": [
    "Polar Lights was released on August 12, 2020.",
    "Henry is trained by Maria Rodriguez.",
    "The organization that Lucy joins and which inspires Henry is Clean Earth.",
    "Maple Leaves has performed in Rome, Paris, and Berlin."
  ],
  "question_difficulty": [
    "easy",
    "easy",
    "medium",
    "easy"
  ],
  "question_plausibility_score": [
    1.0,
    1.0,
    0.92,
    1.0
  ],
  "filtered_answer": [
    "Polar Lights was released on August 12, 2020.",
    "Henry is trained by Maria Rodriguez.",
    [],
    "Maple Leaves has performed in Rome, Paris, and Berlin."
  ]
}
```

---

## 4. 流水线实例

以下是完整的 `GraphRAGPipeline` 代码实现。

```python
import os

from dataflow.core import LLMServingABC
from dataflow.operators.graph_rag import (
    KGGraphRAGGetAnswer,
    KGGraphRAGQueryExtraction,
    KGGraphRAGSubgraphRetrieval,
    KGRAGAnswerPlausibilityFilter,
    KGRAGQuestionDifficultyEvaluation,
    KGRAGQuestionPlausibilityEvaluation,
)
from dataflow.pipeline import PipelineABC
from dataflow.serving import APILLMServing_request
from dataflow.utils.storage import FileStorage


class GraphRAGPipeline(PipelineABC):
    """GraphRAG pipeline: question -> subgraph retrieval -> answer -> answer filtering."""

    def __init__(
        self,
        first_entry_file_name: str,
        llm_serving: LLMServingABC,
        cache_path: str = "./cache_local",
        file_name_prefix: str = "graph_rag_pipeline_step",
        cache_type: str = "json",
        lang: str = "en",
        hop: int = 1,
        plausibility_min_score: float = 0.95,
        plausibility_max_score: float = 1.0,
    ):
        super().__init__()
        if llm_serving is None:
            raise ValueError("llm_serving is required for GraphRAGPipeline")

        self.storage = FileStorage(
            first_entry_file_name=first_entry_file_name,
            cache_path=cache_path,
            file_name_prefix=file_name_prefix,
            cache_type=cache_type,
        )
        self.plausibility_min_score = plausibility_min_score
        self.plausibility_max_score = plausibility_max_score

        self.query_extraction_step1 = KGGraphRAGQueryExtraction(
            llm_serving=llm_serving,
            lang=lang,
        )
        self.subgraph_retrieval_step2 = KGGraphRAGSubgraphRetrieval(hop=hop)
        self.answer_generation_step3 = KGGraphRAGGetAnswer(
            llm_serving=llm_serving,
            lang=lang,
        )
        self.question_difficulty_step4 = KGRAGQuestionDifficultyEvaluation(
            llm_serving=llm_serving,
            lang=lang,
        )
        self.answer_plausibility_step5 = KGRAGQuestionPlausibilityEvaluation(
            llm_serving=llm_serving,
            lang=lang,
        )
        self.answer_filter_step6 = KGRAGAnswerPlausibilityFilter(
            merge_to_input=False
        )

    def forward(self):
        self.query_extraction_step1.run(
            storage=self.storage.step(),
            input_key="question",
            output_keys=["entities", "relations"],
        )
        self.subgraph_retrieval_step2.run(
            storage=self.storage.step(),
            output_key="subgraph_prompt",
        )
        self.answer_generation_step3.run(
            storage=self.storage.step(),
            input_keys=["question", "subgraph_prompt"],
            output_key="answer",
        )
        self.question_difficulty_step4.run(
            storage=self.storage.step(),
            question_key="question",
            output_key="question_difficulty",
        )
        self.answer_plausibility_step5.run(
            storage=self.storage.step(),
            question_key="question",
            answer_key="answer",
            output_key="question_plausibility_score",
        )
        self.answer_filter_step6.run(
            storage=self.storage.step(),
            input_key="answer",
            score_key="question_plausibility_score",
            output_key="filtered_answer",
            min_score=self.plausibility_min_score,
            max_score=self.plausibility_max_score,
        )


if __name__ == "__main__":
    repo_root = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "..")
    )
    input_file = os.path.join(
        repo_root,
        "dataflow",
        "data_for_operator_testing",
        "graphrag.json",
    )

    llm_serving = APILLMServing_request(
        api_url="https://api.openai.com/v1/chat/completions",
        key_name_of_api_key="DF_API_KEY",
        model_name="gpt-4o-mini",
        max_workers=8,
        temperature=0.0,
    )

    pipeline = GraphRAGPipeline(
        first_entry_file_name=input_file,
        llm_serving=llm_serving,
        cache_path="./cache_graph_rag",
        lang="en",
        hop=1,
    )
    pipeline.forward()
```
