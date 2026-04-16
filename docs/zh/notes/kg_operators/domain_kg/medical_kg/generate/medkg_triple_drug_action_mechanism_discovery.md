---
title: MedKGTripleDrugActionMechanismDiscovery
createTime: 2026/04/11 10:10:00
permalink: /zh/kg_operators/domain_kg/medical_kg/generate/medkg_triple_drug_action_mechanism_discovery/
---

## 📚 概述
`MedKGTripleDrugActionMechanismDiscovery` 是一个用于药物作用机制路径发现与回答生成的生成类算子。
它会根据用户查询和输入三元组构建候选推理路径，再调用大模型从候选路径中选择最能支撑回答的路径，并生成自然语言机制解释。

这个算子的几个关键特点如下：

- 依赖 `LLMServingABC` 提供路径选择与答案生成能力
- 默认使用 `MedKGDrugActionMechanismPrompt`
- 默认读取 `query` 与 `triple` 两列
- 默认输出 `mechanism_path` 与 `mechanism_answer`
- 候选路径由代码先做图搜索，LLM 只负责在候选集合上做筛选与总结

---

## ✒️ `__init__` 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    max_hop: int = 3,
    max_candidate_paths: int = 20,
    prompt_template=None,
):
    ...
```

#### `__init__` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象，用于根据候选路径生成最终机制回答。 |
| `seed` | `int` | `0` | 用于初始化内部随机数生成器。当前候选路径截断流程未直接使用随机打散。 |
| `lang` | `str` | `"en"` | 默认 Prompt 语言。 |
| `max_hop` | `int` | `3` | 图搜索时允许的最大跳数。 |
| `max_candidate_paths` | `int` | `20` | 送入 Prompt 之前保留的候选路径数量上限。 |
| `prompt_template` | `Any` | `None` | 自定义 Prompt 模板；若为 `None`，则使用 `MedKGDrugActionMechanismPrompt(lang=self.lang)`。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key_query: str = "query",
    input_key_triple: str = "triple",
    output_key_path: str = "mechanism_path",
    output_key_answer: str = "mechanism_answer",
):
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，并检查查询列、三元组列与输出列状态。随后算子逐行处理数据：它先把三元组解析成无向图结构，再从查询中匹配最相关的实体名称，并优先尝试在前四个匹配实体之间搜索连接路径；如果没有找到合适路径，则退回到从前两个种子实体出发收集路径。收集完路径后，算子会按与查询的词项重叠和路径长度排序，截取前 `max_candidate_paths` 条，交给 Prompt 生成 `mechanism_path` 与 `mechanism_answer`。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow 数据存储对象。 |
| `input_key_query` | `str` | `"query"` | 用户查询列名。 |
| `input_key_triple` | `str` | `"triple"` | 输入三元组列名，通常应为 `List[str]`。 |
| `output_key_path` | `str` | `"mechanism_path"` | 输出机制路径列名。 |
| `output_key_answer` | `str` | `"mechanism_answer"` | 输出机制说明列名。 |

---

## 🤖 示例用法
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.medical_kg.generate.medkg_triple_drug_action_mechanism_discovery import (
    MedKGTripleDrugActionMechanismDiscovery,
)

# Step 1: 假设 llm_serving 已按项目方式初始化

# Step 2: 准备输入数据
dataframe = pd.DataFrame(
    [
        {
            "query": "How does gefitinib act on EGFR-mutant lung cancer?",
            "triple": [
                "<subj> Gefitinib <obj> EGFR <rel> binds",
                "<subj> EGFR <obj> cell proliferation <rel> affects",
                "<subj> non-small cell lung cancer <obj> EGFR <rel> associates"
            ]
        }
    ]
)

storage = DummyStorage()
storage.set_data(dataframe)

operator = MedKGTripleDrugActionMechanismDiscovery(
    llm_serving=llm_serving,
    lang="en",
    max_hop=3,
)
operator.run(
    storage=storage,
    input_key_query="query",
    input_key_triple="triple",
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `query` | `str` | 输入用户查询。 |
| `triple` | `List[str]` | 输入医学三元组列表。 |
| `mechanism_path` | `List[str]` | 被模型选中的候选路径字符串列表。 |
| `mechanism_answer` | `str` | 基于选中路径生成的机制解释文本。 |

---

#### 示例输入
```json
[
  {
    "query": "How does gefitinib act on EGFR-mutant lung cancer?",
    "triple": [
      "<subj> Gefitinib <obj> EGFR <rel> binds",
      "<subj> EGFR <obj> cell proliferation <rel> affects",
      "<subj> non-small cell lung cancer <obj> EGFR <rel> associates"
    ]
  }
]
```

#### 示例输出
```json
[
  {
    "query": "How does gefitinib act on EGFR-mutant lung cancer?",
    "triple": [
      "<subj> Gefitinib <obj> EGFR <rel> binds",
      "<subj> EGFR <obj> cell proliferation <rel> affects",
      "<subj> non-small cell lung cancer <obj> EGFR <rel> associates"
    ],
    "mechanism_path": [
      "<subj> Gefitinib <obj> EGFR <rel> binds || <subj> EGFR <obj> cell proliferation <rel> affects"
    ],
    "mechanism_answer": "Gefitinib may act by binding EGFR and affecting downstream cell proliferation related to the disease context."
  }
]
```

---
#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/domain_kg/medical_kg/generate/medkg_triple_drug_action_mechanism_discovery.py`
- 默认 Prompt：`DataFlow-KG/dataflow/prompts/diverse_kg/medkg.py`
- 相关算子：`DataFlow-KG/dataflow/operators/domain_kg/medical_kg/generate/medkg_triple_drug_repositioning_discovery.py`


