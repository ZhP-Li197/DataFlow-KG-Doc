---
title: Introduction
icon: mdi:tooltip-text-outline
createTime: 2025/06/13 14:51:34
permalink: /en/kg_guide/intro/basicinfo/intro/
---

# Introduction

Graph data, as an important carrier of structured knowledge, is playing an increasingly significant role in knowledge-enhanced retrieval, question answering systems, recommendation systems, reasoning and analysis, as well as domain-specific intelligent applications. Compared with plain text data, graph data can explicitly represent entities, relations, attributes, and their complex structures, which not only improves the precision of knowledge organization and representation, but also provides stronger structured knowledge support for large language models. In the era of rapidly advancing large language models, how to efficiently construct, clean, enhance, and utilize graph data has become one of the key challenges in promoting the development of knowledge-enhanced intelligent systems.

However, the current workflow for graph data processing still faces substantial challenges. On the one hand, graph data comes from diverse sources and heterogeneous formats, often involving multiple stages such as extraction from raw text, schema alignment, entity disambiguation, relation completion, and quality evaluation. On the other hand, existing graph processing workflows still largely rely on scattered scripts and manual implementation, lacking unified, systematic, and scalable tool support. Although some existing tools can support graph database management, graph algorithm analysis, or partial knowledge extraction tasks, there is still a lack of a unified framework for full-process graph data processing, especially one that effectively integrates large language models for intelligent graph construction and processing.

To address this issue, we propose **DataFlow-KG**, a systematic framework for graph data processing. **DataFlow-KG** inherits the core design philosophy of **DataFlow**, and is built upon modular, extensible, and composable operators and multi-stage pipelines. Tailored to the characteristics of graph data, it provides a complete processing system that supports key stages including graph construction, cleaning, enhancement, reasoning, and evaluation. By combining rule-based methods, deep learning models, and large language models, DataFlow-KG offers a unified and efficient solution for the construction and utilization of high-quality graph data.

## DataFlow-KG: A Complete System for Graph Data Processing

**DataFlow-KG** is a system dedicated to graph data processing and construction. It is designed to perform **extraction, cleaning, enhancement, reasoning, and evaluation** on multi-source heterogeneous graph data and their related raw data, in order to obtain high-quality graph resources that can be used for downstream tasks and model training. With the support of high-quality graph data, we can further improve the capabilities of large language models in tasks such as knowledge-enhanced question answering, graph reasoning, domain modeling, and complex decision-making.

Specifically, to address the core requirements in graph data processing, we have developed a diverse set of operators. These operators cover multiple aspects, including graph schema construction, entity and relation extraction, knowledge fusion, graph completion, graph reasoning, and graph evaluation. They are implemented based on rule-based methods, deep learning models, large language models (LLMs), and LLM APIs. We further systematically integrate these operators into multiple graph processing pipelines, forming the complete **DataFlow-KG system** to support efficient processing and flexible construction of graph data in different scenarios.

In addition, DataFlow-KG inherits DataFlow’s design philosophy in automation and intelligent processing, supporting the flexible combination of existing operators according to task requirements, so that customized data processing workflows can be constructed for different graph-related tasks. This makes the system not only unified and reusable, but also better suited to the evolving demands of graph applications.