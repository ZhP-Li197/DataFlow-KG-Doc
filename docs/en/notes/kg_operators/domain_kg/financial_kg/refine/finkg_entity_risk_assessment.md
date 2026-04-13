---
title: FinKGEntityRiskAssessment
createTime: 2026/04/13 09:00:00
permalink: /en/kg_operators/domain_kg/financial_kg/refine/finkg_entity_risk_assessment/
---

## 📚 Overview

`FinKGEntityRiskAssessment` estimates risk for a target entity from Financial KG evidence. The input must contain `tuple` and `target_entity`, and the operator combines them with the financial ontology to infer risk types, risk entities, risk paths, and an overall risk score.

It writes:

- `risk_assessment`
- `risk_types`
- `risk_entities`
- `risk_paths`
- `risk_score`
- `risk_evidence_tuple`

`risk_score` is an integer estimate from `0` to `100`, and `risk_paths` should be composed from exact evidence tuples.

## ✒️ `__init__` Function

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

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM backend |
| `lang` | `str` | `"en"` | Prompt language |
| `k_hops` | `int` | `2` | Expansion depth used when collecting risk evidence |
| `max_context_tuples` | `int` | `24` | Maximum number of evidence tuples sent to the model |

## 💡 `run` Function

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

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Input/output storage object |
| `ontology_lists` | `Optional[dict]` | `None` | Financial ontology passed directly; otherwise loaded from cache |
| `input_key_tuple` | `str` | `"tuple"` | Evidence tuple column, required |
| `input_target_key` | `str` | `"target_entity"` | Target entity column, required |
| `input_key_meta` | `str` | `"finkg_ontology"` | Ontology cache name |
| `output_summary_key` | `str` | `"risk_assessment"` | Risk analysis summary |
| `output_type_key` | `str` | `"risk_types"` | Risk type labels |
| `output_entity_key` | `str` | `"risk_entities"` | Entities involved in risk transmission or concentration |
| `output_path_key` | `str` | `"risk_paths"` | Risk propagation paths |
| `output_confidence_key` | `str` | `"risk_score"` | Risk-score column |
| `output_evidence_key` | `str` | `"risk_evidence_tuple"` | Supporting evidence tuples |

## 🤖 Example Usage

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

#### Example Input

```json
{
  "target_entity": "Regional Bank A",
  "tuple": [
    "<subj> Regional Bank A <obj> Commercial Real Estate <rel> heavily_exposed_to <time> 2025-Q4",
    "<subj> Regional Bank A <obj> Short-term Funding Market <rel> depends_on <time> 2025-Q4"
  ]
}
```

#### Example Output

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


