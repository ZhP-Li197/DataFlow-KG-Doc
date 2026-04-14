---
title: GeoKGTupleExtraction
createTime: 2026/04/13 09:00:00
permalink: /zh/kg_operators/domain_kg/geospatial_kg/generate/geokg_4tuple_extractor/
---

## 📚 概述

`GeoKGTupleExtraction` 用于从地理文本中抽取时空图谱四元组，并同时输出 `entity_class`。算子支持两种模式：

- 关系四元组：`<subj> 实体 <obj> 实体 <rel> 关系 <time> 时间`
- 属性四元组：`<subj> 实体 <attribute> 属性 <value> 值 <time> 时间`

当 `ontology_lists` 为空时，算子会自动读取 `./.cache/api/geokg_ontology.json`。和金融版本一样，数据会同时写入 `tuple` 与 `entity_class` 两列，但 `run` 返回值只有 `[output_key]`。

## ✒️ `__init__` 函数

```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    triple_type: str = "relation",
    lang: str = "en",
    num_q: int = 5
):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象 |
| `seed` | `int` | `0` | 随机种子 |
| `triple_type` | `str` | `"relation"` | 抽取模式，`"relation"` 或 `"attribute"` |
| `lang` | `str` | `"en"` | Prompt 语言 |
| `num_q` | `int` | `5` | 预留参数 |

## 💡 `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage = None,
    ontology_lists=None,
    input_key: str = "raw_chunk",
    input_key_meta: str = "geokg_ontology",
    output_key: str = "tuple",
    output_key_meta: str = "entity_class"
):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | 输入输出存储对象 |
| `ontology_lists` | `dict \| None` | `None` | 直接传入本体；为空时从缓存加载 |
| `input_key` | `str` | `"raw_chunk"` | 输入文本列名 |
| `input_key_meta` | `str` | `"geokg_ontology"` | 本体缓存文件名 |
| `output_key` | `str` | `"tuple"` | 四元组输出列名 |
| `output_key_meta` | `str` | `"entity_class"` | 实体类别输出列名 |

`entity_class` 与 `tuple` 逐项对应。关系四元组通常对应 `[头实体类别, 尾实体类别]`，属性四元组通常对应 `[实体类别]`。

## 🤖 示例用法

```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.geospatial_kg.generate.geokg_4tuple_extractor import (
    GeoKGTupleExtraction,
)

storage = DummyStorage()
storage.set_data([
    {
        "raw_chunk": "Wuhan is located in Hubei and is connected to the Yangtze River."
    }
])

op = GeoKGTupleExtraction(
    llm_serving=llm_serving,
    triple_type="relation",
    lang="en",
)
op.run(storage=storage)
```

#### 输入示例

```json
{
  "raw_chunk": "Wuhan is located in Hubei and is connected to the Yangtze River."
}
```

#### 输出示例

```json
{
  "tuple": [
    "<subj> Wuhan <obj> Hubei <rel> located_in <time> NA",
    "<subj> Wuhan <obj> Yangtze River <rel> connected_to <time> NA"
  ],
  "entity_class": [
    ["City", "Province"],
    ["City", "River"]
  ]
}
```


