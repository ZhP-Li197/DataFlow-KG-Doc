---
title: LegalKGCaseSummarySimilarity
createTime: 2026/04/15 09:00:00
permalink: /zh/kg_operators/domain_kg/legal_kg/eval/legalkg_case_similarity_eval/
---

## 📚 概述

`LegalKGCaseSummarySimilarity` 用于评估案件摘要与案件类型描述之间的语义相似度。它逐行读取案件摘要，调用大模型返回 `similarity_score`，并把结果写回 DataFrame。

当前实现默认读取 `case_summary` 列，默认写入 `similarity_score` 列。需要注意，`process_batch()` 期望第二个参数是 `List[str]`，但 `run()` 当前会把 `input_key_meta` 直接原样传入。因此如果传入普通字符串，例如 `"盗窃案件"`，实际会按字符逐个参与批处理，而不是把整串案件类型描述用于每一行。

如果模型返回内容无法解析为 JSON，对应行的得分会写成 `None`。

## ✒️ `__init__` 函数

```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "zh",
    merge_to_input: bool = False,
    prompt_template: Union[CaseSummarySimilarityPrompt, DIYPromptABC] = None,
):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象，使用 `generate_from_input` 完成相似度评估 |
| `seed` | `int` | `0` | 初始化内部随机数生成器；当前主流程未使用随机逻辑 |
| `lang` | `str` | `"zh"` | Prompt 语言 |
| `merge_to_input` | `bool` | `False` | 预留参数，当前 `run` 流程未使用 |
| `prompt_template` | `Union[CaseSummarySimilarityPrompt, DIYPromptABC]` | `None` | 自定义 Prompt 模板；为空时默认使用 `CaseSummarySimilarityPrompt` |

## 💡 `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "case_summary",
    input_key_meta: str = "盗窃案件",
    output_key: str = "similarity_score",
):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | DataFlow 存储对象，算子从中读取并回写 DataFrame |
| `input_key` | `str` | `"case_summary"` | 输入案件摘要列名 |
| `input_key_meta` | `str` / `List[str]` | `"盗窃案件"` | 源码签名中是 `str`；但若要与批处理签名一致，应传入 `List[str]`。普通字符串会被按字符迭代 |
| `output_key` | `str` | `"similarity_score"` | 相似度分数输出列名 |

`run` 会先检查 `input_key` 是否存在，然后读取该列的所有摘要文本并调用 `process_batch()`。但当前实现将 `input_key_meta` 直接传给期望 `List[str]` 的 `case_types` 参数，因此：

- 传入普通字符串时，会按字符与摘要逐项 `zip`
- 只有在 `input_key_meta` 本身是可迭代的案件类型列表时，行为才与 `process_batch()` 的签名一致
- 若 `input_key_meta` 的可迭代长度小于输入 DataFrame 行数，生成的结果条数也会变少，后续写回输出列时会出现长度不匹配问题

因此当前默认值 `"盗窃案件"` 更适合作为源码默认占位值理解，而不是严格意义上可直接复用的批处理输入格式。

函数执行后会在 DataFrame 中新增或覆盖 `similarity_score` 列，并返回：

```python
["similarity_score"]
```

## 🤖 示例用法

```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.legal_kg.eval.legalkg_case_similarity_eval import (
    LegalKGCaseSummarySimilarity,
)

dataframe = pd.DataFrame(
    [
        {
            "case_summary": "The defendant Zhang San stole a mobile phone from a shopping mall and was later arrested. The court determined that the conduct constituted theft."
        }
    ]
)

storage = DummyStorage()
storage.set_data(dataframe)

operator = LegalKGCaseSummarySimilarity(
    llm_serving=llm_serving,
    lang="zh",
)
operator.run(
    storage=storage,
    input_key="case_summary",
    input_key_meta=["theft case"],
    output_key="similarity_score",
)
```

#### 输入示例

```json
[
  {
    "case_summary": "The defendant Zhang San stole a mobile phone from a shopping mall and was later arrested. The court determined that the conduct constituted theft."
  }
]
```

#### 输出示例

```json
[
  {
    "case_summary": "The defendant Zhang San stole a mobile phone from a shopping mall and was later arrested. The court determined that the conduct constituted theft.",
    "similarity_score": 0.96
  }
]
```

#### 相关链接

- 算子实现：`DataFlow-KG/dataflow/operators/domain_kg/legal_kg/eval/legalkg_case_similarity_eval.py`
- 默认 Prompt：`DataFlow-KG/dataflow/prompts/diverse_kg/legalkg.py`
