---
title: KGRAGQuestionDifficultyEvaluation
createTime: 2026/04/01 14:20:00
permalink: /zh/kg_operators/graph_rag/eval/graphrag_question_difficulty_eval/
---

## 📚 概述
`KGRAGQuestionDifficultyEvaluation` 是一个用于 Graph RAG 问题难度评估的评估类算子。
它基于输入问题调用大模型，对问题难度进行分类，输出 `easy`、`medium` 或 `hard` 等标签，常用于数据分层、采样控制或后续难度分析。

这个算子的几个关键特点如下：

- 依赖 `LLMServingABC` 提供大模型分类能力
- 默认使用 `KGQuestionDifficultyPrompt` 构造评估提示词，也支持注入自定义 Prompt
- 默认读取 `question` 列，默认输出到 `question_difficulty`
- 同时支持单条问题 `str` 和一行多问题 `List[str]`
- 当模型输出解析失败时，会回退到默认标签 `medium`

---

## ✒️ `__init__` 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    prompt_template: Union[
        KGQuestionDifficultyPrompt, DIYPromptABC
    ] = None,
):
    ...
```

#### `__init__` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象。算子通过 `generate_from_input` 对问题难度进行分类。 |
| `seed` | `int` | `0` | 用于初始化内部随机数生成器。当前主流程中未进一步使用随机行为。 |
| `lang` | `str` | `"en"` | 默认 Prompt 的语言。未传入自定义模板时，会构造 `KGQuestionDifficultyPrompt(lang=lang)`。 |
| `prompt_template` | `Union[KGQuestionDifficultyPrompt, DIYPromptABC]` | `None` | 自定义 Prompt 模板。若为 `None`，则使用默认难度评估 Prompt。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    question_key: str = "question",
    output_key: str = "question_difficulty",
):
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，检查输入列和输出列状态，然后逐行处理 `question_key`。若单元格是字符串，则直接调用 LLM 评估难度；若单元格是 `List[str]`，则对列表中的每个问题逐个评估，并返回难度标签列表。模型返回后，算子会尝试把响应清洗为 JSON，并读取 `question_difficulty` 字段；如果解析失败，则默认回退为 `medium`。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将难度评估结果写回。 |
| `question_key` | `str` | `"question"` | 输入问题列名。每个单元格支持 `str` 或 `List[str]`。 |
| `output_key` | `str` | `"question_difficulty"` | 输出列名，用于保存难度标签。 |

---

## 🤖 示例用法
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.prompts.application_kg.graph_rag import KGQuestionDifficultyPrompt
from dataflow.operators.graph_rag.eval.graphrag_question_difficulty_eval import (
    KGRAGQuestionDifficultyEvaluation,
)


operator = KGRAGQuestionDifficultyEvaluation(
    llm_serving=llm_serving,
    lang="en",
    prompt_template=KGQuestionDifficultyPrompt(lang="en"),
)
operator.run(
    storage=storage,
    question_key="question",
    output_key="question_difficulty",
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `question` | `str` / `List[str]` | 输入问题列。可为单条问题，也可为一行多问题。 |
| `question_difficulty` | `str` / `List[str]` | 难度评估结果。常见值为 `easy`、`medium`、`hard`。 |

---

#### 示例输入
```json
[
  {
    "question":[
      "On which date was Polar Lights released?",
      "Who trained Henry?"
    ]
  }
]
```

#### 示例输出
```json
[
  {
    "question_difficulty":[
      "medium",
      "medium"
    ]
  }
]
```

---

#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/graph_rag/eval/graphrag_question_difficulty_eval.py`
- 默认 Prompt：`DataFlow-KG/dataflow/prompts/application_kg/graph_rag.py`
- 存储实现：`DataFlow-KG/dataflow/utils/storage.py`


