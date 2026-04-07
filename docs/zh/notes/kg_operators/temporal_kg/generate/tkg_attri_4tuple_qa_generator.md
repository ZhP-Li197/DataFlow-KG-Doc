---
title: TKGAttriuteQAGeneration
createTime: 2026/04/07 09:00:00
permalink: /zh/kg_operators/temporal_kg/generate/tkg_attri_4tuple_qa_generator/
---

#### 📚 概述

`TKGAttriuteQAGeneration` 根据属性型时序子图生成问答对，适合构造时间点、事件顺序、时间顺序和时间区间类数据。输入通常是 `subgraph` 列，输出是 `QA_pairs` 列。

#### 📚 `__init__` 函数

```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    qa_type: str = "time_interval",
    num_q: int = 5
):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 用于生成问答对的模型服务 |
| `seed` | `int` | `0` | 随机种子 |
| `lang` | `str` | `"en"` | 提示词语言 |
| `qa_type` | `str` | `"time_interval"` | 支持 `time_point`、`event_order`、`time_order`、`time_interval` |
| `num_q` | `int` | `5` | 预留参数，当前实现中未直接控制输出条数 |

#### 💡 `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "subgraph",
    output_key: str = "QA_pairs"
):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | 输入输出存储对象 |
| `input_key` | `str` | `"subgraph"` | 属性型子图列 |
| `output_key` | `str` | `"QA_pairs"` | 写回问答对的列名 |

`run` 会逐行把子图传给对应的时间问答提示模板，解析返回 JSON 中的 `QA_pairs` 字段并写回 DataFrame。

#### 🤖 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.temporal_kg.generate.tkg_attri_4tuple_qa_generator import TKGAttriuteQAGeneration

storage = FileStorage(
    first_entry_file_name="dataflow/data_for_operator_testing/tkg_attri_qa.json",
    cache_path="./cache",
    file_name_prefix="tkg_attri_qa",
    cache_type="json",
).step()

op = TKGAttriuteQAGeneration(
    llm_serving=llm_serving,
    qa_type="time_interval",
    lang="en"
)
op.run(storage=storage, input_key="subgraph", output_key="QA_pairs")
```

输入示例：

```json
{
  "subgraph": [
    "<entity> Elon Musk <attribute> company founded <value> SpaceX <time> 2002",
    "<entity> Elon Musk <attribute> company founded <value> Neuralink <time> 2016"
  ]
}
```

输出示例：

```json
{
  "QA_pairs": [
    {
      "question": "How many years passed between Elon Musk founding SpaceX and Neuralink?",
      "answer": "14 years."
    }
  ]
}
```
