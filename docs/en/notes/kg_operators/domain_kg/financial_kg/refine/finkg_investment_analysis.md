---
title: FinKGInvestmentAnalysis
createTime: 2026/04/13 09:00:00
permalink: /en/kg_operators/domain_kg/financial_kg/refine/finkg_investment_analysis/
---

## 📚 Overview

`FinKGInvestmentAnalysis` produces investment analysis from Financial KG evidence tuples. The operator requires `tuple` and `target_entity`. If `marketaux_news_context` is already present, it uses that column directly; otherwise, when `auto_fetch_marketaux_news=True`, it automatically retrieves recent Marketaux news.

It writes:

- `investment_analysis`
- `bullish_signals`
- `bearish_signals`
- `watch_items`
- `investment_key_paths`
- `investment_confidence`
- `investment_evidence_tuple`

`investment_key_paths` is expected to be assembled by joining exact evidence tuples with `" || "`.

## ✒️ `__init__` Function

```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    lang: str = "en",
    k_hops: int = 2,
    max_context_tuples: int = 20,
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM backend |
| `lang` | `str` | `"en"` | Prompt language |
| `k_hops` | `int` | `2` | Graph expansion depth for evidence gathering |
| `max_context_tuples` | `int` | `20` | Maximum number of evidence tuples sent to the model |

## 💡 `run` Function

```python
def run(
    self,
    storage: DataFlowStorage = None,
    ontology_lists: Optional[Dict[str, Any]] = None,
    input_key_tuple: str = "tuple",
    input_target_key: str = "target_entity",
    input_symbol_key: Optional[str] = "symbol",
    input_country_key: Optional[str] = "country",
    input_news_key: Optional[str] = "marketaux_news_context",
    auto_fetch_marketaux_news: bool = True,
    input_key_meta: str = "finkg_ontology",
    output_summary_key: str = "investment_analysis",
    output_bullish_key: str = "bullish_signals",
    output_bearish_key: str = "bearish_signals",
    output_watch_key: str = "watch_items",
    output_path_key: str = "investment_key_paths",
    output_confidence_key: str = "investment_confidence",
    output_evidence_key: str = "investment_evidence_tuple",
) -> List[str]:
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Input/output storage object |
| `ontology_lists` | `Optional[dict]` | `None` | Ontology passed directly; otherwise loaded from cache |
| `input_key_tuple` | `str` | `"tuple"` | Evidence tuple column, required |
| `input_target_key` | `str` | `"target_entity"` | Target entity column, required |
| `input_symbol_key` | `Optional[str]` | `"symbol"` | Optional ticker-symbol column |
| `input_country_key` | `Optional[str]` | `"country"` | Optional country column |
| `input_news_key` | `Optional[str]` | `"marketaux_news_context"` | Existing news-context column |
| `auto_fetch_marketaux_news` | `bool` | `True` | Whether to fetch Marketaux news automatically when no context column is available |
| `input_key_meta` | `str` | `"finkg_ontology"` | Ontology cache name |
| `output_summary_key` | `str` | `"investment_analysis"` | Investment analysis summary |
| `output_bullish_key` | `str` | `"bullish_signals"` | Bullish signals |
| `output_bearish_key` | `str` | `"bearish_signals"` | Bearish signals |
| `output_watch_key` | `str` | `"watch_items"` | Watch-list items |
| `output_path_key` | `str` | `"investment_key_paths"` | Supporting evidence paths |
| `output_confidence_key` | `str` | `"investment_confidence"` | Confidence label, with `"low"` as the fallback default |
| `output_evidence_key` | `str` | `"investment_evidence_tuple"` | Key evidence tuples |

## 🤖 Example Usage

```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.financial_kg.refine.finkg_investment_analysis import (
    FinKGInvestmentAnalysis,
)

storage = DummyStorage()
storage.set_data([
    {
        "target_entity": "Apple Inc.",
        "tuple": [
            "<subj> Apple Inc. <obj> iPhone 16 <rel> releases <time> 2025-09",
            "<subj> Apple Inc. <obj> Services Revenue <attribute> reaches <value> record high <time> 2025-Q4"
        ],
        "marketaux_news_context": "[1] 2026-04-11T09:30:00Z | Reuters | Apple expands on-device AI features"
    }
])

op = FinKGInvestmentAnalysis(llm_serving=llm_serving, lang="en")
op.run(storage=storage)
```

#### Example Input

```json
{
  "target_entity": "Apple Inc.",
  "tuple": [
    "<subj> Apple Inc. <obj> iPhone 16 <rel> releases <time> 2025-09",
    "<subj> Apple Inc. <obj> Services Revenue <attribute> reaches <value> record high <time> 2025-Q4"
  ],
  "marketaux_news_context": "[1] 2026-04-11T09:30:00Z | Reuters | Apple expands on-device AI features"
}
```

#### Example Output

```json
{
  "investment_analysis": "Apple shows product-cycle support and resilient service income, but valuation still needs follow-up observation.",
  "bullish_signals": [
    "New product release supports revenue growth",
    "Services revenue remains strong"
  ],
  "bearish_signals": [
    "Competition in consumer electronics remains intense"
  ],
  "watch_items": [
    "Demand for the new product line",
    "Quarterly margin trend"
  ],
  "investment_key_paths": [
    "<subj> Apple Inc. <obj> iPhone 16 <rel> releases <time> 2025-09 || <subj> Apple Inc. <obj> Services Revenue <attribute> reaches <value> record high <time> 2025-Q4"
  ],
  "investment_confidence": "medium",
  "investment_evidence_tuple": [
    "<subj> Apple Inc. <obj> iPhone 16 <rel> releases <time> 2025-09",
    "<subj> Apple Inc. <obj> Services Revenue <attribute> reaches <value> record high <time> 2025-Q4"
  ]
}
```


