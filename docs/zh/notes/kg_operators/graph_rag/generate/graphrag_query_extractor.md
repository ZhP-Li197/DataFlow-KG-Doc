---
title: KGGraphRAGQueryExtraction
createTime: 2026/04/01 12:00:00
permalink: /zh/kg_operators/graph_rag/generate/graphrag_query_extractor/
---

## 📚 概述
`KGGraphRAGQueryExtraction` 是一个用于 Graph RAG 查询理解的生成类算子。
它从输入问题中抽取知识图谱检索所需的实体和关系，并将结果写回到 DataFrame 中，供后续子图检索和答案生成算子继续使用。

这个算子的几个关键特点如下：

- 依赖 `LLMServingABC` 提供大模型推理能力
- 默认使用 `KGQueryExtractionPrompt` 构造提示词，也支持注入自定义 Prompt
- 读取输入列 `question`
- 默认输出列为 `entities` 和 `relations`
- 支持两种单元格输入形式：单条问题 `str`，或一行内多条问题 `List[str]`

---

## ✒️ __init__ 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    prompt_template: Union[
        KGQueryExtractionPrompt, DIYPromptABC
    ] = None,
):
    ...
```

#### `__init__` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象。算子通过 `generate_from_input` 调用模型完成实体和关系抽取。 |
| `seed` | `int` | `0` | 用于初始化内部随机数生成器。当前版本中仅完成初始化，主流程未进一步使用随机采样。 |
| `lang` | `str` | `"en"` | 默认 Prompt 的语言。未传入自定义 Prompt 时，会基于该参数构造 `KGQueryExtractionPrompt(lang=lang)`。 |
| `prompt_template` | `Union[KGQueryExtractionPrompt, DIYPromptABC]` | `None` | 自定义 Prompt 模板。若为 `None`，则使用默认的 `KGQueryExtractionPrompt`。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "question",
    output_keys: List[str] = ["entities", "relations"],
):
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，校验输入列和输出列是否满足要求，然后逐行处理 `question` 列。若单元格是字符串，则直接调用 LLM 抽取实体与关系；若单元格是 `List[str]`，则对列表中的每个问题逐个抽取，并把结果组织成嵌套列表。最后算子将结果写回 DataFrame，并返回输出字段名列表。

LLM 返回结果时，算子会尝试将响应清洗为 JSON 并解析出 `entities` 和 `relations`。如果解析失败，会记录 warning 日志，并回退为两个空列表。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将处理结果写回。 |
| `input_key` | `str` | `"question"` | 输入问题列名。该列每个单元格支持 `str` 或 `List[str]`。 |
| `output_keys` | `List[str]` | `["entities", "relations"]` | 期望的输出字段名列表。当前实现会用它做列存在性校验并作为返回值返回，但实际写回 DataFrame 时仍固定写入 `entities` 和 `relations` 两列。 |

---

## 🤖 示例用法
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.prompts.application_kg.graph_rag import KGQueryExtractionPrompt
from dataflow.operators.graph_rag.generate.graphrag_query_extractor import (
    KGGraphRAGQueryExtraction,
)


operator = KGGraphRAGQueryExtraction(
    llm_serving=llm_serving,
    lang="en",
    prompt_template=KGQueryExtractionPrompt(lang="en"),
)
operator.run(
    storage=storage,
    input_key="question",
    output_keys=["entities", "relations"],
)
```

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `question` | `str` / `List[str]` | 输入问题列。支持单条问题或一行多问题。 |
| `entities` | `List[str]` / `List[List[str]]` | 抽取出的实体列表；若输入是一行多问题，则该列为按问题对齐的嵌套列表。 |
| `relations` | `List[str]` / `List[List[str]]` | 抽取出的关系列表；若输入是一行多问题，则该列为按问题对齐的嵌套列表。 |

---

#### 示例输入
```json
[
  {
    "question": "Who trained Henry?"
  }
]
```

#### 示例输出
```json
[
  {
    "question": "Who trained Henry?",
    "entities": ["Henry"],
    "relations": ["trained_by"]
  }
]
```

---

#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/graph_rag/generate/graphrag_query_extractor.py`
- 默认 Prompt：`DataFlow-KG/dataflow/prompts/application_kg/graph_rag.py`
- 存储实现：`DataFlow-KG/dataflow/utils/storage.py`


