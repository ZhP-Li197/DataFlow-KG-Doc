---
title: KGRelationStrengthScoring
createTime: 2026/04/10 15:40:44
permalink: /zh/kg_operators/general_kg/eval/kg_rel_triple_strength_eval/
---

## 📚 概述
`KGRelationStrengthScoring` 是一个用于评估知识图谱三元组与原始文本语义一致性强度的评估类算子。
它会读取每一行中的文本片段与对应三元组，调用大模型对三元组在文本中的支撑强度进行打分，并将评分结果写回 DataFrame。

这个算子的几个关键特点如下：

- 依赖 `LLMServingABC` 提供大模型评估能力
- 默认使用 `KGRelationStrengthScoringPrompt` 构造提示词，同时支持通过 `prompt_template` 参数传入自定义提示词
- 需要同时提供文本列（`raw_chunk`）与三元组列（`triple`）两个输入列
- 输入文本会经过质量预筛选：长度过短或句子数不足的文本将被跳过，输出 `None`
- 当模型调用失败或响应解析异常时，当前行输出 `None`

---

## ✒️ __init__ 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    prompt_template: Union[KGRelationStrengthScoringPrompt, DIYPromptABC] = None,
    num_q: int = 5
):
    ...
```

#### `__init__` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象。算子通过 `generate_from_input` 对三元组强度进行评分。 |
| `seed` | `int` | `0` | 随机种子，用于初始化内部随机数生成器。 |
| `lang` | `str` | `"en"` | Prompt 语言。当 `prompt_template` 为 `None` 时，构造函数会创建 `KGRelationStrengthScoringPrompt(lang)`。 |
| `prompt_template` | `KGRelationStrengthScoringPrompt` / `DIYPromptABC` | `None` | 自定义提示词模板。若传入则优先使用，否则使用默认模板。 |
| `num_q` | `int` | `5` | 预留参数，当前版本未在主流程中实际使用。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "raw_chunk",
    input_key_meta: str = "triple",
    output_key: str = "triple_strength_score"
):
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，校验 `input_key` 和 `input_key_meta` 列均存在且 `output_key` 列不存在，随后提取文本列与三元组列并调用 `process_batch()` 逐行处理。每行文本先经过 `_preprocess_text()` 质量过滤（长度不足 10 字符或句子数少于 2 句的文本直接返回空），通过后构造提示词交由大模型打分，响应解析出 `triple_strength_score` 字段写回 DataFrame。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将评估结果写回。 |
| `input_key` | `str` | `"raw_chunk"` | 输入文本列名。每个单元格应为原始文本字符串，用于提供三元组的语义背景。 |
| `input_key_meta` | `str` | `"triple"` | 输入三元组列名。每个单元格应为三元组列表或 JSON 字符串。 |
| `output_key` | `str` | `"triple_strength_score"` | 输出评分列名，用于保存每行对应的三元组强度分数。 |

---

## 🤖 示例用法
```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.general_kg.eval.kg_rel_triple_strength_eval import (
    KGRelationStrengthScoring,
)

operator = KGRelationStrengthScoring(
    llm_serving=llm_serving,
    lang="en",
)
operator.run(
    storage=storage,
    input_key="raw_chunk",
    input_key_meta="triple",
    output_key="triple_strength_score",
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `raw_chunk` | `str` | 输入原始文本片段，用于提供三元组的语义背景。 |
| `triple` | `List[str]` / `str` | 输入三元组列表，或可被解析为列表的 JSON 字符串。 |
| `triple_strength_score` | `float` / `None` | 三元组在对应文本中的语义支撑强度评分。文本质量不足或模型报错时为 `None`。 |

---

#### 示例输入
```json
[
  {
    "raw_chunk": "Isaac Newton formulated the laws of motion and universal gravitation. His work laid the foundation for classical mechanics.",
    "triple": ["<subj> Newton <obj> laws of motion <rel> formulated"]
  },
  {
    "raw_chunk": "short text",
    "triple": ["<subj> Newton <obj> gravity <rel> discovered"]
  }
]
```

#### 示例输出
```json
[
  {
    "raw_chunk": "Isaac Newton formulated the laws of motion and universal gravitation. His work laid the foundation for classical mechanics.",
    "triple": ["<subj> Newton <obj> laws of motion <rel> formulated"],
    "triple_strength_score": 0.93
  },
  {
    "raw_chunk": "short text",
    "triple": ["<subj> Newton <obj> gravity <rel> discovered"],
    "triple_strength_score": null
  }
]
```

---

#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/general_kg/eval/kg_rel_triple_strength_eval.py`
- 默认 Prompt：`DataFlow-KG/dataflow/prompts/core_kg/rel_triple_eval.py`