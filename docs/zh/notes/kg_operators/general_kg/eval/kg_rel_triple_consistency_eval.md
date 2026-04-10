---
title: KGRelationTripleConsistencyEvaluator
createTime: 2026/04/10 15:40:44
permalink: /zh/kg_operators/general_kg/eval/kg_rel_triple_consistency_eval/
---

## 📚 概述
`KGRelationTripleConsistencyEvaluator` 是一个用于评估知识图谱关系三元组逻辑一致性的评估类算子。
它会读取每一行中的三元组列表，先将其构建为内部图结构，再通过采样边并结合局部上下文，调用大模型判断三元组之间是否存在逻辑冲突，最终输出一致性得分。

这个算子的几个关键特点如下：

- 依赖 `LLMServingABC` 提供大模型评估能力
- 默认使用 `KGRelationConsistencyEvaluationPrompt` 构造提示词
- 支持通过 `sample_rate` 和 `max_samples` 控制采样比例与上限，提升大规模图的评估效率
- 支持可选的 `test_triple` 列：若存在则对全量测试三元组评估，否则对 `triple` 列进行采样评估
- 当模型调用失败、返回非法 JSON 或输入为空时，当前行得分回退为 `0.0`

---

## ✒️ __init__ 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    sample_rate: float = 1,
    max_samples: int = 10,
    lang: str = "en"
):
    ...
```

#### `__init__` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象。算子通过 `generate_from_input` 对三元组一致性进行判断。 |
| `sample_rate` | `float` | `1` | 三元组采样比例（相对于图中边的总数）。与 `max_samples` 共同控制实际采样数量。 |
| `max_samples` | `int` | `10` | 每行最多采样的三元组数量上限。 |
| `lang` | `str` | `"en"` | Prompt 语言。构造函数会创建 `KGRelationConsistencyEvaluationPrompt(lang)`。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "triple"
):
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，并逐行取出 `input_key` 和可选的 `test_triple` 列。随后算子调用 `process_batch()` 对每一行进行评估：若当前行存在 `test_triple`，则对全量测试三元组构图并逐边评估；否则对 `triple` 列的三元组进行采样后评估。每条边由算子提取其局部邻居上下文并交由大模型做一致性判断（`CONSISTENT` / `INCONSISTENT`），最终以通过数/总数作为 `logical_consistency_score`。结果固定写入 `logical_consistency_score` 和 `evaluated_sample_indices` 两列。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将评估结果写回。 |
| `input_key` | `str` | `"triple"` | 输入三元组列名。每个单元格通常应为 `List[str]`，也可为 JSON 字符串。 |

---

## 🤖 示例用法
```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.general_kg.eval.kg_rel_triple_consistency_eval import (
    KGRelationTripleConsistencyEvaluator,
)

operator = KGRelationTripleConsistencyEvaluator(
    llm_serving=llm_serving,
    sample_rate=0.8,
    max_samples=10,
    lang="en",
)
operator.run(
    storage=storage,
    input_key="triple",
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `triple` | `List[str]` / `str` | 输入三元组列表，或可被解析为列表的 JSON 字符串。 |
| `logical_consistency_score` | `float` | 采样三元组中判断为一致的比例，取值范围 `[0.0, 1.0]`。 |
| `evaluated_sample_indices` | `List[int]` / `None` | 本次采样评估的三元组索引列表。若使用 `test_triple` 模式则为 `None`。 |

---

#### 示例输入
```json
[
  {
    "triple": [
      "<subj> Earth <obj> Solar System <rel> partOf",
      "<subj> Earth <obj> Sun <rel> orbits",
      "<subj> Sun <obj> Earth <rel> orbits"
    ]
  }
]
```

#### 示例输出
```json
[
  {
    "triple": [
      "<subj> Earth <obj> Solar System <rel> partOf",
      "<subj> Earth <obj> Sun <rel> orbits",
      "<subj> Sun <obj> Earth <rel> orbits"
    ],
    "logical_consistency_score": 0.67,
    "evaluated_sample_indices": [0, 1, 2]
  }
]
```

---

#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/general_kg/eval/kg_rel_triple_consistency_eval.py`
- 默认 Prompt：`DataFlow-KG/dataflow/prompts/core_kg/rel_triple_eval.py`