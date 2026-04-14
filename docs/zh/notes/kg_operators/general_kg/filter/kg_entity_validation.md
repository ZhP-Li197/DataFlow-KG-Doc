---
title: KGEntityValidity
createTime: 2026/04/10 15:40:44
permalink: /zh/kg_operators/general_kg/filter/kg_entity_validation/
---

## 📚 概述
`KGEntityValidity` 是一个用于筛选知识图谱有效实体的评估过滤类算子。
它会读取每一行中的候选实体集合字符串，调用大模型筛选出其中语义完整、适合作为知识图谱节点的实体，并将过滤结果写回 DataFrame。

这个算子的几个关键特点如下：

- 依赖 `LLMServingABC` 提供大模型评估能力
- 默认使用 `KGEntityValidityPrompt` 构造提示词，同时支持通过 `prompt_template` 参数传入自定义提示词
- 支持通过 `merge_to_input` 参数将结果原地写回输入列，或写入新列
- 要求 `input_key` 列存在且 `output_key` 列不存在（冲突时会主动报错）
- 按行处理候选实体集合字符串，每行通常包含多个逗号分隔实体
- 输出为 JSON 解析后的有效实体列表 `List[str]`

---

## ✒️ `__init__` 函数
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
| `merge_to_input` | `bool` | `False` | 若为 `True`，筛选后的实体列表写回 `input_key` 列；若为 `False`，结果写入 `output_key` 指定的新列。 |
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

`run` 会先从 `storage` 中读取 DataFrame，校验 `input_key` 列存在且 `output_key` 列不存在，随后提取候选实体集合字符串并调用 `process_batch()` 逐行处理。这里的“逐行处理”指每一行触发一次 LLM 调用，但每行单元格本身通常包含多个逗号分隔实体。模型响应会按 JSON 数组解析，并直接写入输出列。根据 `merge_to_input` 的取值，结果写回 `input_key` 列或 `output_key` 列。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将筛选结果写回。 |
| `input_key` | `str` | `"entity"` | 输入候选实体列名。每个单元格应为候选实体集合字符串，推荐使用逗号分隔格式。 |
| `output_key` | `str` | `"valid"` | 输出有效实体列表列名（`merge_to_input=False` 时生效）。 |

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
| `valid` | `List[str]` | LLM 返回并经 JSON 解析后的有效实体列表。 |

#### 模型原始输出格式
```json
["Albert Einstein", "Paris", "deep learning"]
```

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
