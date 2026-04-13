---
title: FinKGEntityRiskAssessment
createTime: 2026/04/13 09:00:00
permalink: /zh/kg_operators/domain_kg/financial_kg/refine/finkg_entity_risk_assessment/
---

## 📚 概述

`FinKGEntityRiskAssessment` 用于基于金融图谱证据评估目标实体风险。输入必须包含 `tuple` 和 `target_entity`，并结合金融本体推断风险类型、风险实体、关键路径和总体风险分数。

算子会写回：

- `risk_assessment`
- `risk_types`
- `risk_entities`
- `risk_paths`
- `risk_score`
- `risk_evidence_tuple`

其中 `risk_score` 是 `0` 到 `100` 的整数估计值，`risk_paths` 要由原始证据四元组逐字拼接得到。

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
| `k_hops` | `int` | `2` | 风险证据检索时的跳数 |
| `max_context_tuples` | `int` | `24` | 最多送入模型的证据四元组数量 |

## 💡 `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage = None,
    ontology_lists: Optional[Dict[str, Any]] = None,
    input_key_tuple: str = "tuple",
    input_target_key: str = "target_entity",
    input_key_meta: str = "finkg_ontology",
    output_summary_key: str = "risk_assessment",
    output_type_key: str = "risk_types",
    output_entity_key: str = "risk_entities",
    output_path_key: str = "risk_paths",
    output_confidence_key: str = "risk_score",
    output_evidence_key: str = "risk_evidence_tuple",
) -> List[str]:
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | 输入输出存储对象 |
| `ontology_lists` | `Optional[dict]` | `None` | 直接传入金融本体；为空时从缓存读取 |
| `input_key_tuple` | `str` | `"tuple"` | 证据四元组列名，必需 |
| `input_target_key` | `str` | `"target_entity"` | 目标实体列名，必需 |
| `input_key_meta` | `str` | `"finkg_ontology"` | 本体缓存文件名 |
| `output_summary_key` | `str` | `"risk_assessment"` | 风险分析文本 |
| `output_type_key` | `str` | `"risk_types"` | 风险类型标签列表 |
| `output_entity_key` | `str` | `"risk_entities"` | 风险传导或暴露相关实体列表 |
| `output_path_key` | `str` | `"risk_paths"` | 风险路径列表 |
| `output_confidence_key` | `str` | `"risk_score"` | 风险分数列名 |
| `output_evidence_key` | `str` | `"risk_evidence_tuple"` | 支撑判断的证据四元组 |

## 🤖 示例用法

```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.financial_kg.refine.finkg_entity_risk_assessment import (
    FinKGEntityRiskAssessment,
)

storage = DummyStorage()
storage.set_data([
    {
        "target_entity": "Regional Bank A",
        "tuple": [
            "<subj> Regional Bank A <obj> Commercial Real Estate <rel> heavily_exposed_to <time> 2025-Q4",
            "<subj> Regional Bank A <obj> Short-term Funding Market <rel> depends_on <time> 2025-Q4"
        ]
    }
])

op = FinKGEntityRiskAssessment(llm_serving=llm_serving, lang="en")
op.run(storage=storage)
```

#### 输入示例

```json
{
  "target_entity": "Regional Bank A",
  "tuple": [
    "<subj> Regional Bank A <obj> Commercial Real Estate <rel> heavily_exposed_to <time> 2025-Q4",
    "<subj> Regional Bank A <obj> Short-term Funding Market <rel> depends_on <time> 2025-Q4"
  ]
}
```

#### 输出示例

```json
{
  "risk_assessment": "Regional Bank A shows concentrated exposure to real estate assets and funding rollover pressure.",
  "risk_types": [
    "credit_risk",
    "liquidity_risk"
  ],
  "risk_entities": [
    "Commercial Real Estate",
    "Short-term Funding Market"
  ],
  "risk_paths": [
    "<subj> Regional Bank A <obj> Commercial Real Estate <rel> heavily_exposed_to <time> 2025-Q4 || <subj> Regional Bank A <obj> Short-term Funding Market <rel> depends_on <time> 2025-Q4"
  ],
  "risk_score": 78,
  "risk_evidence_tuple": [
    "<subj> Regional Bank A <obj> Commercial Real Estate <rel> heavily_exposed_to <time> 2025-Q4",
    "<subj> Regional Bank A <obj> Short-term Funding Market <rel> depends_on <time> 2025-Q4"
  ]
}
```


