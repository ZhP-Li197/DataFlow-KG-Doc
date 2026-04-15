---
title: KGEntityValidity
createTime: 2026/04/10 15:40:44
permalink: /zh/kg_operators/general_kg/filter/kg_entity_validation/
---

## 📚 概述
`KGEntityValidity` 是一个用于筛选知识图谱有效实体的评估过滤类算子。
它会读取每一行中的候选实体集合字符串，调用大模型筛选出其中语义完整、适合作为知识图谱节点的实体，并将过滤后的实体集合写回 DataFrame。

这个算子的几个关键特点如下：

- 依赖 `LLMServingABC` 提供大模型评估能力
- 默认使用 `KGEntityValidityPrompt` 构造提示词，同时支持通过 `prompt_template` 参数传入自定义提示词
- 支持通过 `merge_to_input` 参数将结果原地写回输入列，或写入新列
- 要求 `input_key` 列存在且 `output_key` 列不存在（冲突时会主动报错）
- 按行处理候选实体集合字符串，每行通常包含多个逗号分隔实体
- 输出仍是一组过滤后的实体，格式与输入的实体集合写法保持一致

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
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象。算子通过 `generate_from_input` 对候选实体集合进行筛选。 |
| `seed` | `int` | `0` | 随机种子，用于初始化内部随机数生成器。 |
| `lang` | `str` | `"en"` | Prompt 语言。当 `prompt_template` 为 `None` 时，构造函数会创建 `KGEntityValidityPrompt(lang)`。 |
| `merge_to_input` | `bool` | `False` | 若为 `True`，筛选后的实体集合写回 `input_key` 列；若为 `False`，结果写入 `output_key` 指定的新列。 |
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

`run`会对输入的数据进行有效实体检测，最终输出过滤后有效的实体。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将筛选结果写回。 |
| `input_key` | `str` | `"entity"` | 输入候选实体列名。每个单元格应为候选实体集合字符串，推荐使用逗号分隔格式。 |
| `output_key` | `str` | `"valid"` | 输出有效实体集合列名（`merge_to_input=False` 时生效）。 |

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
| `entity` | `str` | 输入候选实体集合字符串，例如 `"Albert Einstein, Paris, xkqz123"`。 |
| `valid` | `str` | 过滤后的有效实体字符串集合，通常仍为逗号分隔格式。 |

---

#### 示例输入
```json
[
  {"entity": "Albert Einstein, Paris, xkqz123, deep learning"}
]
```

#### 示例输出
```json
[
  {
    "entity": "Albert Einstein, Paris, xkqz123, deep learning",
    "valid": ["Albert Einstein", "Paris", "deep learning"]
  }
]
```

上游 `KGEntityExtraction` 会先把实体列表拼成逗号分隔字符串写入 `entity` 列，`KGEntityValidity` 再按行读取该字符串完成整批过滤。

---

#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/general_kg/filter/kg_entity_validation.py`
- 默认 Prompt：`DataFlow-KG/dataflow/prompts/core_kg/rel_triple_filter.py`
