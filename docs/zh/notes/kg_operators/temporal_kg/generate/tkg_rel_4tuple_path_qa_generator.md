---
title: TKGTuplePathQAGeneration
createTime: 2026/04/07 09:00:00
permalink: /zh/kg_operators/temporal_kg/generate/tkg_rel_4tuple_path_qa_generator/
---

#### 📚 概述

`TKGTuplePathQAGeneration` 根据一跳四元组或多跳路径生成时序问答对。`hop=1` 时默认读取 `tuple`，`hop>1` 时会读取类似 `2_hop_paths` 的列，并把结果写到类似 `2_QA_pairs` 的动态列中。

#### 📚 `__init__` 函数

```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    hop: int = 2,
    qa_type: str = "time_point",
    num_q: int = 5
):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 用于生成问答对的模型服务 |
| `seed` | `int` | `0` | 随机种子 |
| `lang` | `str` | `"en"` | 提示词语言 |
| `hop` | `int` | `2` | 路径跳数；`1` 表示直接基于 `tuple` |
| `qa_type` | `str` | `"time_point"` | 支持 `time_point`、`event_order`、`time_order`、`time_interval` |
| `num_q` | `int` | `5` | 预留参数，当前实现中未直接控制输出条数 |

#### 💡 `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key_meta: str = "hop_paths",
    output_key_meta: str = "QA_pairs"
):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | 输入输出存储对象 |
| `input_key_meta` | `str` | `"hop_paths"` | 与 `hop` 组合成真实输入列名，如 `2_hop_paths` |
| `output_key_meta` | `str` | `"QA_pairs"` | 与 `hop` 组合成真实输出列名，如 `2_QA_pairs` |

#### 🤖 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.temporal_kg.generate.tkg_rel_4tuple_path_qa_generator import TKGTuplePathQAGeneration

storage = FileStorage(
    first_entry_file_name="dataflow/data_for_operator_testing/tkg_rel_qa.json",
    cache_path="./cache",
    file_name_prefix="tkg_path_qa",
    cache_type="json",
).step()

op = TKGTuplePathQAGeneration(
    llm_serving=llm_serving,
    hop=2,
    qa_type="time_point",
    lang="en"
)
op.run(storage=storage, input_key_meta="hop_paths", output_key_meta="QA_pairs")
```

输入示例：

```json
{
  "2_hop_paths": "<subj> Elon Musk <obj> SpaceX <rel> founded <time> 2002 || <subj> SpaceX <obj> ISS <rel> first commercial spacecraft docking with <time> 2012"
}
```

输出示例：

```json
{
  "2_QA_pairs": [
    {
      "question": "In what year did the company founded by Elon Musk achieve its first commercial spacecraft docking with the ISS?",
      "answer": "2012."
    }
  ]
}
```
