---
title: KGEntityLink2Database
createTime: 2026/04/11 13:00:00
permalink: /zh/kg_operators/general_kg/refine/kg_entity_link2database/
---

## 📚 概述
`KGEntityLink2Database` 用于把实体链接到外部知识库，目前实现主要面向 Wikipedia。它会为每个实体检索候选页面，并通过标题模糊匹配选择最相关的页面链接。

算子默认读取 `entity` 列，输出到 `linked_result`。当前实现会把输入看作逗号分隔的实体字符串，先通过 Wikipedia 搜索 API 获取候选标题，再结合 `wikipediaapi` 获取页面 URL，最终把成功链接的实体写成 `<entity> ... <link> ...` 形式。

## ✒️ `__init__` 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    num_q: int = 5
):
    ...
```

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 预留的大模型服务对象，当前主流程不依赖它完成链接。 |
| `seed` | `int` | `0` | 内部随机数种子。 |
| `lang` | `str` | `"en"` | 处理语言，当前 Wikipedia 接口固定使用英文。 |
| `num_q` | `int` | `5` | 预留参数。 |

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "entity",
    output_key: str = "linked_result"
):
    ...
```

`run` 会读取 DataFrame，检查输入输出列，然后把每一行的实体文本交给 `process_batch()`。批处理中，算子先按逗号切分实体，再逐个调用 `_link_to_wikipedia()`：它优先尝试实体名直达页面，若失败则调用 `_wiki_search()` 搜索候选标题，并用 `fuzz.ratio` 选出最匹配页面。最后只保留链接成功的项，并写回 `linked_result`。

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | DataFrame 存储对象。 |
| `input_key` | `str` | `"entity"` | 输入实体列名。 |
| `output_key` | `str` | `"linked_result"` | 输出外部知识库链接结果列名。 |

## 🤖 示例用法
```python
from dataflow.operators.general_kg.refinement.kg_entity_link2database import (
    KGEntityLink2Database,
)

operator = KGEntityLink2Database(
    llm_serving=llm_serving,
    lang="en",
)

operator.run(
    storage=storage,
    input_key="entity",
    output_key="linked_result",
)
```

默认输入输出格式如下：

| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `entity` | `str` | 输入实体字符串，通常为逗号分隔。 |
| `linked_result` | `List[str]` | 成功链接的实体与 URL 列表。 |

示例输入：

```json
[
  {
    "entity": "Albert Einstein, Princeton University"
  }
]
```

示例输出：

```json
[
  {
    "linked_result": [
      "<entity> Albert Einstein <link> https://en.wikipedia.org/wiki/Albert_Einstein",
      "<entity> Princeton University <link> https://en.wikipedia.org/wiki/Princeton_University"
    ]
  }
]
```

相关文件：

- 算子实现：`DataFlow-KG/dataflow/operators/general_kg/refinement/kg_entity_link2database.py`
