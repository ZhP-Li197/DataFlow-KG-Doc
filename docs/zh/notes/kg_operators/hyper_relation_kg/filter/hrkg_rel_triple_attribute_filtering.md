---
title: HRKGRelationTripleAttributeFilter
createTime: 2026/04/13 00:00:00
permalink: /zh/kg_operators/hyper_relation_kg/filter/hrkg_rel_triple_attribute_filtering/
---

## 📚 概述

[HRKGRelationTripleAttributeFilter](https://github.com/ZhP-Li197/DataFlow-KG/tree/main/dataflow/operators/hyper_relation_kg/filter/hrkg_rel_triple_attri_filtering.py) 是一个超关系知识图谱三元组属性过滤算子。它通过指定属性标签过滤超关系元组，仅保留包含目标属性的元组。算子解析每个元组字符串以提取其结构化组件（主语、宾语、关系和属性），并对指定属性标签执行字符串级匹配。过滤结果写入新列。

## ✒️ `__init__`函数

```python
def __init__(self, llm_serving: LLMServingABC = None, lang: str = "en"):
```

#### 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | `None` | 预留参数，用于未来扩展（当前未使用）。 |
| `lang` | `str` | `"en"` | 语言设置；用于未来扩展。 |

#### Prompt 模板

此算子基于规则，不使用 LLM Prompt 模板。

## 💡 `run`函数

`run` 从 `storage` 读取 DataFrame，验证其包含 `input_key` 指定的列。然后遍历每一行：如果该行是列表，则调用 `_filter_triples_by_attr()` 仅保留包含指定 `attr_tag` 的元组；否则写入空列表。过滤结果写入 `output_key` 列。函数返回包含 `output_key` 字符串的列表。

```python
def run(self, storage: DataFlowStorage, input_key: str = "tuple", output_key: str = "filtered_tuple", attr_tag: str = "<Location>"):
```

#### 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | 必填 | DataFlow 存储实例，负责数据读写。 |
| `input_key` | `str` | `"tuple"` | 输入列名，对应三元组列表字段。 |
| `output_key` | `str` | `"filtered_tuple"` | 输出列名，对应过滤后的三元组列表字段。 |
| `attr_tag` | `str` | `"<Location>"` | 要过滤的属性标签；仅保留包含此标签的元组。支持任意 `<TagName>` 形式的标签，如 `<Time>`、`<Location>`、`<Value>`、`<Capacity>` 等。 |

## 🤖 示例用法

```python
from dataflow.operators.hyper_relation_kg.filter import HRKGRelationTripleAttributeFilter
from dataflow.utils.storage import FileStorage

storage = FileStorage(first_entry_file_name="hrkg_attribute_filter.json")

filter_op = HRKGRelationTripleAttributeFilter()
filter_op.run(
    storage.step(),
    input_key="tuple",
    output_key="filtered_tuple",
    attr_tag="<Location>",
)
```

#### 🧾 默认输出格式（Output Format）

| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| **tuple** | **List[str]** | 输入的原始三元组列表（保留）。 |
| **filtered_tuple** | **List[str]** | 过滤后的三元组列表，仅包含具有指定属性标签的元组。 |

**示例输入：**

```json
{
  "tuple": [
    "<subj> Elon Musk <obj> Announcement <rel> MadeAt <Time> May 15, 2025 <Location> Tesla Gigafactory, Berlin, Germany",
    "<subj> Tesla Model Y <obj> 4680 Battery <rel> WillAdopt <Time> Third quarter of 2025 <Location> European market",
    "<subj> Tesla Model Y <obj> Cruising Range <rel> IncreasedTo <Value> 600 kilometers",
    "<subj> Tesla Model Y <obj> Price <rel> RemainsUnchanged <Value> 49,990 euros",
    "<subj> Berlin Gigafactory <obj> Production <rel> Started <Time> March 2022 <Capacity> 500,000 vehicles <Market> European Union, United Kingdom, Norway"
  ]
}
```

**示例输出（attr_tag="<Location>"）：**

```json
{
  "tuple": ["...(同上)"],
  "filtered_tuple": [
    "<subj> Elon Musk <obj> Announcement <rel> MadeAt <Time> May 15, 2025 <Location> Tesla Gigafactory, Berlin, Germany",
    "<subj> Tesla Model Y <obj> 4680 Battery <rel> WillAdopt <Time> Third quarter of 2025 <Location> European market"
  ]
}
```

**示例输出（attr_tag="<Time>"）：**

```json
{
  "tuple": ["...(同上)"],
  "filtered_tuple": [
    "<subj> Elon Musk <obj> Announcement <rel> MadeAt <Time> May 15, 2025 <Location> Tesla Gigafactory, Berlin, Germany",
    "<subj> Tesla Model Y <obj> 4680 Battery <rel> WillAdopt <Time> Third quarter of 2025 <Location> European market",
    "<subj> Berlin Gigafactory <obj> Production <rel> Started <Time> March 2022 <Capacity> 500,000 vehicles <Market> European Union, United Kingdom, Norway"
  ]
}
```

---

#### 相关链接

- 算子实现：`DataFlow-KG/dataflow/operators/hyper_relation_kg/filter/hrkg_rel_triple_attri_filtering.py`
