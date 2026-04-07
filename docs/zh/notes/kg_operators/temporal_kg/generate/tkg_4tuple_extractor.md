---
title: TKGTupleExtraction
createTime: 2026/04/07 09:00:00
permalink: /zh/kg_operators/temporal_kg/generate/tkg_4tuple_extractor/
---

#### 📚 概述

`TKGTupleExtraction` 用于从原始文本中抽取时序四元组。通过 `triple_type` 可以在关系四元组和属性四元组之间切换，输出统一写入 `tuple` 列，适合作为时序图谱流水线的起点。

常见输入列是 `raw_chunk`，常见输出列是 `tuple`。

#### 📚 `__init__` 函数

```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    triple_type: str = "attribute",
    seed: int = 0,
    lang: str = "en",
    num_q: int = 5
):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 用于执行时序四元组抽取的模型服务 |
| `triple_type` | `str` | `"attribute"` | 取 `"attribute"` 时抽取属性四元组，取 `"relation"` 时抽取关系四元组 |
| `seed` | `int` | `0` | 随机种子 |
| `lang` | `str` | `"en"` | 提示词语言 |
| `num_q` | `int` | `5` | 预留参数，当前实现中未直接参与 `run` 逻辑 |

#### 💡 `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "raw_chunk",
    output_key: str = "tuple"
):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | 读取和写回 DataFrame 的存储对象 |
| `input_key` | `str` | `"raw_chunk"` | 待抽取文本所在列 |
| `output_key` | `str` | `"tuple"` | 写回抽取结果的列名 |

`run` 会先校验列名，再逐行调用提示模板和 LLM，最后把解析出的四元组列表写入输出列。若文本为空、质量检查不通过或模型输出无法解析为合法 JSON，则该行输出空列表。

#### 🤖 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.temporal_kg.generate.tkg_4tuple_extractor import TKGTupleExtraction

storage = FileStorage(
    first_entry_file_name="dataflow/data_for_operator_testing/tkg_rel.json",
    cache_path="./cache",
    file_name_prefix="tkg_extract",
    cache_type="json",
).step()

op = TKGTupleExtraction(
    llm_serving=llm_serving,
    triple_type="relation",
    lang="en"
)
op.run(storage=storage, input_key="raw_chunk", output_key="tuple")
```

输入示例：

```json
{
  "raw_chunk": "After graduating from Stanford University in 2004, Elon Musk founded SpaceX in 2002 and took over Tesla Motors as CEO in 2008."
}
```

输出示例：

```json
{
  "tuple": [
    "<subj> Elon Musk <obj> Stanford University <rel> graduated from <time> 2004",
    "<subj> Elon Musk <obj> SpaceX <rel> founded <time> 2002",
    "<subj> Elon Musk <obj> Tesla Motors <rel> took over as CEO <time> 2008"
  ]
}
```
