---
title: 医学领域知识图谱流水线
icon: medical-icon:i-laboratory
createTime: 2026/04/13 10:30:00
permalink: /zh/kg_guide/kg_pipelines_by_domains/medicalkgpipeline/
---

## 1. 概述

**医学领域知识图谱流水线**的核心目标是从医学文本中抽取结构化知识，并围绕药物、疾病、基因等医学实体构建可用于下游分析的高质量三元组数据。该流水线首先加载医学本体作为约束，然后进行医学三元组抽取，再按照目标本体筛选关键关系，最后基于筛选后的医学证据路径生成药物作用机制解释。

我们支持以下应用场景：

- 从医学文献、临床报告或药物说明文本中抽取结构化三元组
- 围绕药物、疾病、基因等实体构建医学领域知识图谱
- 根据指定医学本体筛选目标三元组，例如筛选 `treats`、`affects` 等关系
- 基于知识图谱候选证据生成药物作用机制解释

该流水线的主要流程包括：

1. **医学本体加载**：使用 `MedKGGetDrugTherapyOntology` 生成药物与治疗相关本体，供后续抽取和筛选步骤使用。
2. **医学三元组抽取**：使用 `MedKGTripleExtraction` 从 `raw_chunk` 文本中抽取 `triple` 和 `entity_class`。
3. **目标本体筛选**：使用 `MedKGTripleFilter` 根据目标本体筛选三元组，例如只保留关系为 `treats` 的三元组。
4. **作用机制发现**：使用 `MedKGTripleDrugActionMechanismDiscovery` 基于 `query` 和筛选后的三元组生成 `mechanism_path` 与 `mechanism_answer`。

在当前流水线实例中，我们只选择一个知识发现算子`MedKGTripleDrugActionMechanismDiscovery`作为演示。`MedKGTripleDrugRepositioningDiscovery` 可作为药物重定位场景的替代发现算子；

## 2. 快速开始

### 步骤 1：安装 DataFlow-KG

```bash
pip install dataflow-kg
```

### 步骤 2：创建新的 DataFlow 工作目录

```bash
mkdir run_medkg_pipeline
cd run_medkg_pipeline
```

### 步骤 3：初始化 DataFlow

```bash
dataflow init
```

你会看到：

```shell
run_dataflow/api_pipelines/medical_kg_pipeline.py
```

### 步骤 4：配置 API Key 和 API URL

Linux 和 macOS：

```shell
export DF_API_KEY="sk-xxxxx"
```

Windows PowerShell：

```powershell
$env:DF_API_KEY = "sk-xxxxx"
```

在 `medical_kg_pipeline.py` 中配置 `api_url`：

```python
self.llm_serving = APILLMServing_request(
    api_url="https://api.openai.com/v1/chat/completions",
    model_name="gpt-4o",
    max_workers=20,
)
```

### 步骤 5：准备输入数据

推荐输入文件为 `jsonl`，至少包含以下字段：

- `raw_chunk`：待处理的医学文本
- `query`：用于药物作用机制发现的查询

示例：

```jsonl
{"raw_chunk":"Gefitinib is used to treat EGFR-mutant non-small cell lung cancer. Gefitinib inhibits EGFR tyrosine kinase activity and reduces downstream MAPK and PI3K-AKT signaling. EGFR exon 19 deletion is associated with sensitivity to gefitinib, while the T790M mutation is associated with acquired resistance. Clinical studies report that gefitinib can improve progression-free survival in selected patients with advanced non-small cell lung cancer.","query":"What is the action mechanism of gefitinib in EGFR-mutant non-small cell lung cancer?"}
```

### 步骤 6：一键执行

```bash
python medical_kg_pipeline.py
```

接下来将介绍该流水线中的数据流、算子组成和参数配置方式。

## 3. 数据流和流水线逻辑

### 3.1 输入数据

该流水线的输入数据主要包含以下字段：

- **raw_chunk**：医学原始文本，通常来自医学文献、临床描述、药物说明或其他医学语料。
- **query**：面向下游知识发现的查询，例如“某药物在某疾病中的作用机制是什么”。

输入数据可以存储为 `jsonl` 文件，并通过 `FileStorage` 读取：

```python
self.storage = FileStorage(
    first_entry_file_name="./input/medical_kg_input.jsonl",
    cache_path="./cache_medkg",
    file_name_prefix="medical_kg_pipeline",
    cache_type="jsonl",
)
```

### 3.2 医学本体加载

流水线第一步使用 `MedKGGetDrugTherapyOntology` 加载药物与治疗相关本体。该算子会生成实体类型与关系类型，并写入缓存路径：

```text
./.cache/medical/drug_therapy_ontology.json
```

该缓存文件随后会被 `MedKGTripleExtraction` 和 `MedKGTripleFilter` 使用，从而保证抽取和筛选步骤共享同一套医学本体约束。

### 3.3 医学三元组抽取

第二步使用 `MedKGTripleExtraction` 从 `raw_chunk` 中抽取医学三元组：

- 输入：`raw_chunk`
- 本体输入：`drug_therapy_ontology`
- 输出：`triple`、`entity_class`

`triple` 保存抽取出的医学关系三元组，`entity_class` 保存三元组中实体对应的类型信息。二者会作为后续筛选算子的输入。

### 3.4 目标本体筛选

第三步使用 `MedKGTripleFilter` 对抽取结果进行筛选：

- 输入：`triple`、`entity_class`
- 本体输入：`drug_therapy_ontology`
- 筛选目标：`target_ontology="treats"`
- 输出：`filtered_triple`

在示例流水线中，我们选择 `treats` 作为目标关系，保留药物治疗疾病相关三元组。你也可以根据本体内容替换为其他目标，例如 `affects`、`binds` 或某个实体类型。

### 3.5 药物作用机制发现

第四步使用 `MedKGTripleDrugActionMechanismDiscovery` 生成药物作用机制解释：

- 输入：`query`、`filtered_triple`
- 输出：`mechanism_path`、`mechanism_answer`

该算子会根据筛选后的三元组构建候选图路径，并结合查询由大模型生成作用机制解释。这里使用 `filtered_triple` 作为输入，确保上一步筛选结果真正进入下游发现步骤。

### 3.6 可选替换与扩展

如果目标任务是药物重定位，可以将最后一步替换为 `MedKGTripleDrugRepositioningDiscovery`，并将输出列改为 `reposition_path` 和 `reposition_answer`。

如果目标任务是元路径分析，可以单独使用 `MedKGMetaPathGenerator` 读取 `triple` 和 `entity_class` 进行路径匹配。但该算子当前会输出新的单列表格，因此更适合作为独立分析流水线，而不是直接放入本文的线性 `.py` 示例。

### 3.7 输出数据

最终输出数据通常包含以下字段：

- **raw_chunk**：原始医学文本
- **query**：医学知识发现查询
- **triple**：抽取出的医学三元组
- **entity_class**：三元组实体类型
- **filtered_triple**：按目标本体筛选后的三元组
- **mechanism_path**：用于作用机制解释的候选路径
- **mechanism_answer**：生成的药物作用机制解释

## 4. 流水线实例

```python
from dataflow.serving import APILLMServing_request
from dataflow.utils.storage import FileStorage
from dataflow.operators.domain_kg.utils.medkg_get_drug_therapy_ontology import (
    MedKGGetDrugTherapyOntology,
)
from dataflow.operators.domain_kg.medical_kg.generate.medkg_triple_extractor import (
    MedKGTripleExtraction,
)
from dataflow.operators.domain_kg.utils.medkg_triple_ontology_filtering import (
    MedKGTripleFilter,
)
from dataflow.operators.domain_kg.medical_kg.generate.medkg_triple_drug_action_mechanism_discovery import (
    MedKGTripleDrugActionMechanismDiscovery,
)


class MedicalKGPipeline:
    def __init__(self):
        self.storage = FileStorage(
            first_entry_file_name="./input/medical_kg_input.jsonl",
            cache_path="./cache_medkg",
            file_name_prefix="medical_kg_pipeline",
            cache_type="jsonl",
        )
        self.ontology_storage = FileStorage(
            first_entry_file_name="",
            cache_path="./cache_medkg_ontology",
            file_name_prefix="medical_kg_ontology",
            cache_type="json",
        )

        self.llm_serving = APILLMServing_request(
            api_url="https://api.openai.com/v1/chat/completions",
            model_name="gpt-4o",
            max_workers=20,
        )

        self.ontology_loader_step1 = MedKGGetDrugTherapyOntology()
        self.triple_extractor_step2 = MedKGTripleExtraction(
            llm_serving=self.llm_serving,
            lang="en",
        )
        self.triple_filter_step3 = MedKGTripleFilter()
        self.mechanism_discovery_step4 = MedKGTripleDrugActionMechanismDiscovery(
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
            input_key_meta="drug_therapy_ontology",
            output_key="triple",
            output_key_meta="entity_class",
        )

        self.triple_filter_step3.run(
            storage=self.storage.step(),
            input_key_triple="triple",
            input_key_class="entity_class",
            input_key_meta="drug_therapy_ontology",
            target_ontology="treats",
            output_key="filtered_triple",
        )

        self.mechanism_discovery_step4.run(
            storage=self.storage.step(),
            input_key_query="query",
            input_key_triple="filtered_triple",
            output_key_path="mechanism_path",
            output_key_answer="mechanism_answer",
        )


if __name__ == "__main__":
    pipeline = MedicalKGPipeline()
    pipeline.forward()
```
