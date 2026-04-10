---
title: KGEntityExtraction
createTime: 2026/04/10 18:56:48
permalink: /zh/kg_operators/core_kg/rel_triple_generate/kg_entity_extractor/
---

## 📚 概述
`KGEntityExtraction` 是一个用于从原始文本中识别并抽取实体提及（Entity Mentions）的算子。
它会读取输入文本块，调用大语言模型（LLM）提取出文本中的实体表面形式，并输出标准化的实体字符串。

该算子的主要特点与内置逻辑如下：

- 仅执行实体识别，**不涉及**实体关系或属性的抽取，通常作为知识图谱构建（如 AutoSchemaKG）流程中的实体候选生成阶段。
- **内置文本预处理与质量过滤**：自动过滤长度不在 10 到 200,000 字符之间的文本；要求文本至少包含 2 个句号（中/英文均可）；且特殊字符的比例不得超过 30%。
- **结果清洗与标准化**：对大模型输出的实体列表进行解析后，会自动移除常见的英文停用词（如 "the", "a", "of" 等），并将结果拼接为以逗号分隔的字符串形式。
- 默认读取 `raw_chunk` 列，结果默认输出到 `entity` 列。

---

## ✒️ __init__ 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    prompt_template: Union[KGEntityExtractionPrompt, DIYPromptABC] = None,
):
    ...
```

#### `__init__` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象，算子依赖其提供的 `generate_from_input` 能力进行实体抽取。 |
| `seed` | `int` | `0` | 随机种子，用于初始化内部的 `random.Random` 实例。 |
| `lang` | `str` | `"en"` | Prompt 语言。如果未提供 `prompt_template`，算子会根据该语言自动实例化默认的 `KGEntityExtractionPrompt`。 |
| `prompt_template` | `Union[KGEntityExtractionPrompt, DIYPromptABC]` | `None` | 自定义提示词模板。如果传入，将覆盖默认的实体抽取 Prompt。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "raw_chunk",
    output_key: str = "entity"
):
    ...
```

`run` 函数首先从 `storage` 中读取 DataFrame，并逐行处理 `input_key` 指定的原始文本。在 `process_batch` 阶段，算子会对每段文本进行 `_preprocess_text` 质量检验（长度、句号数量、特殊字符比例）。通过检验的文本会被送入 LLM 进行抽取。LLM 返回的 JSON 数组经过正则解析、停用词剔除（`_normalize_text_key`）后，会被合并为单个字符串，并写回 `output_key` 指定的列中。如果解析失败或文本质量不达标，该行将输出空字符串 `""`。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow 数据存储对象。算子从中读取 `dataframe` 并将提取的实体结果写回。 |
| `input_key` | `str` | `"raw_chunk"` | 输入列名，通常是原始的长文本块（Text Chunk）。 |
| `output_key` | `str` | `"entity"` | 输出列名，用于保存提取并清洗后的逗号分隔实体字符串。 |

---

## 🤖 示例用法
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.core_kg.rel_triple_generate.kg_entity_extractor import (
    KGEntityExtraction,
)

operator = KGEntityExtraction(
    llm_serving=llm_serving,
    lang="en"
)

operator.run(
    storage=storage,
    input_key="raw_chunk",
    output_key="entity",
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `raw_chunk` | `str` | 输入的原始文本块。 |
| `entity` | `str` | 提取出的实体集合，格式为逗号分隔的字符串（如 `"Apple, Steve Jobs, California"`），滤除了常见停用词。 |

---

#### 示例输入
```json
[
  {
    "raw_chunk": "Albert Einstein was a German-born theoretical physicist who is widely held to be one of the greatest and most influential scientists of all time. He is best known for developing the theory of relativity."
  }
]
```

#### 示例输出
```json
[
  {
    "raw_chunk": "Albert Einstein was a German-born theoretical physicist who is widely held to be one of the greatest and most influential scientists of all time. He is best known for developing the theory of relativity.",
    "entity": "Albert Einstein, theoretical physicist, scientists, theory relativity"
  }
]
```
*(注：输出结果中 "theory of relativity" 经过停用词过滤被清洗为了 "theory relativity")*

---

#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/core_kg/rel_triple_generate/kg_entity_extractor.py`
- Prompt 模板目录：`DataFlow-KG/dataflow/prompts/core_kg/rel_triple_generate.py`