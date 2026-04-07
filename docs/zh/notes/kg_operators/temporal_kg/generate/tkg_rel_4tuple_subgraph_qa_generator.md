---
title: TKGTupleSubgraphQAGeneration
createTime: 2026/04/07 09:00:00
permalink: /zh/kg_operators/temporal_kg/generate/tkg_rel_4tuple_subgraph_qa_generator/
---

#### 📚 概述

`TKGTupleSubgraphQAGeneration` 根据时序子图生成问答对。与路径版相比，它直接消费 `subgraph` 列，更适合围绕某个实体局部时间事实生成 QA 数据。

#### 📚 `__init__` 函数

```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
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
| `qa_type` | `str` | `"time_point"` | 支持 `time_point`、`event_order`、`time_order`、`time_interval` |
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
| `input_key` | `str` | `"subgraph"` | 时序子图列 |
| `output_key` | `str` | `"QA_pairs"` | 写回问答对的列名 |

#### 🤖 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.temporal_kg.generate.tkg_rel_4tuple_subgraph_qa_generator import TKGTupleSubgraphQAGeneration

storage = FileStorage(
    first_entry_file_name="dataflow/data_for_operator_testing/tkg_attri_qa.json",
    cache_path="./cache",
    file_name_prefix="tkg_subgraph_qa",
    cache_type="json",
).step()

op = TKGTupleSubgraphQAGeneration(
    llm_serving=llm_serving,
    qa_type="time_order",
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
      "question": "Which happened earlier for Elon Musk, founding SpaceX or founding Neuralink?",
      "answer": "Founding SpaceX happened earlier, in 2002."
    }
  ]
}
```
