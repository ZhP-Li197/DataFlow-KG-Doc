---
title: HRKGTupleAttributeFrequencyEvaluator
createTime: 2026/04/13 00:00:00
permalink: /zh/kg_operators/hyper_relation_kg/eval/hrkg_rel_triple_attri_summary/
---

## 📚 概述

[HRKGTupleAttributeFrequencyEvaluator](https://github.com/ZhP-Li197/DataFlow-KG/tree/main/dataflow/operators/hyper_relation_kg/eval/hrkg_rel_triple_attri_summary.py) 是一个超关系知识图谱元组属性频率统计评估算子。它分析输入元组列表中的属性标签，计算整个数据集中每个属性标签（如 Time、Location、Value、Capacity）的出现次数和频率分布。算子使用正则表达式从元组字符串中提取尖括号内的属性标签，聚合所有元组的统计数据，帮助用户了解超关系知识图中属性覆盖和分布特征。

## ✒️ `__init__`函数

```python
def __init__(self):
```

#### 参数说明

此算子没有初始化参数。

#### Prompt 模板

此算子基于规则，不使用 LLM Prompt 模板。

## 💡 `run`函数

`run` 从 `storage` 读取 DataFrame，验证存储可用，并遍历每一行。对于元组列表中的每个元组（支持 Python 列表和 JSON 字符串格式），使用正则表达式提取尖括号括起的属性标签（如 `<Time>`、`<Location>`、`<Value>`、`<Capacity>`）。它跨整个数据集聚合属性出现次数，然后计算每个属性的相对频率为 `count / total_tuples`。聚合结果作为包含 `attribute_counts` 和 `attribute_frequencies` 列的单行 DataFrame 写入。函数返回包含两个输出键字符串的列表。

```python
def run(self, storage: DataFlowStorage = None, input_key: str = "tuple", output_key: str = "attribute_counts", output_key_meta: str = "attribute_frequencies"):
```

#### 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| **storage** | DataFlowStorage | None | DataFlow 存储实例，负责数据读写。 |
| **input_key** | str | "tuple" | 输入列名，对应超关系元组列表字段。每行可以是 Python 列表或 JSON 编码的字符串。 |
| **output_key** | str | "attribute_counts" | 属性出现次数的输出列名；将每个属性标签映射到其总计数。 |
| **output_key_meta** | str | "attribute_frequencies" | 属性相对频率的输出列名；将每个属性标签映射到 `count / total_tuples`。 |

## 🤖 示例用法

```python
from dataflow.operators.hyper_relation_kg.eval import HRKGTupleAttributeFrequencyEvaluator
from dataflow.utils.storage import FileStorage

storage = FileStorage(first_entry_file_name="hrkg_attribute_stats.json")

operator = HRKGTupleAttributeFrequencyEvaluator()
operator.run(
    storage.step(),
    input_key="tuple",
    output_key="attribute_counts",
    output_key_meta="attribute_frequencies",
)
```

#### 🧾 默认输出格式（Output Format）

| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| **attribute_counts** | **Dict[str, int]** | 属性标签到出现次数的映射（如 `{"Time": 120, "Location": 85, "Value": 60}`）。 |
| **attribute_frequencies** | **Dict[str, float]** | 属性标签到相对频率的映射；频率计算为 `count / total_tuples`。 |

**示例输入：**

```json
[
  {
    "tuple": [
      "<subj> Elon Musk <obj> Announcement <rel> MadeAt <Time> May 15, 2025 <Location> Tesla Gigafactory, Berlin, Germany",
      "<subj> Tesla Model Y <obj> 4680 Battery <rel> WillAdopt <Time> Third quarter of 2025 <Location> European market",
      "<subj> Tesla Model Y <obj> Cruising Range <rel> IncreasedTo <Value> 600 kilometers",
      "<subj> Tesla Model Y <obj> Price <rel> RemainsUnchanged <Value> 49,990 euros",
      "<subj> Berlin Gigafactory <obj> Production <rel> Started <Time> March 2022 <Capacity> 500,000 vehicles <Market> European Union, United Kingdom, Norway"
    ]
  }
]
```

**示例输出：**

```json
{
  "attribute_counts": {
    "Time": 3,
    "Location": 2,
    "Value": 2,
    "Capacity": 1,
    "Market": 1
  },
  "attribute_frequencies": {
    "Time": 0.6,
    "Location": 0.4,
    "Value": 0.4,
    "Capacity": 0.2,
    "Market": 0.2
  }
}
```

---

#### 相关链接

- 算子实现：`DataFlow-KG/dataflow/operators/hyper_relation_kg/eval/hrkg_rel_triple_attri_summary.py`
