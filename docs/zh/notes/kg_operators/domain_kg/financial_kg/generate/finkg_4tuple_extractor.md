---
title: FinKGTupleExtraction
createTime: 2026/04/13 09:00:00
permalink: /zh/kg_operators/domain_kg/financial_kg/generate/finkg_4tuple_extractor/
---

## 📚 概述

`FinKGTupleExtraction` 用于从金融文本中抽取四元组，并同时输出实体类别标签。算子支持两种格式：

- 关系四元组：`<subj> 实体 <obj> 实体 <rel> 关系 <time> 时间`
- 属性四元组：`<subj> 实体 <attribute> 属性 <value> 值 <time> 时间`

当 `ontology_lists` 为空时，算子会自动读取 `./.cache/api/finkg_ontology.json`。实际写回 `storage` 的列包括 `tuple` 和 `entity_class`，但 `run` 的返回值只有 `[output_key]`。

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
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象，用于执行四元组抽取 |
| `seed` | `int` | `0` | 随机种子 |
| `triple_type` | `str` | `"relation"` | 抽取模式，`"relation"` 使用关系四元组 Prompt，`"attribute"` 使用属性四元组 Prompt |
| `lang` | `str` | `"en"` | Prompt 语言 |
| `num_q` | `int` | `5` | 预留参数，当前实现中不参与核心抽取逻辑 |

## 💡 `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage = None,
    ontology_lists=None,
    input_key: str = "raw_chunk",
    input_key_meta: str = "finkg_ontology",
    output_key: str = "tuple",
    output_key_meta: str = "entity_class"
):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | 输入输出存储对象 |
| `ontology_lists` | `dict \| None` | `None` | 直接传入本体字典；为空时从缓存文件读取 |
| `input_key` | `str` | `"raw_chunk"` | 输入文本列名 |
| `input_key_meta` | `str` | `"finkg_ontology"` | 本体缓存文件名，实际读取路径为 `./.cache/api/{input_key_meta}.json` |
| `output_key` | `str` | `"tuple"` | 四元组输出列名 |
| `output_key_meta` | `str` | `"entity_class"` | 实体类别输出列名 |

算子会逐行读取文本，调用对应 Prompt 抽取四元组，再将结果写入 `tuple` 和 `entity_class` 两列。`entity_class` 与 `tuple` 逐项对齐：关系四元组通常对应 `[头实体类别, 尾实体类别]`，属性四元组通常对应 `[实体类别]`。

## 🤖 示例用法

```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.financial_kg.generate.finkg_4tuple_extractor import (
    FinKGTupleExtraction,
)

storage = DummyStorage()
storage.set_data([
    {
        "raw_chunk": "Apple Inc. released the iPhone 16 in September 2025."
    }
])

op = FinKGTupleExtraction(
    llm_serving=llm_serving,
    triple_type="relation",
    lang="en",
)
op.run(storage=storage)
```

#### 输入示例

```json
{
  "raw_chunk": "Apple Inc. released the iPhone 16 in September 2025."
}
```

#### 输出示例

```json
{
  "tuple": [
    "<subj> Apple Inc. <obj> iPhone 16 <rel> releases <time> 2025-09"
  ],
  "entity_class": [
    ["Company", "Product"]
  ]
}
```


