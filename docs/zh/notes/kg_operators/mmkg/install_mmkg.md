---
title: DataFlow-KG多模态图谱安装
createTime: 2026/04/07 09:00:00
permalink: /zh/kg_operators/mmkg/install/
---

## 📚 概述

`mmkg` 模块包含视觉三元组抽取、路径采样、子图采样、多模态问答生成，以及实体和图片到百科/Wikidata 的链接算子。视觉三元组抽取和 QA 生成算子依赖支持多图输入的 VLM；两个链接算子依赖 Wikipedia、Wikidata 和 Wikimedia Commons 的在线接口。

## 🤖 安装示例

```bash
pip install dataflow-kg[vllm]
```

如果需要运行链接类算子，还要确保当前环境可以访问 `wikipedia.org`、`wikidata.org` 和 `commons.wikimedia.org`。
