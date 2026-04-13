---
title: FinKGInvestmentAnalysis
createTime: 2026/04/13 09:00:00
permalink: /zh/kg_operators/domain_kg/financial_kg/refine/finkg_investment_analysis/
---

## 📚 概述

`FinKGInvestmentAnalysis` 基于金融图谱证据四元组生成投资分析结果。算子要求输入中至少有 `tuple` 和 `target_entity` 两列；如果存在 `marketaux_news_context` 会直接使用，否则在 `auto_fetch_marketaux_news=True` 时自动调用 `FinKGMarketauxNewsRetriever` 拉取新闻上下文。

输出包括：

- `investment_analysis`
- `bullish_signals`
- `bearish_signals`
- `watch_items`
- `investment_key_paths`
- `investment_confidence`
- `investment_evidence_tuple`

其中 `investment_key_paths` 由原始证据四元组用 `" || "` 拼接而成。

## ✒️ `__init__` 函数

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

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象 |
| `lang` | `str` | `"en"` | Prompt 语言 |
| `k_hops` | `int` | `2` | 图谱上下文扩展跳数 |
| `max_context_tuples` | `int` | `20` | 最多送入模型的证据四元组数量 |

## 💡 `run` 函数

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

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | 输入输出存储对象 |
| `ontology_lists` | `Optional[dict]` | `None` | 直接传入本体；为空时从缓存文件读取 |
| `input_key_tuple` | `str` | `"tuple"` | 图谱证据四元组列名，必需 |
| `input_target_key` | `str` | `"target_entity"` | 目标分析实体列名，必需 |
| `input_symbol_key` | `Optional[str]` | `"symbol"` | 可选股票代码列名 |
| `input_country_key` | `Optional[str]` | `"country"` | 可选国家代码列名 |
| `input_news_key` | `Optional[str]` | `"marketaux_news_context"` | 现成新闻上下文列名 |
| `auto_fetch_marketaux_news` | `bool` | `True` | 缺少新闻上下文时是否自动补抓 Marketaux 新闻 |
| `input_key_meta` | `str` | `"finkg_ontology"` | 本体缓存文件名 |
| `output_summary_key` | `str` | `"investment_analysis"` | 投资分析文本 |
| `output_bullish_key` | `str` | `"bullish_signals"` | 利多信号列表 |
| `output_bearish_key` | `str` | `"bearish_signals"` | 利空信号列表 |
| `output_watch_key` | `str` | `"watch_items"` | 观察要点列表 |
| `output_path_key` | `str` | `"investment_key_paths"` | 支撑路径列表 |
| `output_confidence_key` | `str` | `"investment_confidence"` | 置信度标签，默认回退值为 `"low"` |
| `output_evidence_key` | `str` | `"investment_evidence_tuple"` | 关键证据四元组列表 |

## 🤖 示例用法

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

#### 输入示例

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

#### 输出示例

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


