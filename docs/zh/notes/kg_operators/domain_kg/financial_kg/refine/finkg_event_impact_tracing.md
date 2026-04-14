---
title: FinKGEventImpactTracing
createTime: 2026/04/13 09:00:00
permalink: /zh/kg_operators/domain_kg/financial_kg/refine/finkg_event_impact_tracing/
---

## 📚 概述

`FinKGEventImpactTracing` 基于金融图谱中的证据四元组追踪事件影响路径。算子要求存在 `tuple` 列，并且至少提供 `raw_event_text` 或 `target_event` 其中之一；若存在 `target_entity`，会作为额外锚点帮助分析。

输出会写入 8 列：

- `detected_event`
- `detected_entities`
- `event_impact_analysis`
- `impacted_entities`
- `impact_types`
- `event_impact_paths`
- `event_impact_confidence`
- `event_impact_evidence_tuple`

其中 `event_impact_paths` 要求由输入证据四元组原文用 `" || "` 连接而成。

## ✒️ `__init__` 函数

```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    lang: str = "en",
    k_hops: int = 2,
    max_context_tuples: int = 24,
):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象 |
| `lang` | `str` | `"en"` | Prompt 语言 |
| `k_hops` | `int` | `2` | 从事件或实体向外扩展的图谱跳数 |
| `max_context_tuples` | `int` | `24` | 送入模型的最大上下文四元组数量 |

## 💡 `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage = None,
    ontology_lists: Optional[Dict[str, Any]] = None,
    input_key_tuple: str = "tuple",
    input_text_key: Optional[str] = "raw_event_text",
    input_event_key: Optional[str] = "target_event",
    input_target_key: Optional[str] = "target_entity",
    input_key_meta: str = "finkg_ontology",
    output_detected_event_key: str = "detected_event",
    output_detected_entities_key: str = "detected_entities",
    output_summary_key: str = "event_impact_analysis",
    output_entity_key: str = "impacted_entities",
    output_type_key: str = "impact_types",
    output_path_key: str = "event_impact_paths",
    output_confidence_key: str = "event_impact_confidence",
    output_evidence_key: str = "event_impact_evidence_tuple",
) -> List[str]:
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | 输入输出存储对象 |
| `ontology_lists` | `Optional[dict]` | `None` | 直接传入金融本体；为空时从 `./.cache/api/finkg_ontology.json` 读取 |
| `input_key_tuple` | `str` | `"tuple"` | 证据四元组列名，必需 |
| `input_text_key` | `Optional[str]` | `"raw_event_text"` | 事件原文列名，可选 |
| `input_event_key` | `Optional[str]` | `"target_event"` | 目标事件列名，可选 |
| `input_target_key` | `Optional[str]` | `"target_entity"` | 目标实体列名，可选 |
| `input_key_meta` | `str` | `"finkg_ontology"` | 本体缓存文件名 |
| `output_detected_event_key` | `str` | `"detected_event"` | 识别出的事件 |
| `output_detected_entities_key` | `str` | `"detected_entities"` | 识别出的关键实体列表 |
| `output_summary_key` | `str` | `"event_impact_analysis"` | 影响分析文本 |
| `output_entity_key` | `str` | `"impacted_entities"` | 被影响实体列表 |
| `output_type_key` | `str` | `"impact_types"` | 影响类型标签列表 |
| `output_path_key` | `str` | `"event_impact_paths"` | 影响传播路径列表 |
| `output_confidence_key` | `str` | `"event_impact_confidence"` | 置信度标签，默认回退值为 `"low"` |
| `output_evidence_key` | `str` | `"event_impact_evidence_tuple"` | 被模型选中的证据四元组 |

## 🤖 示例用法

```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.financial_kg.refine.finkg_event_impact_tracing import (
    FinKGEventImpactTracing,
)

storage = DummyStorage()
storage.set_data([
    {
        "raw_event_text": "Silicon Valley Bank was fined after its liquidity position worsened.",
        "target_entity": "Silicon Valley Bank",
        "tuple": [
            "<subj> Silicon Valley Bank <obj> US Regulators <rel> fined_by <time> 2024-03",
            "<subj> Silicon Valley Bank <obj> Venture Clients <rel> affects <time> 2024-03"
        ]
    }
])

op = FinKGEventImpactTracing(llm_serving=llm_serving, lang="en")
op.run(storage=storage)
```

#### 输入示例

```json
{
  "raw_event_text": "Silicon Valley Bank was fined after its liquidity position worsened.",
  "target_entity": "Silicon Valley Bank",
  "tuple": [
    "<subj> Silicon Valley Bank <obj> US Regulators <rel> fined_by <time> 2024-03",
    "<subj> Silicon Valley Bank <obj> Venture Clients <rel> affects <time> 2024-03"
  ]
}
```

#### 输出示例

```json
{
  "detected_event": "regulatory fine",
  "detected_entities": [
    "Silicon Valley Bank",
    "US Regulators"
  ],
  "event_impact_analysis": "The fine raises compliance pressure on Silicon Valley Bank and may spill over to its dependent clients.",
  "impacted_entities": [
    "Silicon Valley Bank",
    "Venture Clients"
  ],
  "impact_types": [
    "regulatory",
    "liquidity"
  ],
  "event_impact_paths": [
    "<subj> Silicon Valley Bank <obj> US Regulators <rel> fined_by <time> 2024-03 || <subj> Silicon Valley Bank <obj> Venture Clients <rel> affects <time> 2024-03"
  ],
  "event_impact_confidence": "high",
  "event_impact_evidence_tuple": [
    "<subj> Silicon Valley Bank <obj> US Regulators <rel> fined_by <time> 2024-03",
    "<subj> Silicon Valley Bank <obj> Venture Clients <rel> affects <time> 2024-03"
  ]
}
```


