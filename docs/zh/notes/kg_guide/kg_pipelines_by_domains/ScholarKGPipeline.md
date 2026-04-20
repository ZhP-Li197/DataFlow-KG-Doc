---
title: 学者知识查询问答流水线
icon: material-symbols-light:book-ribbon-rounded
createTime: 2026/04/13 11:00:00
permalink: /zh/kg_guide/kg_pipelines_by_domains/scholarkgpipeline/
---

## 1. 概述

**学者知识查询问答流水线**的核心目标是从学术文本中抽取结构化知识，并围绕作者、论文、机构、期刊会议和研究主题等实体构建可用于检索、问答和推荐的学者知识图谱。该流水线首先加载学者图谱本体作为抽取约束，然后从文本中抽取三元组，再按照目标本体筛选关键学术关系，最后基于筛选后的图谱证据路径生成查询推理回答。

我们支持以下应用场景：

- 从论文摘要、作者简介、项目信息或学术元数据中抽取结构化三元组
- 围绕作者、论文、机构、研究主题和发表场所构建学者知识图谱
- 根据指定学术本体筛选目标三元组，例如筛选 `author_of`、`has_topic` 等关系
- 基于学者知识图谱路径生成查询推理回答

该流水线的主要流程包括：

1. **学者本体加载**：使用 `SchoKGGetOntology` 生成学者知识图谱基础本体，供后续抽取和筛选步骤使用。
2. **学者三元组抽取**：使用 `SchoKGTripleExtraction` 从 `raw_chunk` 文本中抽取 `triple` 和 `entity_class`。
3. **目标本体筛选**：使用 `SchoKGTripleFilter` 根据目标本体筛选三元组，例如只保留关系为 `author_of` 的三元组。
4. **查询推理回答**：使用 `SchoKGQueryReasoningOperator` 基于 `query` 和筛选后的三元组生成 `reasoning_path` 与 `reasoning_answer`。

在当前流水线实例中，我们选择查询推理算子作为最后一步，以保持 `.py` 文件首尾相连。`SchoKGRecommendOperator` 可作为学术节点推荐场景的替代最后一步，用于推荐目标类型的学者、论文或主题节点。

## 2. 快速开始

### 步骤 1：安装 DataFlow-KG

```bash
pip install dataflow-kg
```

### 步骤 2：创建新的 DataFlow 工作目录

```bash
mkdir run_schokg_pipeline
cd run_schokg_pipeline
```

### 步骤 3：初始化 DataFlow

```bash
dataflow init
```

你会看到：

```shell
run_dataflow/api_pipelines/scholar_kg_pipeline.py
```

如果初始化模板中暂未包含该文件，可以手动新建 `scholar_kg_pipeline.py`，并将本文第 4 节的流水线源码写入该文件。

### 步骤 4：配置 API Key 和 API URL

Linux 和 macOS：

```shell
export DF_API_KEY="sk-xxxxx"
```

Windows PowerShell：

```powershell
$env:DF_API_KEY = "sk-xxxxx"
```

在 `scholar_kg_pipeline.py` 中配置 `api_url`：

```python
self.llm_serving = APILLMServing_request(
    api_url="https://api.openai.com/v1/chat/completions",
    model_name="gpt-4o",
    max_workers=20,
)
```

### 步骤 5：准备输入数据

推荐输入文件为 `jsonl`，至少包含以下字段：

- `raw_chunk`：待处理的学术文本
- `query`：用于学者图谱查询推理的问题

示例：

```jsonl
{"raw_chunk":"Alice Smith and Bob Lee co-authored the paper Graph Neural Networks for Scientific Discovery. The paper studies graph neural networks and scientific discovery, and was published at KDD 2024. Alice Smith is affiliated with Peking University, while Bob Lee is affiliated with Tsinghua University. Alice Smith leads the Scientific Graph Intelligence Lab, whose research focuses on graph mining and machine learning.","query":"Which paper is related to Alice Smith, graph neural networks, and scientific discovery?"}
```

### 步骤 6：一键执行

```bash
python scholar_kg_pipeline.py
```

接下来将介绍该流水线中的数据流、算子组成和参数配置方式。

## 3. 数据流和流水线逻辑

### 3.1 输入数据

该流水线的输入数据主要包含以下字段：

- **raw_chunk**：学术原始文本，通常来自论文摘要、作者主页、项目介绍、会议投稿信息或学术元数据。
- **query**：面向下游知识图谱推理的问题，例如“某作者与哪些研究主题或论文相关”。

输入数据可以存储为 `jsonl` 文件，并通过 `FileStorage` 读取：

```python
self.storage = FileStorage(
    first_entry_file_name="./input/scholar_kg_input.jsonl",
    cache_path="./cache_schokg",
    file_name_prefix="scholar_kg_pipeline",
    cache_type="jsonl",
)
```

### 3.2 学者本体加载

流水线第一步使用 `SchoKGGetOntology` 加载学者知识图谱基础本体。该算子会生成实体类型、关系类型与属性类型，并写入缓存路径：

```text
./.cache/schokg/ontology.json
```

该缓存文件随后会被 `SchoKGTripleExtraction` 和 `SchoKGTripleFilter` 使用，从而保证抽取和筛选步骤共享同一套学者图谱本体约束。

### 3.3 学者三元组抽取

第二步使用 `SchoKGTripleExtraction` 从 `raw_chunk` 中抽取学术三元组：

- 输入：`raw_chunk`
- 本体输入：`ontology`
- 输出：`triple`、`entity_class`

`triple` 保存抽取出的学术关系三元组，`entity_class` 保存三元组中实体对应的类型信息。二者会作为后续筛选算子的输入。

### 3.4 目标本体筛选

第三步使用 `SchoKGTripleFilter` 对抽取结果进行筛选：

- 输入：`triple`、`entity_class`
- 本体输入：`ontology`
- 筛选目标：`target_ontology="author_of"`
- 输出：`filtered_triple`

在示例流水线中，我们选择 `author_of` 作为目标关系，保留作者与论文之间的署名关系。你也可以根据本体内容替换为其他目标，例如 `has_topic`、`affiliated_with` 或 `Author`。

### 3.5 学者图谱查询推理

第四步使用 `SchoKGQueryReasoningOperator` 生成查询推理结果：

- 输入：`query`、`filtered_triple`
- 输出：`reasoning_path`、`reasoning_answer`

该算子会根据筛选后的三元组构建候选图路径，并结合查询由大模型生成回答。这里使用 `filtered_triple` 作为输入，确保上一步筛选结果真正进入下游推理步骤。

### 3.6 可选替换与扩展

如果目标任务是学术节点推荐，可以将最后一步替换为 `SchoKGRecommendOperator`，并将输出列改为 `recommended_node` 和 `recommendation_reason`。该算子需要同时读取 `query`、`triple` 和 `entity_class`，适合推荐指定 `target_type` 的作者、论文、机构或研究主题节点。

### 3.7 输出数据

最终输出数据通常包含以下字段：

- **raw_chunk**：原始学术文本
- **query**：学者知识图谱查询
- **triple**：抽取出的学术三元组
- **entity_class**：三元组实体类型
- **filtered_triple**：按目标本体筛选后的三元组
- **reasoning_path**：用于查询回答的候选推理路径
- **reasoning_answer**：生成的查询推理回答

## 4. 流水线实例

```python
from dataflow.serving import APILLMServing_request
from dataflow.utils.storage import FileStorage
from dataflow.operators.domain_kg.utils.schokg_get_ontology import (
    SchoKGGetOntology,
)
from dataflow.operators.domain_kg.scholar_kg.generate.schokg_triple_extractor import (
    SchoKGTripleExtraction,
)
from dataflow.operators.domain_kg.utils.schokg_triple_ontology_filtering import (
    SchoKGTripleFilter,
)
from dataflow.operators.domain_kg.scholar_kg.generate.schokg_query_reasoning import (
    SchoKGQueryReasoningOperator,
)


class ScholarKGPipeline:
    def __init__(self):
        self.storage = FileStorage(
            first_entry_file_name="./input/scholar_kg_input.jsonl",
            cache_path="./cache_schokg",
            file_name_prefix="scholar_kg_pipeline",
            cache_type="jsonl",
        )
        self.ontology_storage = FileStorage(
            first_entry_file_name="",
            cache_path="./cache_schokg_ontology",
            file_name_prefix="scholar_kg_ontology",
            cache_type="json",
        )

        self.llm_serving = APILLMServing_request(
            api_url="https://api.openai.com/v1/chat/completions",
            model_name="gpt-4o",
            max_workers=20,
        )

        self.ontology_loader_step1 = SchoKGGetOntology()
        self.triple_extractor_step2 = SchoKGTripleExtraction(
            llm_serving=self.llm_serving,
            lang="en",
        )
        self.triple_filter_step3 = SchoKGTripleFilter()
        self.query_reasoning_step4 = SchoKGQueryReasoningOperator(
            llm_serving=self.llm_serving,
            lang="en",
            max_hop=3,
            max_candidate_paths=20,
        )

    def forward(self):
        self.ontology_loader_step1.run(
            storage=self.ontology_storage.step(),
        )

        self.triple_extractor_step2.run(
            storage=self.storage.step(),
            input_key="raw_chunk",
            input_key_meta="ontology",
            output_key="triple",
            output_key_meta="entity_class",
        )

        self.triple_filter_step3.run(
            storage=self.storage.step(),
            input_key_triple="triple",
            input_key_class="entity_class",
            input_key_meta="ontology",
            target_ontology="author_of",
            output_key="filtered_triple",
        )

        self.query_reasoning_step4.run(
            storage=self.storage.step(),
            input_key_query="query",
            input_key_triple="filtered_triple",
            output_key_path="reasoning_path",
            output_key_answer="reasoning_answer",
        )


if __name__ == "__main__":
    pipeline = ScholarKGPipeline()
    pipeline.forward()
```
