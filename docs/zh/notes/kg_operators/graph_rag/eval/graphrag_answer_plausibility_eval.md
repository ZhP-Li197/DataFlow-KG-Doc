---
title: KGRAGQuestionPlausibilityEvaluation
createTime: 2026/04/01 14:10:00
permalink: /zh/kg_operators/graph_rag/eval/graphrag_answer_plausibility_eval/
---

## 📚 概述
`KGRAGQuestionPlausibilityEvaluation` 是一个用于 Graph RAG 问题合理性评估的评估类算子。
它基于问题和对应答案调用大模型，对问题是否合理、是否与答案匹配进行打分，并将结果写回 DataFrame。尽管源码文件名是 `graphrag_answer_plausibility_eval.py`，当前类名和输出字段语义都指向“问题合理性评估”。

这个算子的几个关键特点如下：

- 依赖 `LLMServingABC` 提供大模型评分能力
- 默认使用 `KGQuestionPlausibilityPrompt` 构造评估提示词，也支持注入自定义 Prompt
- 默认读取 `question` 和 `answer` 两列
- 默认输出列为 `question_plausibility_score`
- 同时支持单条 QA 对和一行内多个 QA 对的批量评估

---

## ✒️ `__init__` 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    prompt_template: Union[
        KGQuestionPlausibilityPrompt, DIYPromptABC
    ] = None,
):
    ...
```

#### `__init__` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象。算子通过 `generate_from_input` 对问题合理性进行评分。 |
| `seed` | `int` | `0` | 用于初始化内部随机数生成器。当前主流程中未进一步使用随机行为。 |
| `lang` | `str` | `"en"` | 默认 Prompt 的语言。未传入自定义模板时，会构造 `KGQuestionPlausibilityPrompt(lang=lang)`。 |
| `prompt_template` | `Union[KGQuestionPlausibilityPrompt, DIYPromptABC]` | `None` | 自定义 Prompt 模板。若为 `None`，则使用默认合理性评估 Prompt。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    question_key: str = "question",
    answer_key: str = "answer",
    output_key: str = "question_plausibility_score",
):
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，检查问题列、答案列和输出列状态。随后逐行处理数据：如果某一行是单条 `question + answer`，则直接调用 LLM 评估；如果某一行是 `List[str] + List[str]`，则按位置逐对评估并返回分数列表。模型返回后，算子会尝试把响应清洗为 JSON，并读取 `question_plausibility_score` 字段；若解析失败，则回退为 `0.0`。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将评估结果写回。 |
| `question_key` | `str` | `"question"` | 输入问题列名。每个单元格支持 `str` 或 `List[str]`。 |
| `answer_key` | `str` | `"answer"` | 输入答案列名。每个单元格支持 `str` 或 `List[str]`。 |
| `output_key` | `str` | `"question_plausibility_score"` | 输出评分列名，用于保存问题合理性分数。 |

---

## 🤖 示例用法
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.prompts.application_kg.graph_rag import KGQuestionPlausibilityPrompt
from dataflow.operators.graph_rag.eval.graphrag_answer_plausibility_eval import (
    KGRAGQuestionPlausibilityEvaluation,
)



operator = KGRAGQuestionPlausibilityEvaluation(
    llm_serving=llm_serving,
    lang="en",
    prompt_template=KGQuestionPlausibilityPrompt(lang="en"),
)
operator.run(
    storage=storage,
    question_key="question",
    answer_key="answer",
    output_key="question_plausibility_score",
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `question` | `str` / `List[str]` | 输入问题列。可为单条问题，也可为一行多问题。 |
| `answer` | `str` / `List[str]` | 与问题对齐的答案列。 |
| `question_plausibility_score` | `float` / `List[float]` | 问题合理性评分结果。单条 QA 输出单个浮点数，批量 QA 输出浮点数列表。 |

---

#### 示例输入
```json
[
  {
    "question": "Who trained Henry?",
    "answer": "Maria Rodriguez"
  }
]
```

#### 示例输出
```json
[
  {
    "question": "Who trained Henry?",
    "answer": "Maria Rodriguez",
    "question_plausibility_score": 0.98
  }
]
```

---

#### 注意事项
- 输入 DataFrame 中必须存在 `question_key` 和 `answer_key` 指定的列，否则会抛出 `ValueError`。
- 如果 `output_key` 已存在，算子会直接报错。
- 当前实现支持两种输入组合：`str + str` 和 `List[str] + List[str]`，其他类型组合会抛出 `ValueError`。
- 批量评估分支内部使用 `zip(q, a)` 配对，因此当问题列表和答案列表长度不一致时，只会处理到较短一侧，多出的尾部元素会被忽略。
- LLM 输出需要能被解析为 JSON，并包含 `question_plausibility_score` 字段；如果解析失败，该条结果会回退为 `0.0`。
- 虽然构造函数包含 `seed`，但当前实现没有在评估逻辑中使用随机采样。

#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/graph_rag/eval/graphrag_answer_plausibility_eval.py`
- 默认 Prompt：`DataFlow-KG/dataflow/prompts/application_kg/graph_rag.py`
- 下游过滤算子：`DataFlow-KG/dataflow/operators/graph_rag/filter/graphrag_answer_plausibility_filtering.py`


