---
title: 多模态图谱环境安装
createTime: 2026/04/07 09:00:00
permalink: /zh/kg_operators/mmkg/install/
---

# 安装

```bash
pip install dataflow-kg[vllm]
```

`mmkg` 目录下的视觉三元组抽取与多模态问答生成算子需要支持多图输入的 VLM 服务；两个链接类算子还依赖外部百科或 Wikidata 接口可访问。
