---
title: KGEntityValidity
createTime: 2026/04/10 15:40:44
permalink: /zh/kg_operators/general_kg/filter/kg_entity_validation/
---

## 📚 概述
`KGEntityValidity` 是一个用于判断知识图谱候选实体有效性的评估过滤类算子。
它会读取每一行中的候选实体，调用大模型判断该实体在语义上是否合理、是否适合作为知识图谱节点，并将判断结果写回 DataFrame。

这个算子的几个关键特点如下：

- 依赖 `LLMServingABC` 提供大模型评估能力
- 默认使用 `KGEntityValidityPrompt` 构造提示词，同时支持通过 `prompt_template` 参数传入自定义提示词
- 支持通过 `merge_to_input` 参数将结果原地写回输入列，或写入新列
- 要求 `input_key` 列存在且 `output_key` 列不存在（冲突时会主动报错）
- 输出为模型的结构化判断结果（JSON 解析后的对象），而非简单的布尔值

---

## ✒️ __init__ 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    merge_to_input: bool = False,
    prompt_template: Union[KGEntityValidityPrompt, DIYPromptABC] = None,
):
    ...
```

#### `__init__` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象。算子通过 `generate_from_input` 对候选实体进行有效性判断。 |
| `seed` | `int` | `0` | 随机种子，用于初始化内部随机数生成器。 |
| `lang` | `str` | `"en"` | Prompt 语言。当 `prompt_template` 为 `None` 时，构造函数会创建 `KGEntityValidityPrompt(lang)`。 |
| `merge_to_input` | `bool` | `False` | 若为 `True`，判断结果写回 `input_key` 列；若为 `False`，结果写入 `output_key` 指定的新列。 |
| `prompt_template` | `KGEntityValidityPrompt` / `DIYPromptABC` | `None` | 自定义提示词模板。若传入则优先使用，否则使用默认模板。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "entity",
    output_key: str = "valid",
):
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，校验 `input_key` 列存在且 `output_key` 列不存在，随后提取实体列表并调用 `process_batch()` 逐行处理。每个实体字符串被构造为用户提示词，交由大模型判断有效性，响应经 JSON 解析后直接写入输出列。根据 `merge_to_input` 的取值，结果写回 `input_key` 列或 `output_key` 列。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将判断结果写回。 |
| `input_key` | `str` | `"entity"` | 输入候选实体列名。每个单元格应为实体字符串。 |
| `output_key` | `str` | `"valid"` | 输出有效性判断结果列名（`merge_to_input=False` 时生效）。 |

---

## 🤖 示例用法
```python
from dataflow.operators.general_kg.filter.kg_entity_validation import (
    KGEntityValidity,
)

operator = KGEntityValidity(
    llm_serving=llm_serving,
    lang="en",
)
operator.run(
    storage=storage,
    input_key="entity",
    output_key="valid",
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `entity` | `str` | 输入候选实体字符串。 |
| `valid` | `Dict` / `Any` | LLM 返回的有效性判断结果，经 JSON 解析后写入，具体字段由 Prompt 模板决定。 |

---

#### 示例输入
```json
[
  {"entity": "Albert Einstein"},
  {"entity": "xkqz123"},
  {"entity": "Paris"}
]
```

#### 示例输出
```json
[
  {"entity": "Albert Einstein", "valid": {"is_valid": true, "reason": "Well-known physicist and a meaningful KG entity."}},
  {"entity": "xkqz123",        "valid": {"is_valid": false, "reason": "Random string with no semantic meaning."}},
  {"entity": "Paris",          "valid": {"is_valid": true, "reason": "Capital city of France, a common KG entity."}}
]
```

---

#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/general_kg/filter/kg_entity_validation.py`
- 默认 Prompt：`DataFlow-KG/dataflow/prompts/core_kg/rel_triple_filter.py`