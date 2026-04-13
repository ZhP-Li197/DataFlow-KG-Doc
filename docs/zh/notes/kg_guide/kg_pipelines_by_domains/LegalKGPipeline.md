---
title: 法律领域知识图谱流水线
createTime: 2026/04/13 11:10:00
permalink: /zh/kg_guide/kg_pipelines_by_domains/legalkgpipeline/
---

## 1. 概述

**法律领域知识图谱流水线**的核心目标是从法律案件文本中抽取结构化知识，并围绕当事人、法律机构、案件类型、法律事件、证据与判决结果等要素构建可用于案件分析的法律知识图谱。该流水线首先加载法律本体作为约束，然后进行法律三元组抽取，再按照目标本体筛选关键事实，随后评估案件摘要与目标案件类型的语义相似度并过滤低相关样本，最后基于筛选后的三元组生成裁判结果预测。

我们支持以下应用场景：

- 从裁判文书、案件事实描述或法律报告中抽取结构化三元组
- 围绕当事人、诉讼角色、法律事件和司法关系构建法律知识图谱
- 根据指定法律本体筛选目标三元组，例如筛选 `自然人`、`构成`、`违反` 等实体或关系
- 根据案件摘要与案件类型描述评估样本相关性
- 基于法律图谱事实辅助生成裁判结果和理由

该流水线的主要流程包括：

1. **法律本体加载**：使用 `LegalKGGetBasicOntology` 生成通用法律知识图谱本体，供后续抽取和筛选步骤使用。
2. **法律三元组抽取**：使用 `LegalKGTupleExtraction` 从 `raw_chunk` 文本中抽取 `triple`、`entity_class` 和 `case_summary`。
3. **目标本体筛选**：使用 `LegalKGTripleFilter` 根据目标本体筛选三元组，例如保留涉及 `自然人` 的事实。
4. **案件相似度评估**：使用 `LegalKGCaseSummarySimilarity` 评估 `case_summary` 与目标案件类型描述之间的语义匹配度。
5. **案件相似度过滤**：使用 `LegalKGCaseSimilarityFilter` 根据 `similarity_score` 保留相关案件样本。
6. **裁判结果预测**：使用 `LegalKGJudgementPrediction` 基于筛选后的三元组生成 `judgement` 与 `reason`。

在当前流水线实例中，我们选择已实现且可首尾相连的算子组成主线。`legalkg_event_extractor.py`、`legalkg_triple_privacy_filtering.py` 和 `legalkg_entity_link2database.py` 当前为空文件，因此不放入本次流水线示例。

## 2. 快速开始

### 步骤 1：安装 DataFlow-KG

```bash
pip install dataflow-kg
```

### 步骤 2：创建新的 DataFlow 工作目录

```bash
mkdir run_legalkg_pipeline
cd run_legalkg_pipeline
```

### 步骤 3：初始化 DataFlow

```bash
dataflow init
```

你会看到：

```shell
run_dataflow/api_pipelines/legal_kg_pipeline.py
```

如果初始化模板中暂未包含该文件，可以手动新建 `legal_kg_pipeline.py`，并将本文第 4 节的流水线源码写入该文件。

### 步骤 4：配置 API Key 和 API URL

Linux 和 macOS：

```shell
export DF_API_KEY="sk-xxxxx"
```

Windows PowerShell：

```powershell
$env:DF_API_KEY = "sk-xxxxx"
```

在 `legal_kg_pipeline.py` 中配置 `api_url`：

```python
self.llm_serving = APILLMServing_request(
    api_url="https://api.openai.com/v1/chat/completions",
    model_name="gpt-4o",
    max_workers=20,
)
```

### 步骤 5：准备输入数据

推荐输入文件为 `jsonl`，至少包含以下字段：

- `raw_chunk`：待处理的法律案件文本

示例：

```jsonl
{"raw_chunk":"2024年3月，张三在北京市朝阳区某商场趁店员整理货架时，将一部价值人民币6000元的苹果手机放入背包并离开现场。商场监控记录了张三取走手机和离开柜台的过程，公安机关随后在其住处查获涉案手机。张三到案后如实供述主要犯罪事实并退赔被害商场损失。法院认为张三以非法占有为目的秘密窃取他人财物，数额较大，其行为构成盗窃罪，并结合退赔、认罪认罚等情节作出判决。"}
```

### 步骤 6：一键执行

```bash
python legal_kg_pipeline.py
```

接下来将介绍该流水线中的数据流、算子组成和参数配置方式。

## 3. 数据流和流水线逻辑

### 3.1 输入数据

该流水线的输入数据主要包含以下字段：

- **raw_chunk**：法律案件原始文本，通常来自裁判文书、案件事实描述、法律咨询记录或法律报告。

输入数据可以存储为 `jsonl` 文件，并通过 `FileStorage` 读取：

```python
self.storage = FileStorage(
    first_entry_file_name="./input/legal_kg_input.jsonl",
    cache_path="./cache_legalkg",
    file_name_prefix="legal_kg_pipeline",
    cache_type="jsonl",
)
```

### 3.2 法律本体加载

流水线第一步使用 `LegalKGGetBasicOntology` 加载通用法律知识图谱本体。该算子会生成实体类型、关系类型与属性类型，并写入缓存路径：

```text
./.cache/api/legal_ontology.json
```

该缓存文件随后会被 `LegalKGTupleExtraction` 和 `LegalKGTripleFilter` 使用，从而保证抽取和筛选步骤共享同一套法律本体约束。

### 3.3 法律三元组抽取

第二步使用 `LegalKGTupleExtraction` 从 `raw_chunk` 中抽取法律三元组与案件摘要：

- 输入：`raw_chunk`
- 本体输入：`legal_ontology`
- 输出：`triple`、`entity_class`、`case_summary`

`triple` 保存抽取出的法律事实三元组，`entity_class` 保存实体类型信息，`case_summary` 保存案件摘要，供后续相似度评估使用。

### 3.4 目标本体筛选

第三步使用 `LegalKGTripleFilter` 对抽取结果进行筛选：

- 输入：`triple`、`entity_class`
- 本体输入：`legal_ontology`
- 筛选目标：`target_ontology="自然人"`
- 输出：`filtered_triple`

在示例流水线中，我们选择 `自然人` 作为目标实体类型，保留涉及自然人的事实三元组。你也可以根据本体内容替换为其他目标，例如 `违法行为`、`构成` 或 `法院`。

### 3.5 案件相似度评估

第四步使用 `LegalKGCaseSummarySimilarity` 评估案件摘要与目标案件类型之间的语义相似度：

- 输入：`case_summary`
- 目标案件类型：`input_key_meta=["盗窃案件"]`
- 输出：`similarity_score`

该算子会调用大模型输出 0 到 1 之间的相似度分数，用于后续筛选。

### 3.6 案件相似度过滤

第五步使用 `LegalKGCaseSimilarityFilter` 按相似度阈值过滤样本：

- 输入：`filtered_triple`、`similarity_score`
- 输出：过滤后的 DataFrame

该步骤会保留 `similarity_score` 落在 `[min_score, max_score]` 范围内的行，并将筛选后的数据传给裁判结果预测步骤。

### 3.7 裁判结果预测

第六步使用 `LegalKGJudgementPrediction` 生成裁判结果和理由：

- 输入：`filtered_triple`
- 案件描述：`input_key_meta=["张三盗窃一部苹果手机，价值人民币6000元"]`
- 输出：`judgement`、`reason`

这里使用 `filtered_triple` 作为输入，确保本体筛选和相似度过滤后的法律事实真正进入下游预测步骤。

### 3.8 输出数据

最终输出数据通常包含以下字段：

- **raw_chunk**：原始法律案件文本
- **triple**：抽取出的法律事实三元组
- **entity_class**：三元组实体类型
- **case_summary**：案件摘要
- **filtered_triple**：按目标本体筛选后的三元组
- **similarity_score**：案件摘要与目标案件类型的相似度
- **judgement**：生成的裁判结果
- **reason**：生成裁判结果的理由

## 4. 流水线实例

```python
from dataflow.serving import APILLMServing_request
from dataflow.utils.storage import FileStorage
from dataflow.operators.domain_kg.utils.legalkg_get_ontology import (
    LegalKGGetBasicOntology,
)
from dataflow.operators.domain_kg.legal_kg.generate.legalkg_triple_extractor import (
    LegalKGTupleExtraction,
)
from dataflow.operators.domain_kg.utils.legalkg_triple_ontology_filtering import (
    LegalKGTripleFilter,
)
from dataflow.operators.domain_kg.legal_kg.eval.legalkg_case_similarity_eval import (
    LegalKGCaseSummarySimilarity,
)
from dataflow.operators.domain_kg.legal_kg.filter.legalkg_case_similarity_filtering import (
    LegalKGCaseSimilarityFilter,
)
from dataflow.operators.domain_kg.legal_kg.generate.legalkg_case_judgement_generator import (
    LegalKGJudgementPrediction,
)


class LegalKGPipeline:
    def __init__(self):
        self.storage = FileStorage(
            first_entry_file_name="./input/legal_kg_input.jsonl",
            cache_path="./cache_legalkg",
            file_name_prefix="legal_kg_pipeline",
            cache_type="jsonl",
        )
        self.ontology_storage = FileStorage(
            first_entry_file_name="",
            cache_path="./cache_legalkg_ontology",
            file_name_prefix="legal_kg_ontology",
            cache_type="json",
        )

        self.llm_serving = APILLMServing_request(
            api_url="https://api.openai.com/v1/chat/completions",
            model_name="gpt-4o",
            max_workers=20,
        )

        self.ontology_loader_step1 = LegalKGGetBasicOntology(lang="zh")
        self.triple_extractor_step2 = LegalKGTupleExtraction(
            llm_serving=self.llm_serving,
            triple_type="relation",
            lang="zh",
        )
        self.triple_filter_step3 = LegalKGTripleFilter()
        self.case_similarity_eval_step4 = LegalKGCaseSummarySimilarity(
            llm_serving=self.llm_serving,
            lang="zh",
        )
        self.case_similarity_filter_step5 = LegalKGCaseSimilarityFilter()
        self.judgement_prediction_step6 = LegalKGJudgementPrediction(
            llm_serving=self.llm_serving,
            lang="zh",
        )

    def forward(self):
        self.ontology_loader_step1.run(
            storage=self.ontology_storage.step(),
        )

        self.triple_extractor_step2.run(
            storage=self.storage.step(),
            input_key="raw_chunk",
            input_key_meta="legal_ontology",
            output_key="triple",
            output_key_meta1="entity_class",
            output_key_meta2="case_summary",
        )

        self.triple_filter_step3.run(
            storage=self.storage.step(),
            input_key="triple",
            input_key_class="entity_class",
            input_key_meta="legal_ontology",
            target_ontology="自然人",
            output_key="filtered_triple",
        )

        self.case_similarity_eval_step4.run(
            storage=self.storage.step(),
            input_key="case_summary",
            input_key_meta=["盗窃案件"],
            output_key="similarity_score",
        )

        self.case_similarity_filter_step5.run(
            storage=self.storage.step(),
            input_key="filtered_triple",
            output_key="similarity_score",
            min_score=0.6,
            max_score=1.0,
        )

        self.judgement_prediction_step6.run(
            storage=self.storage.step(),
            input_key="filtered_triple",
            input_key_meta=["张三盗窃一部苹果手机，价值人民币6000元"],
            output_key_judgement="judgement",
            output_key_reason="reason",
        )


if __name__ == "__main__":
    pipeline = LegalKGPipeline()
    pipeline.forward()
```
