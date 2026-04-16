---
title: MedKGTripleExtraction
createTime: 2026/04/11 10:00:00
permalink: /zh/kg_operators/domain_kg/medical_kg/generate/medkg_triple_extractor/
---

## 📚 概述
`MedKGTripleExtraction` 是一个用于医学领域知识图谱三元组抽取的生成类算子。
它会读取原始文本，结合医学本体约束调用大模型抽取关系三元组，并同时输出每条三元组对应的实体类型结果。

这个算子的几个关键特点如下：

- 依赖 `LLMServingABC` 提供三元组抽取能力
- 默认使用 `MedKGRelationExtractorPrompt`，要求输出 `triple` 与 `entity_class`
- 支持直接传入 `ontology_lists`，也支持按本体名从 `./.cache/medical/` 加载
- 默认读取 `raw_chunk`，默认输出到 `triple` 和 `entity_class`
- 抽取前会做基础文本清洗与质量过滤，不合格文本会直接返回空结果

---

## ✒️ `__init__` 函数
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
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象。算子通过 `generate_from_input` 执行医学三元组抽取。 |
| `seed` | `int` | `0` | 用于初始化内部随机数生成器。当前主流程中未继续使用随机行为。 |
| `triple_type` | `str` | `"relation"` | 预留参数。当前实现未使用该参数切换抽取逻辑。 |
| `lang` | `str` | `"en"` | Prompt 语言。构造函数会固定创建 `MedKGRelationExtractorPrompt(lang=self.lang)`。 |
| `num_q` | `int` | `5` | 预留参数。当前实现中未参与主流程。 |

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

`run` 会先从 `storage` 中读取 DataFrame，并检查输入列与输出列状态。之后它会解析医学本体：如果显式传入 `ontology_lists`，就直接使用；否则按 `input_key_meta` 指定的名称从 `./.cache/medical/` 读取单个或多个本体并合并。随后算子逐行处理文本，对不符合长度、句子数或字符质量要求的文本直接返回空列表；对有效文本则调用默认 Prompt 要求模型返回 JSON，并分别解析出 `triple` 与 `entity_class` 两列写回 DataFrame。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow 数据存储对象。算子会从中读取 `dataframe` 并将结果写回。 |
| `ontology_lists` | `Any` | `None` | 可选本体对象。可传入单个本体字典，或传入多个本体字典组成的列表。 |
| `input_key` | `str` | `"raw_chunk"` | 输入文本列名。 |
| `input_key_meta` | `Union[str, List[str]]` | `"ontology"` | 本体名或本体名列表。仅在 `ontology_lists=None` 时用于缓存加载。 |
| `output_key` | `str` | `"triple"` | 输出三元组列名。 |
| `output_key_meta` | `str` | `"entity_class"` | 输出实体类型列名。 |

---

## 🤖 示例用法
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.medical_kg.generate.medkg_triple_extractor import (
    MedKGTripleExtraction,
)

# Step 1: 假设 llm_serving 已按项目方式初始化

# Step 2: 准备输入数据
dataframe = pd.DataFrame(
    [
        {
            "raw_chunk": "EGFR mutation is associated with non-small cell lung cancer. Gefitinib targets EGFR in tumor cells."
        }
    ]
)

ontology = {
    "entity_type": {"core": ["Disease", "Drug", "Gene"]},
    "relation_type": {"core": ["associates", "targets"]}
}

storage = DummyStorage()
storage.set_data(dataframe)

operator = MedKGTripleExtraction(
    llm_serving=llm_serving,
    lang="en",
)
operator.run(
    storage=storage,
    ontology_lists=ontology,
    input_key="raw_chunk",
    output_key="triple",
    output_key_meta="entity_class",
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `raw_chunk` | `str` | 输入医学文本。 |
| `triple` | `List[str]` | 抽取出的三元组字符串列表，格式为 `"<subj> ... <obj> ... <rel> ..."`。 |
| `entity_class` | `List[List[str]]` | 与 `triple` 逐项对齐的实体类型列表。通常每项包含主体与客体类型。 |

---

#### 示例输入
```json
[
  {
    "raw_chunk": "EGFR mutation is associated with non-small cell lung cancer. Gefitinib targets EGFR in tumor cells."
  }
]
```

#### 示例输出
```json
[
  {
    "raw_chunk": "EGFR mutation is associated with non-small cell lung cancer. Gefitinib targets EGFR in tumor cells.",
    "triple": [
      "<subj> EGFR <obj> non-small cell lung cancer <rel> associates",
      "<subj> Gefitinib <obj> EGFR <rel> targets"
    ],
    "entity_class": [
      ["Gene", "Disease"],
      ["Drug", "Gene"]
    ]
  }
]
```

---
#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/domain_kg/medical_kg/generate/medkg_triple_extractor.py`
- 默认 Prompt：`DataFlow-KG/dataflow/prompts/diverse_kg/medkg.py`
- 相关过滤算子：`DataFlow-KG/dataflow/operators/domain_kg/medical_kg/filter/medkg_triple_metapath_sampling.py`


