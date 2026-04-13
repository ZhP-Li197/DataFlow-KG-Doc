---
title: KGEntityExtraction
createTime: 2026/04/11 12:00:00
permalink: /zh/kg_operators/general_kg/generate/kg_entity_extractor/
---

## 📚 概述
`KGEntityExtraction` 用于从原始文本中抽取实体提及。它只做实体识别，不做关系抽取或属性抽取，通常位于知识图谱构建流程的前置阶段。

这个算子带有预处理逻辑：文本长度必须在 10 到 200000 之间，文本中至少要有 2 个中英文句号，特殊字符占比不能超过 30%。模型返回后，算子会尝试将 JSON 数组解析为实体列表，再拼接为逗号分隔字符串，并进行停用词清理；如果校验或解析失败，则输出空字符串。

## ✒️ `__init__` 函数
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

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象。 |
| `seed` | `int` | `0` | 用于初始化内部随机数生成器。 |
| `lang` | `str` | `"en"` | 默认 Prompt 的语言。 |
| `prompt_template` | `Union[KGEntityExtractionPrompt, DIYPromptABC]` | `None` | 自定义 Prompt；为空时使用默认模板。 |

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "raw_chunk",
    output_key: str = "entity",
):
    ...
```

`run` 会读取 DataFrame，校验 `input_key` 和 `output_key`，然后逐行处理原始文本。`process_batch()` 中每条文本先经过 `_preprocess_text()` 过滤，只有通过质量检查的文本才会被送入模型抽取实体。模型输出会被 `_parse_llm_response()` 解析为实体列表字符串，最后写回 `output_key` 指定列。

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | DataFrame 存储对象。 |
| `input_key` | `str` | `"raw_chunk"` | 输入文本列名。 |
| `output_key` | `str` | `"entity"` | 输出实体列名。 |

## 🤖 示例用法
```python
from dataflow.operators.general_kg.generate.kg_entity_extractor import (
    KGEntityExtraction,
)

operator = KGEntityExtraction(
    llm_serving=llm_serving,
    lang="en",
)

operator.run(
    storage=storage,
    input_key="raw_chunk",
    output_key="entity",
)
```

默认输入输出格式如下：

| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `raw_chunk` | `str` | 输入原始文本。 |
| `entity` | `str` | 抽取出的实体字符串，通常为逗号分隔格式。 |

示例输入：

```json
[
  {
    "raw_chunk": "Albert Einstein was a German-born theoretical physicist. He developed the theory of relativity."
  }
]
```

示例输出：

```json
[
  {
    "raw_chunk": "Albert Einstein was a German-born theoretical physicist. He developed the theory of relativity.",
    "entity": "Albert Einstein, theoretical physicist, theory relativity"
  }
]
```

相关文件：

- 算子实现：`DataFlow-KG/dataflow/operators/general_kg/generate/kg_entity_extractor.py`
- Prompt 定义：`DataFlow-KG/dataflow/prompts/core_kg/rel_triple_generate.py`
