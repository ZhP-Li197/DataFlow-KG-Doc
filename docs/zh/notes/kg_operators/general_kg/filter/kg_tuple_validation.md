---
title: KGTupleValidity
createTime: 2026/04/10 15:40:44
permalink: /zh/kg_operators/general_kg/filter/kg_tuple_validation/
---

## 📚 概述
`KGTupleValidity` 是一个用于对知识图谱三元组或多元组进行有效性验证的过滤类算子。
它会读取每一行中的三元组字符串，调用大模型判断其语义是否合理，并将验证结果写回 DataFrame。

这个算子的几个关键特点如下：

- 依赖 `LLMServingABC` 提供大模型评估能力
- 通过 `triple_type` 参数区分两种三元组类型：`"relation"` 使用 `KGRelationTupleValidityPrompt`，`"attribute"` 使用 `KGAttributeTupleValidationPrompt`
- 输入列自动回退：优先使用 `input_key` 指定的列，依次回退到 `triple`、`tuple`
- 输出列名根据输入列名自动推断：输入为 `triple` 时输出 `valid_triple`，输入为 `tuple` 时输出 `valid_tuple`
- 要求 `output_key` 列预先不存在（冲突时主动报错）
- 支持通过 `merge_to_input` 将验证后的结果原地写回输入列；若为 `True`，不会生成新的输出列

---

## ✒️ `__init__` 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    merge_to_input: bool = False,
    triple_type: str = "relation"
):
    ...
```

#### `__init__` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象。算子通过 `generate_from_input` 对三元组进行有效性验证。 |
| `seed` | `int` | `0` | 随机种子，用于初始化内部随机数生成器。 |
| `lang` | `str` | `"en"` | Prompt 语言，影响所选 Prompt 模板的语言版本。 |
| `merge_to_input` | `bool` | `False` | 若为 `True`，验证结果写回 `input_key` 列，不生成新的输出列；若为 `False`，结果写入 `output_key` 指定的新列。 |
| `triple_type` | `str` | `"relation"` | 三元组类型。`"relation"` 对应关系型三元组，使用 `KGRelationTupleValidityPrompt`；`"attribute"` 对应属性型三元组，使用 `KGAttributeTupleValidationPrompt`。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "triple",
    output_key: str = "valid_triple",
):
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，按优先级确定输入列（`input_key` → `triple` → `tuple`），并根据输入列名自动推断输出列名（`valid_triple` 或 `valid_tuple`），校验输出列不存在后开始处理。每行三元组字符串被构造为用户提示词，交由大模型判断有效性，响应经 JSON 解析后提取验证结果字段写入输出列。若 `merge_to_input=True`，验证结果将原地写回 `input_key` 列，不会生成新的输出列；若为 `False`，结果写入 `output_key` 指定的新列。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将验证结果写回。 |
| `input_key` | `str` | `"triple"` | 输入三元组列名。兼容 `triple` 和 `tuple` 列名的自动回退。 |
| `output_key` | `str` | `"valid_triple"` | 输出验证结果列名（仅当 `merge_to_input=False` 时生效；若为 `True`，结果写回 `input_key` 列）。若输入列为 `tuple`，建议改为 `"valid_tuple"`。 |

---

## 🤖 示例用法
```python
from dataflow.operators.general_kg.filter.kg_tuple_validation import (
    KGTupleValidity,
)

# 验证关系型三元组
operator = KGTupleValidity(
    llm_serving=llm_serving,
    triple_type="relation",
    lang="en",
)
operator.run(
    storage=storage,
    input_key="triple",
    output_key="valid_triple",
)

# 验证属性型多元组
operator = KGTupleValidity(
    llm_serving=llm_serving,
    triple_type="attribute",
    lang="en",
)
operator.run(
    storage=storage,
    input_key="tuple",
    output_key="valid_tuple",
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `triple` / `tuple` | `str` | 输入三元组或多元组字符串。 |
| `valid_triple` / `valid_tuple` | `Any` | LLM 验证后保留的有效三元组，经 JSON 解析后的结构化结果。具体字段和类型由 Prompt 模板的返回格式决定。 |

---

#### 示例输入
```json
[
  {"triple": "<subj> Newton <obj> gravity <rel> discovered"},
  {"triple": "<subj> xkqz <obj> 123abc <rel> ????"}
]
```

#### 示例输出
```json
[
  {"triple": "...", "valid_triple": ["<subj> Newton <obj> gravity <rel> discovered"]},
  {"triple": "...", "valid_triple": []}
]
```

> ⚠️ 注：`valid_triple` / `valid_tuple` 字段的实际结构取决于所用 Prompt 模板的返回格式，上方示例仅供参考。

---

#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/general_kg/filter/kg_tuple_validation.py`
- 关系型 Prompt：`DataFlow-KG/dataflow/prompts/core_kg/rel_triple_filter.py`
- 属性型 Prompt：`DataFlow-KG/dataflow/prompts/core_kg/attri_triple.py`