---
title: 时序图谱环境安装
createTime: 2026/04/07 09:00:00
permalink: /zh/kg_operators/temporal_kg/install/
---

# 安装

```bash
pip install dataflow-kg[vllm]
```

时序图谱目录中的抽取、问答生成和歧义消解算子依赖大语言模型服务；如果你使用远程模型服务，基础包也可以运行纯规则类算子，如 `TKGTupleMerger`、`TKGTupleTimeFilter` 和 `TKGTemporalStatistics`。
