---
title: CSKGRelationTripleQAGeneration
createTime: 2026/04/01 17:05:00
icon: material-symbols:deployed-code-outline
permalink: /zh/kg_operators/commonsense_kg/generate/cskg_rel_triple_qa_generator/
---

## 📚 概述
`CSKGRelationTripleQAGeneration` 是一个用于基于常识三元组生成问答对的生成类算子。
它读取已有的关系三元组或三元组集合，调用大模型生成 `QA_pairs`，并将结果写回 DataFrame，适合用于常识 QA 数据构造、训练样本合成或评测数据扩展。

这个算子的几个关键特点如下：

- 依赖 `LLMServingABC` 提供问答生成能力
- 根据 `qa_type` 在 `single`、`set`、`multi` 三种 Prompt 模式之间切换
- 默认输出列为 `QA_pairs`
- `qa_type='set'` 时会强制读取 `set_triple` 列，而不是外部传入的 `input_key`
- 模型响应会按 JSON 对象解析，并提取其中的 `QA_pairs` 字段

---

## ✒️ __init__ 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    qa_type: str = "set",
):
    ...
```

## `__init__` 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象。算子通过 `generate_from_input` 基于三元组生成 QA 对。 |
| `seed` | `int` | `0` | 用于初始化内部随机数生成器。当前主流程中未进一步使用随机行为。 |
| `lang` | `str` | `"en"` | Prompt 语言。算子会根据该值初始化对应的默认 Prompt。 |
| `qa_type` | `str` | `"set"` | QA 生成模式。`single` 使用单关系三元组 Prompt，`set` 使用集合三元组 Prompt，`multi` 使用多关系三元组 Prompt。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "triple",
    output_key: str = "QA_pairs",
):
    ...
```

`run` 会先根据 `qa_type` 决定实际读取的输入列，然后从 `storage` 中读取 DataFrame 并检查输入列与输出列状态。随后算子会把输入三元组列表交给内部批处理逻辑：对每一行，算子通过对应 Prompt 构造输入，让大模型返回 QA 对，并从模型响应中解析出 `QA_pairs` 字段，最终结果写回到 `output_key` 指定的列中。

## `run` 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将生成的 QA 对写回。 |
| `input_key` | `str` | `"triple"` | 输入三元组列名。需要注意，若 `qa_type='set'`，当前实现会忽略该值并强制改为 `set_triple`。 |
| `output_key` | `str` | `"QA_pairs"` | 输出列名，用于保存生成的问答对。 |

---

## 🤖 示例用法
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.commonsense_kg.generate.cskg_rel_triple_qa_generator import (
    CSKGRelationTripleQAGeneration,
)

llm_serving = YourLLMServing(...)

operator = CSKGRelationTripleQAGeneration(
    llm_serving=llm_serving,
    qa_type="single",
    lang="en",
)
operator.run(
    storage=storage,
    input_key="triple",
    output_key="QA_pairs",
)
```

---

## 默认输出格式

| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `triple` / `set_triple` | `list` | 输入三元组或三元组集合。实际使用哪一列取决于 `qa_type`。 |
| `QA_pairs` | `list` | 生成的问答对列表。若模型解析失败，则为 `[]`。 |

---

### 示例输入

```json
[
  {
    "triple": [
        "<subj> Tom <obj> umbrella <rel> uses",
    ]
  }
]
```

### 示例输出

```json
[
  {
    "triple": [
        "<subj> Tom <obj> umbrella <rel> uses",
    ],
    "QA_pairs": [
      {
        "question": "What does Tom use when it rains?",
        "answer": "umbrella"
      }
    ]
  }
]
```

---

### 相关链接

- 算子实现：`DataFlow-KG/dataflow/operators/commonsense_kg/generate/cskg_rel_triple_qa_generator.py`
- 默认 Prompt：`DataFlow-KG/dataflow/prompts/diverse_kg/cskg.py`
- 上游三元组抽取算子：`DataFlow-KG/dataflow/operators/commonsense_kg/generate/cskg_triple_extractor.py`
