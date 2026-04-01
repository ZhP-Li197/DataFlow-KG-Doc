---
title: TKGTemporalStatistics
createTime: 2026/03/18 00:00:00
icon: material-symbols-light:analytics-outline
permalink: /zh/api/operators/temporal_kg/eval/tkgtemporalstatistics/
---

## 📚 概述

[TKGTemporalStatistics](https://github.com/ZhP-Li197/DataFlow-KG/tree/main/dataflow/operators/temporal_kg/eval/tkg_4tuple_time_summary.py) 是一个时序知识图谱四元组的时间统计评估算子。它对输入的四元组列表进行时间信息统计分析，计算有效时间比例（非 NA 比例）和按年份的时间分布比例。该算子同时支持关系四元组和属性四元组两种格式，能够解析多种时间表达，包括精确日期、月份、年份、季度、季节以及时间区间格式，帮助用户全面了解时序知识图谱中时间信息的覆盖情况与分布特征。

## ✒️ `__init__`函数

```python
def __init__(self):
```

### `init`参数说明

该算子无初始化参数。

### Prompt模板说明

| Prompt 模板名称 | 主要用途 | 适用场景 | 特点说明 |
| --- | --- | --- | --- |

## 💡 `run`函数

```python
def run(self, storage: DataFlowStorage, input_key: str = "tuple", output_key: str = "temporal_statistics"):
```

#### `参数`

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| **storage** | DataFlowStorage | 必需 | 数据流存储实例，负责读取与写入数据。 |
| **input_key** | str | "tuple" | 输入列名，对应四元组列表字段。每行应为 `List[str]`。 |
| **output_key** | str | "temporal_statistics" | 输出列名，对应生成的时间统计结果字段。 |

## 🤖 示例用法

```python
from dataflow.operators.temporal_kg.eval import TKGTemporalStatistics
from dataflow.utils.storage import FileStorage

storage = FileStorage(first_entry_file_name="tkg_rel.json")

operator = TKGTemporalStatistics()
operator.run(
    storage.step(),
    input_key="tuple",
    output_key="temporal_statistics",
)
```

#### 🧾 默认输出格式（Output Format）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| tuple | List[str] | 输入的四元组列表（保留原始字段）。 |
| temporal_statistics | Dict | 时间统计结果，包含以下子字段。 |
| temporal_statistics.total_tuples | int | 四元组总数。 |
| temporal_statistics.valid_time_tuples | int | 含有效时间（非 NA）的四元组数量。 |
| temporal_statistics.non_na_ratio | float | 有效时间比例（valid_time_tuples / total_tuples）。 |
| temporal_statistics.year_distribution | Dict[int, float] | 按年份的时间分布比例。 |

**示例输入：**

```json
{
  "tuple": [
    "<subj> Elon Musk <obj> Stanford University <rel> graduated from &lt;time&gt; 2004",
    "<subj> Elon Musk <obj> multiple technology companies <rel> co-founded &lt;time&gt; NA",
    "<subj> Elon Musk <obj> Tesla Motors <rel> took over as CEO &lt;time&gt; 2008",
    "<subj> Elon Musk <obj> SpaceX <rel> founded &lt;time&gt; 2002",
    "<subj> SpaceX <obj> ISS <rel> first commercial spacecraft docking with &lt;time&gt; 2012"
  ]
}
```

**示例输出：**

```json
{
  "tuple": ["...（同上）"],
  "temporal_statistics": {
    "total_tuples": 5,
    "valid_time_tuples": 4,
    "non_na_ratio": 0.8,
    "year_distribution": {
      "2002": 0.25,
      "2004": 0.25,
      "2008": 0.25,
      "2012": 0.25
    }
  }
}
```