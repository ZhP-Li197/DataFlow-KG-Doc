---
title: Temporal KG Environment Installation
createTime: 2026/04/07 09:00:00
permalink: /en/kg_operators/temporal_kg/install/
---

# Installation

```bash
pip install dataflow-kg[vllm]
```

Most temporal KG operators in this package rely on LLM serving for extraction, QA generation, and disambiguation. If you only need rule-based operators such as `TKGTupleMerger`, `TKGTupleTimeFilter`, or `TKGTemporalStatistics`, the base package is enough.
