---
title: 地理时空事件流水线
createTime: 2026/04/15 18:20:00
permalink: /zh/kg_guide/geokg_spatiotemporal_event_pipeline/
icon: carbon:chart-network
---

# 地理时空事件流水线

## 1. 概述

**地理时空事件流水线**面向地理事件抽取与清洗场景。它会先从原始文本中抽取带时间、地点等信息的事件元组，再按时间范围和地点约束进行过滤，随后通过 LLM 对事件合理性和一致性打分，最终得到更加可信的地理事件结果。

该流水线适合以下任务：

- 洪水、火山、地震等地理事件抽取
- 时空范围约束下的事件检索
- GeoKG 数据构建前的事件清洗
- 地理事件监测、分析和下游问答的数据准备

主要阶段包括：

1. **事件抽取**：从原始地理文本中抽取事件元组。
2. **时间过滤**：保留落在指定时间范围内的事件。
3. **地点过滤**：保留发生在目标地点相关范围内的事件。
4. **合理性评估与过滤**：过滤明显不合理的事件。
5. **一致性评估与过滤**：进一步过滤内部不一致的事件。

---

## 2. 快速开始

### 第一步：准备脚本

将下方“流水线实例”中的代码保存为 `geokg_spatiotemporal_event_pipeline.py`。

该流水线可直接读取仓库中的示例输入：

```python
dataflow/data_for_operator_testing/geokg_rel.json
```

### 第二步：配置 API Key

```bash
export DF_API_KEY=sk-xxxx
```

### 第三步：初始化模型服务并运行

```python
from dataflow.serving import APILLMServing_request
from dataflow.statics.pipelines.api_pipelines.geokg_spatiotemporal_event_pipeline import GeoKGSpatiotemporalEventPipeline

llm_serving = APILLMServing_request(
    api_url="https://api.openai.com/v1/chat/completions",
    key_name_of_api_key="DF_API_KEY",
    model_name="gpt-4o-mini",
    max_workers=8,
    temperature=0.0,
)

pipeline = GeoKGSpatiotemporalEventPipeline(
    first_entry_file_name="dataflow/data_for_operator_testing/geokg_rel.json",
    llm_serving=llm_serving,
    cache_path="./cache_geokg_event",
    query_time_start="2024-01-01",
    query_time_end="2024-12-31",
    location_name="China",
    lang="en",
)
pipeline.forward()
```

---

## 3. 数据流和流水线逻辑

### 1. 输入数据

该流水线最少需要一个字段：

- **raw_chunk**：描述时空事件的原始文本。

输入示例如下：

```json
[
  {
    "raw_chunk": "On June 3, 2024, a massive flood occurred along the Yangtze River in China, affecting Hubei, Hunan, and Jiangxi. Several cities including Wuhan and Yichang experienced severe inundation."
  }
]
```

### 2. 地理时空事件流水线逻辑（GeoKGSpatiotemporalEventPipeline）

#### 步骤 1：事件抽取（GeoKGEventExtraction）

**功能：**

- 从原始文本中抽取带时空字段的事件元组
- 为后续过滤和评估提供结构化输入

**输入**：`raw_chunk`  
**输出**：`tuple`

#### 步骤 2：时间过滤（GeoKGEventTupleTimeFilter）

**功能：**

- 根据 `query_time_start` 和 `query_time_end` 过滤事件
- 只保留落在目标时间窗口内的记录

**输入**：`tuple`  
**输出**：`tuple`

#### 步骤 3：地点过滤（GeoKGEventTupleLocationFilter）

**功能：**

- 从 `<location>` 字段中做模糊匹配
- 保留与 `location_name` 相关的地理事件

**输入**：`tuple`  
**输出**：`tuple`

#### 步骤 4：合理性评估（GeoKGEventRationaleEvaluator）

**功能：**

- 判断事件是否具有基本语义合理性
- 为每条事件元组生成 `rationale_scores`

**输入**：`tuple`  
**输出**：`rationale_scores`

#### 步骤 5：合理性过滤（GeoKGEventRationaleFilter）

**输入**：`tuple`、`rationale_scores`  
**输出**：`tuple`

#### 步骤 6：一致性评估（GeoKGEventConsistenceEvaluator）

**功能：**

- 判断事件内部字段之间是否一致
- 例如时间、地点、事件描述之间是否存在明显冲突

**输入**：`tuple`  
**输出**：`consistency_scores`

#### 步骤 7：一致性过滤（GeoKGEventConsistenceFilter）

**输入**：`tuple`、`consistency_scores`  
**输出**：`tuple`

### 3. 输出数据

常见输出字段包括：

- **tuple**：最终保留下来的地理时空事件元组
- **rationale_scores**：合理性得分
- **consistency_scores**：一致性得分

示例输出如下：

```json
{
  "tuple": [
    "<event> Yangtze River flood <location> Wuhan, Hubei, China <time> 2024-06-03 <cause> heavy rainfall <impact> urban inundation",
    "<event> Yangtze River flood control <location> Yichang, Hubei, China <time> 2024-06-03 <impact> downstream damage mitigation"
  ],
  "rationale_scores": [0.98, 0.96],
  "consistency_scores": [0.97, 0.95]
}
```

---

## 4. 流水线实例

以下是 `GeoKGSpatiotemporalEventPipeline` 的完整实现。

```python
from dataflow.core import LLMServingABC
from dataflow.operators.domain_kg.geospatial_kg import (
    GeoKGEventConsistenceEvaluator,
    GeoKGEventConsistenceFilter,
    GeoKGEventExtraction,
    GeoKGEventRationaleEvaluator,
    GeoKGEventRationaleFilter,
    GeoKGEventTupleLocationFilter,
    GeoKGEventTupleTimeFilter,
)
from dataflow.pipeline import PipelineABC
from dataflow.utils.storage import FileStorage


class GeoKGSpatiotemporalEventPipeline(PipelineABC):
    """Geospatial pipeline for extracting and refining spatio-temporal events.

    Required dataset columns:
    - `raw_chunk`: source text describing geographic events
    """

    def __init__(
        self,
        first_entry_file_name: str,
        llm_serving: LLMServingABC,
        cache_path: str = "./cache_local",
        file_name_prefix: str = "geokg_spatiotemporal_event_pipeline_step",
        cache_type: str = "jsonl",
        lang: str = "en",
        query_time_start: str = "Q1 2021",
        query_time_end: str = "2023-12-31",
        location_name: str = "China",
        rationale_min_score: float = 0.95,
        consistency_min_score: float = 0.95,
    ):
        super().__init__()
        if llm_serving is None:
            raise ValueError(
                "llm_serving is required for GeoKGSpatiotemporalEventPipeline"
            )

        self.storage = FileStorage(
            first_entry_file_name=first_entry_file_name,
            cache_path=cache_path,
            file_name_prefix=file_name_prefix,
            cache_type=cache_type,
        )
        self.query_time_start = query_time_start
        self.query_time_end = query_time_end
        self.location_name = location_name
        self.rationale_min_score = rationale_min_score
        self.consistency_min_score = consistency_min_score

        self.event_extraction_step1 = GeoKGEventExtraction(
            llm_serving=llm_serving,
            lang=lang,
        )
        self.time_filter_step2 = GeoKGEventTupleTimeFilter(merge_to_input=True)
        self.location_filter_step3 = GeoKGEventTupleLocationFilter(
            merge_to_input=True
        )
        self.rationale_eval_step4 = GeoKGEventRationaleEvaluator(
            llm_serving=llm_serving,
            lang=lang,
        )
        self.rationale_filter_step5 = GeoKGEventRationaleFilter(
            merge_to_input=True
        )
        self.consistency_eval_step6 = GeoKGEventConsistenceEvaluator(
            llm_serving=llm_serving,
            lang=lang,
        )
        self.consistency_filter_step7 = GeoKGEventConsistenceFilter(
            merge_to_input=True
        )

    def forward(self):
        self.event_extraction_step1.run(
            storage=self.storage.step(),
            input_key="raw_chunk",
            output_key="tuple",
        )
        self.time_filter_step2.run(
            storage=self.storage.step(),
            input_key="tuple",
            output_key="tuple",
            query_time_start=self.query_time_start,
            query_time_end=self.query_time_end,
        )
        self.location_filter_step3.run(
            storage=self.storage.step(),
            input_key="tuple",
            output_key="tuple",
            location_name=self.location_name,
        )
        self.rationale_eval_step4.run(
            storage=self.storage.step(),
            input_key="tuple",
            output_key="rationale_scores",
        )
        self.rationale_filter_step5.run(
            storage=self.storage.step(),
            input_key="tuple",
            score_key="rationale_scores",
            output_key="tuple",
            min_score=self.rationale_min_score,
        )
        self.consistency_eval_step6.run(
            storage=self.storage.step(),
            input_key="tuple",
            output_key="consistency_scores",
        )
        self.consistency_filter_step7.run(
            storage=self.storage.step(),
            input_key="tuple",
            score_key="consistency_scores",
            output_key="tuple",
            min_score=self.consistency_min_score,
        )
```

最小调用示例如下：

```python
from dataflow.serving import APILLMServing_request
from dataflow.statics.pipelines.api_pipelines.geokg_spatiotemporal_event_pipeline import GeoKGSpatiotemporalEventPipeline

llm_serving = APILLMServing_request(
    api_url="https://api.openai.com/v1/chat/completions",
    key_name_of_api_key="DF_API_KEY",
    model_name="gpt-4o-mini",
    max_workers=8,
    temperature=0.0,
)

pipeline = GeoKGSpatiotemporalEventPipeline(
    first_entry_file_name="dataflow/data_for_operator_testing/geokg_rel.json",
    llm_serving=llm_serving,
    cache_path="./cache_geokg_event",
    query_time_start="2024-01-01",
    query_time_end="2024-12-31",
    location_name="China",
    lang="en",
)
pipeline.forward()
```
