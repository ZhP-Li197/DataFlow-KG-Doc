---
title: KGRelationTriplePathQAGeneration
createTime: 2026/04/11 12:00:00
permalink: /zh/kg_operators/general_kg/generate/kg_rel_triple_path_qa_generator/
---

## 📚 概述
`KGRelationTriplePathQAGeneration` 用于从知识图谱路径三元组生成问答对。它既支持单跳路径，也支持多跳路径，并通过不同 Prompt 模板引导模型生成与路径相关的 QA。

当 `hop=1` 时，算子默认读取 `triple` 列；当 `hop>1` 时，输入列名会被拼成 `"{hop}_{input_key_meta}"`，例如 `2_hop_paths`。模型返回后，算子会解析 JSON 中的 `QA_pairs`，并要求每个样本至少包含 2 个 QA 对，否则该样本会被丢弃。

## ✒️ __init__ 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang="en",
    hop=1,
    num_q: int = 5
):
    ...
```

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象。 |
| `seed` | `int` | `0` | 内部随机数种子。 |
| `lang` | `str` | `"en"` | Prompt 语言。 |
| `hop` | `int` | `1` | 路径 hop 数。`1` 使用单跳模板，`2` 使用双跳模板。 |
| `num_q` | `int` | `5` | 预留的问答数量参数，当前实现中未直接参与后处理。 |

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key_meta: str = "hop_paths",
    output_key: str = "QA_pairs"
):
    ...
```

`run` 会根据 `hop` 选择真实输入列名，然后校验 DataFrame。`process_batch()` 会逐条路径构造 Prompt 并调用模型，再从返回 JSON 中提取 `QA_pairs`。如果 `QA_pairs` 不是列表或数量少于 2，当前样本不会进入结果列表。最终 `run` 将解析成功且满足约束的 QA 对写回 `output_key`。

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | DataFrame 存储对象。 |
| `input_key_meta` | `str` | `"hop_paths"` | 多跳模式下输入列名后缀。 |
| `output_key` | `str` | `"QA_pairs"` | 输出问答对列名。 |

## 🤖 示例用法
```python
from dataflow.operators.general_kg.generate.kg_rel_triple_path_qa_generator import (
    KGRelationTriplePathQAGeneration,
)

operator = KGRelationTriplePathQAGeneration(
    llm_serving=llm_serving,
    lang="en",
    hop=2,
)

operator.run(
    storage=storage,
    input_key_meta="hop_paths",
    output_key="QA_pairs",
)
```

默认输入输出格式如下：

| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `triple` / `2_hop_paths` | `str` | 输入路径字符串。单跳时为单条三元组；二跳时通常为两条三元组使用 `||` 连接。 |
| `QA_pairs` | `List[str]` | 生成的问答对字符串列表，每项格式为 `"Question: ... Answer: ..."`。 |

示例输入：

```json
[
  {
    "2_hop_paths": "<subj> Einstein <obj> Germany <rel> born_in || <subj> Germany <obj> Europe <rel> part_of"
  }
]
```

示例输出：

```json
[
  {
    "QA_pairs": [
      "Question: ... Answer: ...",
      "Question: ... Answer: ..."
    ]
  }
]
```

相关文件：

- 算子实现：`DataFlow-KG/dataflow/operators/general_kg/generate/kg_rel_triple_path_qa_generator.py`
- Prompt 定义：`DataFlow-KG/dataflow/prompts/core_kg/rel_triple_generate.py`
