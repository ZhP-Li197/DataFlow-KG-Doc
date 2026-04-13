---
title: GeoKGRelationInference
createTime: 2026/04/13 09:00:00
permalink: /zh/kg_operators/domain_kg/geospatial_kg/refine/geokg_rel_4tuple_inference/
---

## 📚 概述

`GeoKGRelationInference` 根据已有地理四元组和本体，推断两个实体之间可能成立的关系。算子会先从输入 `tuple` 中筛出与 `entity_pair` 相关的条目，再调用 LLM 做关系推理。

输出列默认是 `inferred_tuple`，其中保存的是新推断出的四元组列表。

## ✒️ `__init__` 函数

```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    lang: str = "en",
    seed: int = 0
):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象 |
| `lang` | `str` | `"en"` | Prompt 语言 |
| `seed` | `int` | `0` | 随机种子 |

## 💡 `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage = None,
    entity_pair: List[str] = ["Hubei", "China"],
    input_key_tuple: str = "tuple",
    input_key_meta: str = "ontology",
    output_key: str = "inferred_tuple"
) -> List[str]:
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | 输入输出存储对象 |
| `entity_pair` | `List[str]` | `["Hubei", "China"]` | 需要推断关系的两个实体，长度必须为 2 |
| `input_key_tuple` | `str` | `"tuple"` | 现有地理四元组列名 |
| `input_key_meta` | `str` | `"ontology"` | 本体缓存文件名，实际从 `./.cache/api/{input_key_meta}.json` 读取 |
| `output_key` | `str` | `"inferred_tuple"` | 推断结果输出列名 |

如果当前行中找不到和 `entity_pair` 相关的条目，当前行输出为空列表。模型返回的 JSON 会从键 `"tuple"` 中解析出推断结果。

## 🤖 示例用法

```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.geospatial_kg.refine.geokg_rel_4tuple_inference import (
    GeoKGRelationInference,
)

storage = DummyStorage()
storage.set_data([
    {
        "tuple": [
            "<subj> Wuhan <obj> Hubei <rel> located_in <time> NA",
            "<subj> Hubei <obj> China <rel> located_in <time> NA"
        ]
    }
])

op = GeoKGRelationInference(llm_serving=llm_serving, lang="en")
op.run(storage=storage, entity_pair=["Wuhan", "China"])
```

#### 输入示例

```json
{
  "tuple": [
    "<subj> Wuhan <obj> Hubei <rel> located_in <time> NA",
    "<subj> Hubei <obj> China <rel> located_in <time> NA"
  ]
}
```

#### 输出示例

```json
{
  "inferred_tuple": [
    "<subj> Wuhan <obj> China <rel> located_in <time> NA"
  ]
}
```


