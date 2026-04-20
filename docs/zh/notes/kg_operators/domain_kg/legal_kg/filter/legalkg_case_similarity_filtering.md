---
title: LegalKGCaseSimilarityFilter
createTime: 2026/04/15 09:00:00
permalink: /zh/kg_operators/domain_kg/legal_kg/filter/legalkg_case_similarity_filtering/
---

## 📚 概述

`LegalKGCaseSimilarityFilter` 用于按案件相似度分数过滤整行数据。它读取原始 DataFrame，根据 `similarity_score` 是否落在指定区间内保留或删除对应行，然后将过滤后的 DataFrame 直接写回存储。

需要注意，当前实现虽然类注释里提到了 `filtered_subgraph`，但 `run()` 实际不会新增输出列，而是直接保留满足阈值条件的行。

## ✒️ `__init__` 函数

```python
def __init__(self, merge_to_input: bool = False):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `merge_to_input` | `bool` | `False` | 预留参数，当前过滤流程未使用 |

## 💡 `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "triple",
    output_key: str = "similarity_score",
    min_score: float = 0.8,
    max_score: float = 1.0,
):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | DataFlow 存储对象 |
| `input_key` | `str` | `"triple"` | 需要存在的输入列名；当前实现只做存在性校验，不直接参与过滤条件 |
| `output_key` | `str` | `"similarity_score"` | 过滤使用的分数字段列名 |
| `min_score` | `float` | `0.8` | 最小保留分数 |
| `max_score` | `float` | `1.0` | 最大保留分数 |

`run` 会检查 `input_key` 和 `output_key` 两列都存在，然后执行：

```python
df[(df[output_key] >= min_score) & (df[output_key] <= max_score)]
```

过滤结果会整体写回 `storage`。函数返回值是 `None`。

## 🤖 示例用法

```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.legal_kg.filter.legalkg_case_similarity_filtering import (
    LegalKGCaseSimilarityFilter,
)

dataframe = pd.DataFrame(
    [
        {
            "triple": ["<entity> Zhang San <attribute> sentence <value> three years of imprisonment"],
            "similarity_score": 0.92
        },
        {
            "triple": ["<entity> Li Si <attribute> sentence <value> one month of detention"],
            "similarity_score": 0.45
        }
    ]
)

storage = DummyStorage()
storage.set_data(dataframe)

operator = LegalKGCaseSimilarityFilter()
operator.run(
    storage=storage,
    input_key="triple",
    output_key="similarity_score",
    min_score=0.8,
    max_score=1.0,
)
```

#### 输入示例

```json
[
  {
    "triple": ["<entity> Zhang San <attribute> sentence <value> three years of imprisonment"],
    "similarity_score": 0.92
  },
  {
    "triple": ["<entity> Li Si <attribute> sentence <value> one month of detention"],
    "similarity_score": 0.45
  }
]
```

#### 输出示例

```json
[
  {
    "triple": ["<entity> Zhang San <attribute> sentence <value> three years of imprisonment"],
    "similarity_score": 0.92
  }
]
```

#### 相关链接

- 算子实现：`DataFlow-KG/dataflow/operators/domain_kg/legal_kg/filter/legalkg_case_similarity_filtering.py`
- 上游评测算子：`DataFlow-KG/dataflow/operators/domain_kg/legal_kg/eval/legalkg_case_similarity_eval.py`
