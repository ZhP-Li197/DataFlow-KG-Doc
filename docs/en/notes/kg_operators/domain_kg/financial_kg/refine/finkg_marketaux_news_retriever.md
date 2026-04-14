---
title: FinKGMarketauxNewsRetriever
createTime: 2026/04/13 09:00:00
permalink: /en/kg_operators/domain_kg/financial_kg/refine/finkg_marketaux_news_retriever/
---

## 📚 Overview

`FinKGMarketauxNewsRetriever` fetches recent financial news for a target entity from Marketaux and writes a structured news context back to the dataframe. It requires at least `target_entity`; if `symbol` or `country` is available, the operator uses them as retrieval hints.

It writes six output columns:

- `marketaux_symbol`
- `marketaux_entity_name`
- `marketaux_news`
- `marketaux_news_context`
- `marketaux_avg_sentiment`
- `marketaux_news_count`

## ✒️ `__init__` Function

```python
def __init__(
    self,
    api_token: Optional[str] = None,
    request_timeout: int = 20,
    default_limit: int = 8,
    default_lookback_days: int = 7,
    default_language: str = "en",
    default_country: str = "us",
    filter_entities: bool = True,
    must_have_entities: bool = True,
    group_similar: bool = True,
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `api_token` | `Optional[str]` | `None` | Marketaux API token; falls back to `MARKETAUX_API_TOKEN` when omitted |
| `request_timeout` | `int` | `20` | HTTP timeout in seconds |
| `default_limit` | `int` | `8` | Default maximum number of fetched news items |
| `default_lookback_days` | `int` | `7` | Default lookback window in days |
| `default_language` | `str` | `"en"` | Default news language |
| `default_country` | `str` | `"us"` | Default country code |
| `filter_entities` | `bool` | `True` | Whether to enable Marketaux entity filtering |
| `must_have_entities` | `bool` | `True` | Whether returned articles must contain entities |
| `group_similar` | `bool` | `True` | Whether to group similar news items |

## 💡 `run` Function

```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_target_key: str = "target_entity",
    input_symbol_key: Optional[str] = "symbol",
    input_country_key: Optional[str] = "country",
    output_symbol_key: str = "marketaux_symbol",
    output_name_key: str = "marketaux_entity_name",
    output_news_key: str = "marketaux_news",
    output_context_key: str = "marketaux_news_context",
    output_sentiment_key: str = "marketaux_avg_sentiment",
    output_count_key: str = "marketaux_news_count",
    lookback_days: Optional[int] = None,
    limit: Optional[int] = None,
    language: Optional[str] = None,
) -> List[str]:
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Input/output storage object |
| `input_target_key` | `str` | `"target_entity"` | Target entity column, required |
| `input_symbol_key` | `Optional[str]` | `"symbol"` | Optional ticker-symbol column |
| `input_country_key` | `Optional[str]` | `"country"` | Optional country-code column |
| `output_symbol_key` | `str` | `"marketaux_symbol"` | Resolved symbol column |
| `output_name_key` | `str` | `"marketaux_entity_name"` | Resolved entity name column |
| `output_news_key` | `str` | `"marketaux_news"` | Simplified article list |
| `output_context_key` | `str` | `"marketaux_news_context"` | Text context assembled from simplified articles |
| `output_sentiment_key` | `str` | `"marketaux_avg_sentiment"` | Average sentiment score |
| `output_count_key` | `str` | `"marketaux_news_count"` | Number of matched articles |
| `lookback_days` | `Optional[int]` | `None` | Runtime override for lookback days |
| `limit` | `Optional[int]` | `None` | Runtime override for news count limit |
| `language` | `Optional[str]` | `None` | Runtime override for language |

Each item in `marketaux_news` is normalized into a dictionary with fields such as `uuid`, `title`, `snippet`, `url`, `source`, `published_at`, `entity_name`, `entity_symbol`, `entity_type`, `entity_match_score`, `entity_sentiment_score`, and `highlights`.

## 🤖 Example Usage

```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.financial_kg.refine.finkg_marketaux_news_retriever import (
    FinKGMarketauxNewsRetriever,
)

storage = DummyStorage()
storage.set_data([
    {
        "target_entity": "Apple Inc.",
        "symbol": "AAPL",
        "country": "us"
    }
])

op = FinKGMarketauxNewsRetriever(default_limit=3, default_lookback_days=5)
op.run(storage=storage)
```

#### Example Input

```json
{
  "target_entity": "Apple Inc.",
  "symbol": "AAPL",
  "country": "us"
}
```

#### Example Output

```json
{
  "marketaux_symbol": "AAPL",
  "marketaux_entity_name": "Apple Inc.",
  "marketaux_news": [
    {
      "uuid": "news-001",
      "title": "Apple expands on-device AI features",
      "snippet": "Apple announced a broader rollout of on-device AI capabilities.",
      "url": "https://example.com/apple-ai",
      "source": "Reuters",
      "published_at": "2026-04-11T09:30:00Z",
      "entity_name": "Apple Inc.",
      "entity_symbol": "AAPL",
      "entity_type": "equity",
      "entity_match_score": 98.2,
      "entity_sentiment_score": 0.23,
      "highlights": [
        "Apple plans a wider rollout of AI features."
      ]
    }
  ],
  "marketaux_news_context": "[1] 2026-04-11T09:30:00Z | Reuters | Apple expands on-device AI features\nentity=Apple Inc. (AAPL), sentiment=0.230, match=98.200\nsnippet: Apple announced a broader rollout of on-device AI capabilities.\nhighlights: Apple plans a wider rollout of AI features.",
  "marketaux_avg_sentiment": 0.23,
  "marketaux_news_count": 1
}
```


