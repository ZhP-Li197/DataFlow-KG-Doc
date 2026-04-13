---
title: CSKGRelationTripleSetSampling
createTime: 2026/04/01 17:45:00
permalink: /zh/kg_operators/commonsense_kg/filter/cskg_rel_triple_set_sampling/
---

## 📚 概述
`CSKGRelationTripleSetSampling` 是一个用于常识关系三元组集合采样与构造的过滤类算子。
它会把输入数据中的三元组整体汇总起来，依据主体相似、客体相似或关系相同等规则，生成相关三元组集合，并将集合结果写成新的 DataFrame，适合用于集合式 QA 构造或关系簇分析。

这个算子的几个关键特点如下：

- 不依赖 LLM，而是基于规则、字符串相似度和并行计算生成相关三元组集合
- 默认读取 `triple` 列，默认输出到 `set_triple`
- 支持三种匹配规则：相似主体、相似客体、相同关系
- 支持多进程并行、分块处理和全局去重，适配大规模三元组数据
- 当前实现会把所有输入行的三元组汇总后生成一个新的单列 DataFrame，而不是在原 DataFrame 上逐行追加结果

---

## ✒️ `__init__` 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    num_q: int = 5,
    n_jobs: int = -1
):
    ...
```

#### `__init__` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 预留的大模型服务参数。当前实现没有在采样逻辑中使用该参数。 |
| `seed` | `int` | `0` | 用于初始化内部随机数生成器。当前主流程中未进一步使用随机行为。 |
| `lang` | `str` | `"en"` | 语言参数，会影响字符串相似度计算前的归一化方式。英文模式会做小写化和去空格处理。 |
| `num_q` | `int` | `5` | 预留参数。当前实现中仅保存为实例属性，未参与采样逻辑。 |
| `n_jobs` | `int` | `-1` | 并行进程数。`-1` 表示使用全部 CPU 核心，否则至少为 1。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "triple",
    output_key: str = "set_triple",
    match_rule: int = 1,
    similarity_threshold: float = 0.7,
    deduplicate_sets: bool = True,
    chunk_size: int = 5000
):
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，检查输入列是否存在以及输出列是否冲突。随后，算子会把所有输入行中的三元组整体汇总，去重并解析为 `(subj, rel, obj, raw_triple)` 结构，再根据 `match_rule` 构建相关三元组集合：规则 1 按主体相似聚合，规则 2 按客体相似聚合，规则 3 按相同关系聚合。整个过程支持索引预构建、多进程分块处理和全局去重。最终结果不会附加回原表，而是写成一个仅包含 `output_key` 一列的新 DataFrame。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并写出一个新的集合结果 DataFrame。 |
| `input_key` | `str` | `"triple"` | 输入三元组列名。列中通常每行是一个三元组列表。 |
| `output_key` | `str` | `"set_triple"` | 输出列名，用于保存相关三元组集合。 |
| `match_rule` | `int` | `1` | 匹配规则。`1` 表示相似主体，`2` 表示相似客体，`3` 表示相同关系。 |
| `similarity_threshold` | `float` | `0.7` | 规则 1 和规则 2 中的字符串相似度阈值。 |
| `deduplicate_sets` | `bool` | `True` | 是否对生成的相关集合做全局去重。 |
| `chunk_size` | `int` | `5000` | 分块大小，用于控制并行处理时的内存占用与吞吐。 |

---

## 🤖 示例用法
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.commonsense_kg.filter.cskg_rel_triple_set_sampling import (
    CSKGRelationTripleSetSampling,
)

operator = CSKGRelationTripleSetSampling(
    llm_serving=YourLLMServing(...),
    lang="en",
    n_jobs=1,
)
operator.run(
    storage=storage,
    input_key="triple",
    output_key="set_triple",
    match_rule=3,
    similarity_threshold=0.7,
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `set_triple` | `List[List[str]]` | 相关三元组集合列表。每个元素是一组相关三元组，而不是原始逐行结果。 |

---

#### 示例输入
```json
[
  {
    "triple": [
      "<subj> Tom <obj> umbrella <rel> uses",
      "<subj> Mary <obj> umbrella <rel> uses"
    ]
  },
  {
    "triple": [
      "<subj> Tom <obj> raincoat <rel> uses"
    ]
  }
]
```

#### 示例输出
```json
[
  {
    "set_triple": [
      "<subj> Tom <obj> umbrella <rel> uses",
      "<subj> Mary <obj> umbrella <rel> uses",
      "<subj> Tom <obj> raincoat <rel> uses"
    ]
  }
]
```

---

#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/commonsense_kg/filter/cskg_rel_triple_set_sampling.py`
- 下游 QA 生成算子：`DataFlow-KG/dataflow/operators/commonsense_kg/generate/cskg_rel_triple_qa_generator.py`
- 存储实现：`DataFlow-KG/dataflow/utils/storage.py`

