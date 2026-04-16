---
title: MedKGMetaPathGenerator
createTime: 2026/04/11 10:30:00
permalink: /zh/kg_operators/domain_kg/medical_kg/filter/medkg_triple_metapath_sampling/
---

## 📚 概述
`MedKGMetaPathGenerator` 是一个用于按元路径规则匹配医学图谱实例路径的过滤类算子。
它不依赖大模型，而是直接解析三元组与实体类型列表，构建图结构后按用户提供的 `meta_path_rule` 深度优先搜索符合规则的路径实例。

这个算子的几个关键特点如下：

- 不依赖 LLM，完全基于规则和图搜索
- 默认读取 `triple` 和 `entity_class`
- 需要显式传入 `meta_path_rule`
- 默认输出到 `matched_meta_path`
- 当前实现会将匹配结果写成一个新的单列表 DataFrame，而不是保留原始行结构

---

## ✒️ __init__ 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC = None,
    seed: int = 0,
    lang: str = "en",
    max_paths_per_group: int = 100,
):
    ...
```

#### `__init__` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | `None` | 预留参数。当前实现未使用。 |
| `seed` | `int` | `0` | 用于控制当匹配路径超过上限时的随机截断顺序。 |
| `lang` | `str` | `"en"` | 预留参数。当前主流程未使用。 |
| `max_paths_per_group` | `int` | `100` | 最多保留的匹配路径数量。超过上限时会随机打散后截断。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "triple",
    input_key_class: str = "entity_class",
    meta_path_rule: Union[str, List[str]] = None,
    output_key_meta: str = "matched_meta_path",
):
    ...
```

`run` 会先读取 DataFrame，并检查输入列是否存在。若 DataFrame 只有一行，它要求该行中的 `triple` 和 `entity_class` 都是列表；若有多行，则会把多行中的三元组与实体类型直接拼接成一个全局图再做匹配。之后算子会把 `meta_path_rule` 解析为“实体类型 - 关系 - 实体类型”的交替序列，构建无向图并按规则做 DFS 匹配。最终结果会写成仅包含 `matched_meta_path` 一列的新 DataFrame。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow 数据存储对象。 |
| `input_key` | `str` | `"triple"` | 输入三元组列名。若该列不存在，代码会尝试回退到 `triple` 或 `tuple`。 |
| `input_key_class` | `str` | `"entity_class"` | 输入实体类型列名。 |
| `meta_path_rule` | `Union[str, List[str]]` | `None` | 元路径规则，例如 `"Disease -> treats -> Compound -> affects -> Gene"`。 |
| `output_key_meta` | `str` | `"matched_meta_path"` | 输出列名。 |

---

## 🤖 示例用法
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.medical_kg.filter.medkg_triple_metapath_sampling import (
    MedKGMetaPathGenerator,
)

dataframe = pd.DataFrame(
    [
        {
            "triple": [
                "<subj> lung cancer <obj> gefitinib <rel> treats",
                "<subj> gefitinib <obj> EGFR <rel> affects"
            ],
            "entity_class": [
                ["Disease", "Compound"],
                ["Compound", "Gene"]
            ]
        }
    ]
)

storage = DummyStorage()
storage.set_data(dataframe)

operator = MedKGMetaPathGenerator(max_paths_per_group=50)
operator.run(
    storage=storage,
    input_key="triple",
    input_key_class="entity_class",
    meta_path_rule="Disease -> treats -> Compound -> affects -> Gene",
    output_key_meta="matched_meta_path",
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `matched_meta_path` | `str` | 匹配到的元路径实例字符串，每行一条。多跳路径内部以 ` || ` 连接。 |

---

#### 示例输入
```json
[
  {
    "triple": [
      "<subj> lung cancer <obj> gefitinib <rel> treats",
      "<subj> gefitinib <obj> EGFR <rel> affects"
    ],
    "entity_class": [
      ["Disease", "Compound"],
      ["Compound", "Gene"]
    ]
  }
]
```

#### 示例输出
```json
[
  {
    "matched_meta_path": "<subj> lung cancer <obj> gefitinib <rel> treats || <subj> gefitinib <obj> EGFR <rel> affects"
  }
]
```

---
#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/domain_kg/medical_kg/filter/medkg_triple_metapath_sampling.py`
- 上游抽取算子：`DataFlow-KG/dataflow/operators/domain_kg/medical_kg/generate/medkg_triple_extractor.py`


