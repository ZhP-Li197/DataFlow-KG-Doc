---
title: KGSubgraphConsistency
createTime: 2026/04/10 15:40:44
permalink: /zh/kg_operators/general_kg/eval/kg_subgraph_consistence_eval/
---

## 📚 概述
`KGSubgraphConsistency` 是一个用于评估知识图谱子图内部语义一致性的评估类算子。
它会读取每一行中的子图三元组列表，调用大模型对整个子图的语义连贯性进行整体打分，并将得分写回 DataFrame。

这个算子的几个关键特点如下：

- 依赖 `LLMServingABC` 提供大模型评估能力
- 默认使用 `KGSubgraphConsistencyPrompt` 构造提示词，同时支持通过 `prompt_template` 参数传入自定义提示词
- 每行子图作为整体交由模型评估，输出单一一致性得分，而非逐三元组打分
- 要求 `input_key` 列存在且 `output_key` 列不存在（冲突时会主动报错）
- 当模型调用失败或响应解析异常时，当前行输出 `None`

---

## ✒️ __init__ 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    merge_to_input: bool = False,
    prompt_template: Union[KGSubgraphConsistencyPrompt, DIYPromptABC] = None
):
    ...
```

#### `__init__` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象。算子通过 `generate_from_input` 对子图一致性进行评分。 |
| `seed` | `int` | `0` | 随机种子，用于初始化内部随机数生成器。 |
| `lang` | `str` | `"en"` | Prompt 语言。当 `prompt_template` 为 `None` 时，构造函数会创建 `KGSubgraphConsistencyPrompt(lang)`。 |
| `merge_to_input` | `bool` | `False` | 预留参数，当前版本未在主流程中实际使用。 |
| `prompt_template` | `KGSubgraphConsistencyPrompt` / `DIYPromptABC` | `None` | 自定义提示词模板。若传入则优先使用，否则使用默认模板。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "subgraph",
    output_key: str = "consistency_score"
):
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，校验 `input_key` 列存在且 `output_key` 列不存在，随后提取全部子图并调用 `process_batch()` 逐行处理。每行子图整体作为输入构造提示词，交由大模型返回包含 `consistency_score` 字段的 JSON，解析后写入 `output_key` 指定的列。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将评估结果写回。 |
| `input_key` | `str` | `"subgraph"` | 输入子图列名。每个单元格应为 `List[str]` 格式的三元组列表。 |
| `output_key` | `str` | `"consistency_score"` | 输出评分列名，用于保存每个子图对应的语义一致性分数。 |

---

## 🤖 示例用法
```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.general_kg.eval.kg_subgraph_consistence_eval import (
    KGSubgraphConsistency,
)

operator = KGSubgraphConsistency(
    llm_serving=llm_serving,
    lang="en",
)
operator.run(
    storage=storage,
    input_key="subgraph",
    output_key="consistency_score",
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `subgraph` | `List[str]` | 输入子图三元组列表，格式为 `<subj> ... <obj> ... <rel> ...`。 |
| `consistency_score` | `float` / `None` | LLM 评估的子图内部语义一致性得分，取值范围 `[0, 1]`。模型报错或解析失败时为 `None`。 |

---

#### 示例输入
```json
[
  {
    "subgraph": [
      "<subj> Earth <obj> Sun <rel> orbits",
      "<subj> Earth <obj> Moon <rel> has_satellite",
      "<subj> Moon <obj> Earth <rel> orbits"
    ]
  },
  {
    "subgraph": [
      "<subj> Earth <obj> Sun <rel> orbits",
      "<subj> Shakespeare <obj> Python <rel> invented"
    ]
  }
]
```

#### 示例输出
```json
[
  {
    "subgraph": ["..."],
    "consistency_score": 0.91
  },
  {
    "subgraph": ["..."],
    "consistency_score": 0.12
  }
]
```

---

#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/general_kg/eval/kg_subgraph_consistence_eval.py`
- 默认 Prompt：`DataFlow-KG/dataflow/prompts/core_kg/rel_triple_eval.py`