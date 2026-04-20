---
title: LegalKGJudgementPrediction
createTime: 2026/04/15 09:00:00
permalink: /zh/kg_operators/domain_kg/legal_kg/generate/legalkg_case_judgement_generator/
---

## 📚 概述

`LegalKGJudgementPrediction` 用于根据法律图谱条目和案件描述预测案件判决，并返回支撑判决的三元组列表。它默认读取 `triple` 列，把模型返回的 `judgement` 和 `reason` 写回 DataFrame。

当前实现里，`input_key_meta` 不是列名。需要注意，`process_batch()` 期望 `case_descs` 是 `List[str]`，但 `run()` 当前会把 `input_key_meta` 直接原样传入。因此如果这里传入普通字符串，实际会按字符逐个参与批处理，而不是把整段案件描述传给每一行。如果模型输出无法解析为 JSON，对应行会得到 `None` 值。

## ✒️ `__init__` 函数

```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "zh",
    prompt_template: Union[LegalKGJudgementPredictionPrompt, DIYPromptABC] = None,
):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象 |
| `seed` | `int` | `0` | 初始化内部随机数生成器；当前主流程未使用随机逻辑 |
| `lang` | `str` | `"zh"` | Prompt 语言 |
| `prompt_template` | `Union[LegalKGJudgementPredictionPrompt, DIYPromptABC]` | `None` | 自定义 Prompt 模板；为空时使用默认判决预测 Prompt |

## 💡 `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "triple",
    input_key_meta: str = "张三偷了一部苹果手机",
    output_key_judgement: str = "judgement",
    output_key_reason: str = "reason",
):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | DataFlow 存储对象 |
| `input_key` | `str` | `"triple"` | 输入法律图谱条目列名 |
| `input_key_meta` | `str` / `List[str]` | `"张三偷了一部苹果手机"` | 源码签名中是 `str`；但若要与批处理签名一致，应传入 `List[str]`。普通字符串会被按字符迭代 |
| `output_key_judgement` | `str` | `"judgement"` | 判决结果输出列名 |
| `output_key_reason` | `str` | `"reason"` | 判决依据条目输出列名 |

`run` 会读取 `input_key` 列中的 `List[str]`，并把 `input_key_meta` 直接传给 `process_batch()`。但 `process_batch()` 的 `case_descs` 参数签名是 `List[str]`，因此当前实现存在如下限制：

- 传入普通字符串时，会按字符与 `triples_list` 逐项 `zip`
- 只有在 `input_key_meta` 本身是可迭代的案件描述列表时，行为才与函数签名一致
- 若 `input_key_meta` 的可迭代长度小于输入样本数，得到的结果条数也会变少，写回 `judgement` 和 `reason` 列时会出现长度不匹配问题

模型返回 JSON 后，算子提取：

- `judgement`：判决结果文本
- `reason`：支撑判决的三元组列表

执行完成后会将两个输出列写回 DataFrame，并返回：

```python
["judgement", "reason"]
```

## 🤖 示例用法

```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.legal_kg.generate.legalkg_case_judgement_generator import (
    LegalKGJudgementPrediction,
)

dataframe = pd.DataFrame(
    [
        {
            "triple": [
                "<entity> Zhang San <attribute> charge <value> theft",
                "<entity> Zhang San <attribute> amount_involved <value> RMB 6000"
            ]
        }
    ]
)

storage = DummyStorage()
storage.set_data(dataframe)

operator = LegalKGJudgementPrediction(
    llm_serving=llm_serving,
    lang="zh",
)
operator.run(
    storage=storage,
    input_key="triple",
    input_key_meta=["Zhang San stole a mobile phone worth RMB 6000 from a shopping mall."],
    output_key_judgement="judgement",
    output_key_reason="reason",
)
```

#### 输入示例

```json
[
  {
    "triple": [
      "<entity> Zhang San <attribute> charge <value> theft",
      "<entity> Zhang San <attribute> amount_involved <value> RMB 6000"
    ]
  }
]
```

#### 输出示例

```json
[
  {
    "triple": [
      "<entity> Zhang San <attribute> charge <value> theft",
      "<entity> Zhang San <attribute> amount_involved <value> RMB 6000"
    ],
    "judgement": "Fixed-term imprisonment of three years and a fine.",
    "reason": [
      "<entity> Zhang San <attribute> charge <value> theft",
      "<entity> Zhang San <attribute> amount_involved <value> RMB 6000"
    ]
  }
]
```

#### 相关链接

- 算子实现：`DataFlow-KG/dataflow/operators/domain_kg/legal_kg/generate/legalkg_case_judgement_generator.py`
- 默认 Prompt：`DataFlow-KG/dataflow/prompts/diverse_kg/legalkg.py`
