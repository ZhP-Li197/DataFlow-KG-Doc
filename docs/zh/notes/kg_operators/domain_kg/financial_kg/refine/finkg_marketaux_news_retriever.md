---
title: FinKGMarketauxNewsRetriever
createTime: 2026/04/13 09:00:00
permalink: /zh/kg_operators/domain_kg/financial_kg/refine/finkg_marketaux_news_retriever/
---

## 📚 概述

`FinKGMarketauxNewsRetriever` 用于从 Marketaux 拉取目标实体的近期金融新闻，并补充结构化新闻上下文。它至少需要 `target_entity` 列；若已有 `symbol` 或 `country` 列，会优先用它们做检索和实体对齐。

算子最终会写回 6 列：

- `marketaux_symbol`
- `marketaux_entity_name`
- `marketaux_news`
- `marketaux_news_context`
- `marketaux_avg_sentiment`
- `marketaux_news_count`

## ✒️ `__init__` 函数

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

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `api_token` | `Optional[str]` | `None` | Marketaux API Token；为空时优先读环境变量 `MARKETAUX_API_TOKEN` |
| `request_timeout` | `int` | `20` | 请求超时时间，单位秒 |
| `default_limit` | `int` | `8` | 默认最多拉取的新闻条数 |
| `default_lookback_days` | `int` | `7` | 默认回溯天数 |
| `default_language` | `str` | `"en"` | 默认新闻语言 |
| `default_country` | `str` | `"us"` | 默认国家代码 |
| `filter_entities` | `bool` | `True` | 是否启用 Marketaux 的实体过滤参数 |
| `must_have_entities` | `bool` | `True` | 是否要求新闻中必须出现实体 |
| `group_similar` | `bool` | `True` | 是否合并相似新闻 |

## 💡 `run` 函数

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

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | 输入输出存储对象 |
| `input_target_key` | `str` | `"target_entity"` | 目标实体列名，必需 |
| `input_symbol_key` | `Optional[str]` | `"symbol"` | 股票代码提示列名，可选 |
| `input_country_key` | `Optional[str]` | `"country"` | 国家代码列名，可选 |
| `output_symbol_key` | `str` | `"marketaux_symbol"` | 解析后的实体代码 |
| `output_name_key` | `str` | `"marketaux_entity_name"` | 解析后的实体名称 |
| `output_news_key` | `str` | `"marketaux_news"` | 精简后的新闻列表 |
| `output_context_key` | `str` | `"marketaux_news_context"` | 由新闻列表拼接出的上下文字符串 |
| `output_sentiment_key` | `str` | `"marketaux_avg_sentiment"` | 平均情绪分 |
| `output_count_key` | `str` | `"marketaux_news_count"` | 命中的新闻数 |
| `lookback_days` | `Optional[int]` | `None` | 本次运行的回溯天数；为空时使用初始化默认值 |
| `limit` | `Optional[int]` | `None` | 本次运行的新闻条数上限 |
| `language` | `Optional[str]` | `None` | 本次运行的新闻语言 |

`marketaux_news` 中的每条新闻会被规整为字典，常见字段包括 `uuid`、`title`、`snippet`、`url`、`source`、`published_at`、`entity_name`、`entity_symbol`、`entity_type`、`entity_match_score`、`entity_sentiment_score` 和 `highlights`。

## 🤖 示例用法

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

#### 输入示例

```json
{
  "target_entity": "Apple Inc.",
  "symbol": "AAPL",
  "country": "us"
}
```

#### 输出示例

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


