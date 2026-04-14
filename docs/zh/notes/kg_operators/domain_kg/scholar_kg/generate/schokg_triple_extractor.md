---
title: SchoKGTripleExtraction
createTime: 2026/04/11 10:40:00
permalink: /zh/kg_operators/domain_kg/scholar_kg/generate/schokg_triple_extractor/
---

## 📚 概述
`SchoKGTripleExtraction` 是一个用于学者领域知识图谱三元组抽取的生成类算子。
它会读取学术文本，结合学者本体约束调用大模型抽取三元组，并同步产出每条三元组对应的实体类型结果。

这个算子的几个关键特点如下：

- 依赖 `LLMServingABC` 提供三元组抽取能力
- 默认使用 `SchoKGRelationExtractorPrompt`
- 支持直接传入 `ontology_lists`，也支持从 `./.cache/schokg/` 按名称加载本体
- 默认读取 `raw_chunk`，默认输出到 `triple` 和 `entity_class`
- 抽取前会做文本长度、句子数和字符质量过滤

---

## ✒️ __init__ 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    triple_type: str = "relation",
    lang: str = "en",
    num_q: int = 5
):
    ...
```

#### `__init__` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象。 |
| `seed` | `int` | `0` | 用于初始化内部随机数生成器。 |
| `triple_type` | `str` | `"relation"` | 预留参数。当前实现未使用。 |
| `lang` | `str` | `"en"` | Prompt 语言。构造函数会固定创建 `SchoKGRelationExtractorPrompt(lang=self.lang)`。 |
| `num_q` | `int` | `5` | 预留参数。当前实现未参与主流程。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    ontology_lists = None,
    input_key: str = "raw_chunk",
    input_key_meta: Union[str, List[str]] = "ontology",
    output_key: str = "triple",
    output_key_meta: str = "entity_class"
):
    ...
```

`run` 会先读取 DataFrame，并检查输入列与输出列。之后算子会解析学者本体：如果提供了 `ontology_lists`，就直接使用；否则按 `input_key_meta` 指定的名称从 `./.cache/schokg/` 读取单个或多个本体并做合并。接着算子逐行做文本预处理，对不符合要求的文本直接输出空列表；对有效文本则调用默认 Prompt，解析模型返回的 `triple` 和 `entity_class` 两个字段并写回 DataFrame。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow 数据存储对象。 |
| `ontology_lists` | `Any` | `None` | 可选本体对象。可传单个字典或本体字典列表。 |
| `input_key` | `str` | `"raw_chunk"` | 输入文本列名。 |
| `input_key_meta` | `Union[str, List[str]]` | `"ontology"` | 本体名或本体名列表，用于缓存加载。 |
| `output_key` | `str` | `"triple"` | 输出三元组列名。 |
| `output_key_meta` | `str` | `"entity_class"` | 输出实体类型列名。 |

---

## 🤖 示例用法
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.scholar_kg.generate.schokg_triple_extractor import (
    SchoKGTripleExtraction,
)

# Step 1: 假设 llm_serving 已按项目方式初始化

# Step 2: 准备输入数据
dataframe = pd.DataFrame(
    [
        {
            "raw_chunk": "Geoffrey Hinton is affiliated with the University of Toronto. He published influential work in deep learning."
        }
    ]
)

ontology = {
    "entity_type": {"core": ["Author", "University", "Paper"]},
    "relation_type": {"core": ["affiliated_with", "published"]}
}

storage = DummyStorage()
storage.set_data(dataframe)

operator = SchoKGTripleExtraction(
    llm_serving=llm_serving,
    lang="en",
)
operator.run(
    storage=storage,
    ontology_lists=ontology,
    input_key="raw_chunk",
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `raw_chunk` | `str` | 输入学术文本。 |
| `triple` | `List[str]` | 抽取出的学者图谱三元组字符串列表。 |
| `entity_class` | `List[List[str]]` | 与 `triple` 逐项对齐的实体类型列表。 |

---

#### 示例输入
```json
[
  {
    "raw_chunk": "Geoffrey Hinton is affiliated with the University of Toronto. He published influential work in deep learning."
  }
]
```

#### 示例输出
```json
[
  {
    "raw_chunk": "Geoffrey Hinton is affiliated with the University of Toronto. He published influential work in deep learning.",
    "triple": [
      "<subj> Geoffrey Hinton <obj> University of Toronto <rel> affiliated_with"
    ],
    "entity_class": [
      ["Author", "University"]
    ]
  }
]
```

---
#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/domain_kg/scholar_kg/generate/schokg_triple_extractor.py`
- 默认 Prompt：`DataFlow-KG/dataflow/prompts/diverse_kg/schokg.py`
- 相关算子：`DataFlow-KG/dataflow/operators/domain_kg/scholar_kg/generate/schokg_query_reasoning.py`


