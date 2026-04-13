---
title: 通用知识图谱抽取流水线
createTime: 2026/04/13 11:30:00
permalink: /zh/kg_guide/kg_pipelines_by_domains/kgextractionpipeline/
---

## 1. 概述

**通用知识图谱抽取流水线**的核心目标是从非结构化文本中抽取实体与关系三元组，并通过关系推理、去重和有效性验证生成更干净、更可靠的知识图谱构建结果。该流水线首先从原始文本中识别候选实体，然后基于候选实体抽取关系三元组，再对已有三元组进行隐含关系推理，随后去除重复三元组，最后使用大模型判断三元组的语义有效性。

我们支持以下应用场景：

- 从通用文本、百科文本、技术文档或领域语料中抽取实体和关系三元组
- 为后续知识图谱构建、图谱补全或图谱问答准备结构化三元组数据
- 基于已有关系三元组推理隐含关系，扩展知识图谱闭包
- 对抽取和推理得到的三元组进行去重与有效性验证，提升下游数据质量

该流水线的主要流程包括：

1. **实体抽取**：`KGEntityExtraction` 从 `raw_chunk` 中抽取候选实体，并写入 `entity`。
2. **关系三元组抽取**：`KGTripleExtraction` 使用 `raw_chunk` 和 `entity` 抽取关系型 `triple`。
3. **关系三元组推理**：`KGRelationTripleInference` 基于已有 `triple` 推理隐含三元组，并通过 `merge_to_input=True` 合并回 `triple`。
4. **三元组去重**：`KGTupleRemoveRepeated` 对合并后的 `triple` 进行严格去重。
5. **三元组有效性验证**：`KGTupleValidity` 判断去重后的 `triple` 是否语义合理，并输出 `valid_triple`。

在当前流水线实例中，我们选择关系型三元组抽取与关系型三元组验证，使 `.py` 文件保持首尾相连的线性结构。`KGTripleExtraction` 也支持属性型抽取，但属性型结果不适合作为本文中 `KGRelationTripleInference` 的直接输入，因此不放入这条线性示例。

## 2. 快速开始

### 步骤 1：安装 DataFlow-KG

```bash
pip install dataflow-kg
```

### 步骤 2：创建新的 DataFlow 工作目录

```bash
mkdir run_kg_extraction_pipeline
cd run_kg_extraction_pipeline
```

### 步骤 3：初始化 DataFlow

```bash
dataflow init
```

你会看到：

```shell
run_dataflow/api_pipelines/kg_extraction_pipeline.py
```

如果初始化模板中暂未包含该文件，可以手动新建 `kg_extraction_pipeline.py`，并将本文第 4 节的流水线源码写入该文件。

### 步骤 4：配置 API Key 和 API URL

Linux 和 macOS：

```shell
export DF_API_KEY="sk-xxxxx"
```

Windows PowerShell：

```powershell
$env:DF_API_KEY = "sk-xxxxx"
```

在 `kg_extraction_pipeline.py` 中配置 `api_url`：

```python
self.llm_serving = APILLMServing_request(
    api_url="https://api.openai.com/v1/chat/completions",
    model_name="gpt-4o",
    max_workers=20,
)
```

### 步骤 5：准备输入数据

推荐输入文件为 `jsonl`，至少包含以下字段：

- `raw_chunk`：待处理的原始文本

示例：

```jsonl
{"raw_chunk":"Ada Lovelace collaborated with Charles Babbage on the Analytical Engine. Lovelace wrote notes about the Analytical Engine and described an algorithm for computing Bernoulli numbers. Charles Babbage designed the Analytical Engine, which influenced later programmable computing concepts. Lovelace was associated with the early history of computer programming, and the Analytical Engine is often discussed as an important precursor to modern computers."}
```

### 步骤 6：一键执行

```bash
python kg_extraction_pipeline.py
```

接下来将介绍该流水线中的数据流、算子组成和参数配置方式。

## 3. 数据流和流水线逻辑

### 3.1 输入数据

该流水线的输入数据主要包含以下字段：

- **raw_chunk**：原始文本，可以来自通用语料、网页文本、文档段落或领域文本。

输入数据可以存储为 `jsonl` 文件，并通过 `FileStorage` 读取：

```python
self.storage = FileStorage(
    first_entry_file_name="./input/kg_extraction_input.jsonl",
    cache_path="./cache_kg_extraction",
    file_name_prefix="kg_extraction_pipeline",
    cache_type="jsonl",
)
```

### 3.2 实体抽取

第一步使用 `KGEntityExtraction` 从 `raw_chunk` 中抽取候选实体：

- 输入：`raw_chunk`
- 输出：`entity`

`entity` 会作为下一步关系三元组抽取的实体约束，帮助 `KGTripleExtraction` 只围绕已识别实体生成结构化关系。

### 3.3 关系三元组抽取

第二步使用 `KGTripleExtraction` 抽取关系型知识图谱三元组：

- 输入：`raw_chunk`
- 实体输入：`entity`
- 参数：`triple_type="relation"`
- 输出：`triple`

在该流水线中，`KGTripleExtraction` 的输出会被后续关系推理算子继续消费，因此这里使用关系型三元组模式，而不是属性型抽取模式。

### 3.4 关系三元组推理

第三步使用 `KGRelationTripleInference` 基于已有 `triple` 推理隐含三元组：

- 输入：`triple`
- 输出：`inferred_triple`
- 关键参数：`merge_to_input=True`

`merge_to_input=True` 会将推理得到的 `inferred_triple` 合并回原始 `triple` 列。这样下一步去重算子仍然可以读取 `triple`，从而保证流水线是严格首尾相连的。

### 3.5 三元组去重

第四步使用 `KGTupleRemoveRepeated` 对合并后的 `triple` 进行严格去重：

- 输入：`triple`
- 输出：`triple`

该算子会删除完全相同的三元组字符串，减少抽取和推理阶段可能产生的重复结果。

### 3.6 三元组有效性验证

第五步使用 `KGTupleValidity` 对去重后的 `triple` 进行语义有效性判断：

- 输入：`triple`
- 参数：`triple_type="relation"`
- 输出：`valid_triple`

`valid_triple` 保存通过大模型语义验证后的三元组，可作为后续知识图谱入库、图谱问答或图谱推理任务的输入。

### 3.7 输出数据

最终输出通常包含以下字段：

- **triple**：经过推理合并和去重后的关系三元组
- **valid_triple**：经过语义有效性验证后保留的三元组

由于 `KGTupleRemoveRepeated` 会将去重结果写入新的三元组表，最终文件会重点保留清洗后的 `triple` 及其验证结果。如果需要保留原始文本和实体列，可以在实际项目中将去重步骤替换为自定义保留上下文的清洗逻辑。

## 4. 流水线实例

```python
from dataflow.serving import APILLMServing_request
from dataflow.utils.storage import FileStorage
from dataflow.operators.general_kg.generate.kg_entity_extractor import (
    KGEntityExtraction,
)
from dataflow.operators.general_kg.generate.kg_triple_extractor import (
    KGTripleExtraction,
)
from dataflow.operators.general_kg.generate.kg_rel_triple_inference import (
    KGRelationTripleInference,
)
from dataflow.operators.general_kg.filter.kg_tuple_remove_repeated import (
    KGTupleRemoveRepeated,
)
from dataflow.operators.general_kg.filter.kg_tuple_validation import (
    KGTupleValidity,
)


class KGExtractionPipeline:
    def __init__(self):
        self.storage = FileStorage(
            first_entry_file_name="./input/kg_extraction_input.jsonl",
            cache_path="./cache_kg_extraction",
            file_name_prefix="kg_extraction_pipeline",
            cache_type="jsonl",
        )

        self.llm_serving = APILLMServing_request(
            api_url="https://api.openai.com/v1/chat/completions",
            model_name="gpt-4o",
            max_workers=20,
        )

        self.entity_extractor_step1 = KGEntityExtraction(
            llm_serving=self.llm_serving,
            lang="en",
        )
        self.triple_extractor_step2 = KGTripleExtraction(
            llm_serving=self.llm_serving,
            triple_type="relation",
            lang="en",
        )
        self.triple_inference_step3 = KGRelationTripleInference(
            llm_serving=self.llm_serving,
            lang="en",
            merge_to_input=True,
        )
        self.tuple_dedup_step4 = KGTupleRemoveRepeated(
            lang="en",
        )
        self.tuple_validation_step5 = KGTupleValidity(
            llm_serving=self.llm_serving,
            lang="en",
            triple_type="relation",
        )

    def forward(self):
        self.entity_extractor_step1.run(
            storage=self.storage.step(),
            input_key="raw_chunk",
            output_key="entity",
        )

        self.triple_extractor_step2.run(
            storage=self.storage.step(),
            input_key="raw_chunk",
            input_key_meta="entity",
            output_key="triple",
        )

        self.triple_inference_step3.run(
            storage=self.storage.step(),
            input_key="triple",
            output_key="inferred_triple",
        )

        self.tuple_dedup_step4.run(
            storage=self.storage.step(),
            input_key="triple",
            output_key="triple",
        )

        self.tuple_validation_step5.run(
            storage=self.storage.step(),
            input_key="triple",
            output_key="valid_triple",
        )


if __name__ == "__main__":
    model = KGExtractionPipeline()
    model.forward()
```
