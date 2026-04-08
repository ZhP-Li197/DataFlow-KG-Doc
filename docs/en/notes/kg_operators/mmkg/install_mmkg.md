---
title: DataFlow-KG Multimodal KG Installation
createTime: 2026/04/07 09:00:00
permalink: /en/kg_operators/mmkg/install/
---

## 📚 Overview

The `mmkg` module contains visual triple extraction, path sampling, subgraph sampling, multimodal QA generation, and encyclopedia/Wikidata linking operators. The visual extraction and QA operators require a VLM backend with multi-image input support, while the two linking operators require online access to Wikipedia, Wikidata, and Wikimedia Commons.

## 🤖 Installation Example

```bash
pip install dataflow-kg[vllm]
```

If you plan to run the linking operators, make sure the runtime environment can reach `wikipedia.org`, `wikidata.org`, and `commons.wikimedia.org`.
