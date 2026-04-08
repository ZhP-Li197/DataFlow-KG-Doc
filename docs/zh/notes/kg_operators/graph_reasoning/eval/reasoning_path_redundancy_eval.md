---
title: KGPathRedundancyEvaluator
createTime: 2026/04/01 16:30:00
permalink: /zh/kg_operators/graph_reasoning/eval/reasoning_path_redundancy_eval/
---

## 📚 概述
`KGPathRedundancyEvaluator` 是一个用于知识图谱多跳路径冗余度评估的评估类算子。
它读取实体对和对应的多跳路径，调用大模型为每条路径打一个 0 到 1 的连续冗余分数，并将结果写回 DataFrame。分数越高，通常表示路径中包含越多重复或多余信息。

这个算子的几个关键特点如下：

- 依赖 `LLMServingABC` 提供路径冗余度评估能力
- 默认使用 `KGReasoningPathRedundancyPrompt` 构造提示词
- 默认读取 `mpath` 和 `target_entity` 两列
- 默认输出列为 `redundancy_scores`
- 输出结果按实体对分组，每个实体对对应一组路径冗余分数

---

## ✒️ __init__ 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    lang: str = "zh"
):
    ...
```

#### `__init__` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象。算子通过 `generate_from_input` 对每组路径进行冗余度评分。 |
| `lang` | `str` | `"zh"` | Prompt 的语言。算子会初始化 `KGReasoningPathRedundancyPrompt(lang)`。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "mpath",
    target_key: str = "target_entity",
    output_key: str = "redundancy_scores"
) -> List[str]:
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，然后把每一行组织成记录列表，交给内部 `process_batch` 逐行处理。对于每一行，算子会遍历实体对对应的路径集合，从 `target_entity` 中提取实体对主语和宾语，再通过 `KGReasoningPathRedundancyPrompt` 生成 Prompt，请大模型返回每条路径的连续冗余分数。模型响应会被解析为 JSON，并提取 `redundancy_scores` 字段；若解析失败，则回退为空列表。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将冗余度评分结果写回。 |
| `input_key` | `str` | `"mpath"` | 输入路径列名。设计上应支持自定义，但当前实现内部多数逻辑仍按默认列名读取。 |
| `target_key` | `str` | `"target_entity"` | 输入目标实体列名。设计上应支持自定义，但当前实现内部多数逻辑仍按默认列名读取。 |
| `output_key` | `str` | `"redundancy_scores"` | 输出列名。当前实现设计上允许自定义，但写回时内部仍按默认键提取结果。 |

---

## 🤖 示例用法
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.graph_reasoning.eval.reasoning_path_redundancy_eval import (
    KGPathRedundancyEvaluator,
)


operator = KGPathRedundancyEvaluator(
    llm_serving=llm_serving,
    lang="en",
)
operator.run(
    storage=storage,
    input_key="mpath",
    target_key="target_entity",
    output_key="redundancy_scores",
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `target_entity` | `List[List[str]]` | 目标实体对列表。每个实体对通常包装为一个仅含单字符串的列表。 |
| `mpath` | `List[List[List[str]]]` | 多跳路径结果。最外层按实体对分组，中间层是多条路径，内层是路径中的三元组序列。 |
| `redundancy_scores` | `List[List[float]]` | 与 `mpath` 对齐的冗余分数结果。每个实体对对应一组路径分数。 |

---

#### 示例输入
```json
[
  {
    "target_entity": [["Henry, Berlin"]],
    "mpath": [
      [
        [
          "<subj> Henry <obj> Maria Rodriguez <rel> is_trained_by",
          "<subj> Maria Rodriguez <obj> Berlin <rel> lives_in"
        ],
        [
          "<subj> Henry <obj> CoachA <rel> trained_by",
          "<subj> CoachA <obj> Berlin <rel> located_in"
        ]
      ]
    ]
  }
]
```

#### 示例输出
```json
[
  {
    "target_entity": [["Henry, Berlin"]],
    "mpath": [
      [
        [
          "<subj> Henry <obj> Maria Rodriguez <rel> is_trained_by",
          "<subj> Maria Rodriguez <obj> Berlin <rel> lives_in"
        ],
        [
          "<subj> Henry <obj> CoachA <rel> trained_by",
          "<subj> CoachA <obj> Berlin <rel> located_in"
        ]
      ]
    ],
    "redundancy_scores": [
      [0.18, 0.67]
    ]
  }
]
```

---

#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/graph_reasoning/eval/reasoning_path_redundancy_eval.py`
- 默认 Prompt：`DataFlow-KG/dataflow/prompts/application_kg/graph_reasoning.py`
- 下游过滤算子：`DataFlow-KG/dataflow/operators/graph_reasoning/filter/reasoning_path_redundancy_filtering.py`


