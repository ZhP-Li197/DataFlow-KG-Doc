---
title: FinKGEventImpactTracing
createTime: 2026/04/13 09:00:00
permalink: /en/kg_operators/domain_kg/financial_kg/refine/finkg_event_impact_tracing/
---

## 📚 Overview

`FinKGEventImpactTracing` traces event impact paths from Financial KG evidence tuples. The operator requires a `tuple` column and at least one of `raw_event_text` or `target_event`. If `target_entity` is present, it is used as an additional anchor during reasoning.

It writes eight output columns:

- `detected_event`
- `detected_entities`
- `event_impact_analysis`
- `impacted_entities`
- `impact_types`
- `event_impact_paths`
- `event_impact_confidence`
- `event_impact_evidence_tuple`

`event_impact_paths` is expected to be built by joining exact evidence tuple strings with `" || "`.

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
| `k_hops` | `int` | `2` | Graph expansion depth around events or entities |
| `max_context_tuples` | `int` | `24` | Maximum number of context tuples sent to the model |

## 💡 `run` Function

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

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Input/output storage object |
| `ontology_lists` | `Optional[dict]` | `None` | Financial ontology passed directly; otherwise loaded from `./.cache/api/finkg_ontology.json` |
| `input_key_tuple` | `str` | `"tuple"` | Evidence tuple column, required |
| `input_text_key` | `Optional[str]` | `"raw_event_text"` | Raw event text column, optional |
| `input_event_key` | `Optional[str]` | `"target_event"` | Explicit target event column, optional |
| `input_target_key` | `Optional[str]` | `"target_entity"` | Optional target entity column |
| `input_key_meta` | `str` | `"finkg_ontology"` | Ontology cache name |
| `output_detected_event_key` | `str` | `"detected_event"` | Detected event text |
| `output_detected_entities_key` | `str` | `"detected_entities"` | Detected anchor entities |
| `output_summary_key` | `str` | `"event_impact_analysis"` | Impact analysis summary |
| `output_entity_key` | `str` | `"impacted_entities"` | Impacted entities |
| `output_type_key` | `str` | `"impact_types"` | Impact type labels |
| `output_path_key` | `str` | `"event_impact_paths"` | Impact propagation paths |
| `output_confidence_key` | `str` | `"event_impact_confidence"` | Confidence label, with `"low"` as the fallback default |
| `output_evidence_key` | `str` | `"event_impact_evidence_tuple"` | Evidence tuples selected by the model |

## 🤖 Example Usage

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

#### Example Input

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

#### Example Output

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


