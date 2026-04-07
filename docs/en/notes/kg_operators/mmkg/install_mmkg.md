---
title: Multimodal KG Environment Installation
createTime: 2026/04/07 09:00:00
permalink: /en/kg_operators/mmkg/install/
---

# Installation

```bash
pip install dataflow-kg[vllm]
```

The operators under `mmkg` require a VLM backend that supports multi-image input for visual triple extraction and multimodal QA generation. The two linking operators also require access to external encyclopedia or Wikidata endpoints.
