---
title: LegalKGTupleExtraction
createTime: 2026/04/15 09:00:00
permalink: /zh/kg_operators/domain_kg/legal_kg/generate/legalkg_triple_extractor/
---

## 📚 概述

`LegalKGTupleExtraction` 用于从法律文本中抽取法律图谱条目，并生成案件摘要。根据 `triple_type` 的不同，它会在关系三元组抽取和属性三元组抽取两种 Prompt 之间切换。

这个算子的几个关键特点如下：

- 依赖 `LLMServingABC` 调用大模型完成抽取
- 默认读取 `raw_chunk` 列
- 默认输出 `triple`、`entity_class` 和 `case_summary`
- 当前实现实际依赖缓存文件 `./.cache/api/legal_ontology.json` 构造本体
- 会先做文本预处理与质量检查，不满足条件的文本会输出空结果

## ✒️ `__init__` 函数

```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    triple_type: str = "attribute",
    lang: str = "zh",
    num_q: int = 5
):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象 |
| `seed` | `int` | `0` | 初始化内部随机数生成器；当前主流程未使用随机采样 |
| `triple_type` | `str` | `"attribute"` | 抽取模式；`"attribute"` 使用属性三元组 Prompt，`"relation"` 使用关系三元组 Prompt |
| `lang` | `str` | `"zh"` | Prompt 语言 |
| `num_q` | `int` | `5` | 预留参数，当前主流程未使用 |

## 💡 `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage = None,
    ontology_lists = None,
    input_key: str = "raw_chunk",
    input_key_meta: str = "legal_ontology",
    output_key: str = "triple",
    output_key_meta1: str = "entity_class",
    output_key_meta2: str = "case_summary",
):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | DataFlow 存储对象 |
| `ontology_lists` | `Any` | `None` | 参数已在函数签名中保留，但当前 `run()` 实现并不能稳定直接使用外部传入本体对象 |
| `input_key` | `str` | `"raw_chunk"` | 输入法律文本列名 |
| `input_key_meta` | `str` | `"legal_ontology"` | 本体缓存文件名标识，实际读取 `./.cache/api/{input_key_meta}.json` |
| `output_key` | `str` | `"triple"` | 输出图谱条目列名 |
| `output_key_meta1` | `str` | `"entity_class"` | 输出实体类别列名 |
| `output_key_meta2` | `str` | `"case_summary"` | 输出案件摘要列名 |

`run` 先读取 DataFrame，并取出 `input_key` 列的文本。当前实现的可用路径是从缓存 JSON 的首行构造本体：

```python
{
    "entity_type": row["entity_type"],
    "relation_type": row["relation_type"],
    "attribute_type": row.get("attribute_type", {})
}
```

需要注意，虽然函数签名保留了 `ontology_lists` 参数，但当前代码只在 `ontology_lists == None` 的分支里构造 `ontology_dict`，随后固定调用：

```python
self.process_batch(texts, ontology_dict)
```

因此在当前实现下，直接传入非空 `ontology_lists` 并不能稳定替代缓存加载逻辑。

之后算子会逐条文本执行预处理：

- 非字符串直接丢弃
- 去除首尾空白
- 文本长度必须在 `10` 到 `200000` 之间
- 至少包含两个中文句号 `。` 或英文句号 `.`
- 特殊字符比例不能超过 `0.3`

未通过校验的文本会输出空列表。成功解析后会把 `triple`、`entity_class`、`case_summary` 写回 DataFrame，并返回：

```python
["triple"]
```

## 🤖 示例用法

```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.legal_kg.generate.legalkg_triple_extractor import (
    LegalKGTupleExtraction,
)

dataframe = pd.DataFrame(
    [
        {
            "raw_chunk": "The defendant Zhang San secretly took a mobile phone from a shopping mall, with a value of RMB 6000. The police later arrested the defendant. The court held that the conduct constituted theft."
        }
    ]
)

storage = DummyStorage()
storage.set_data(dataframe)

operator = LegalKGTupleExtraction(
    llm_serving=llm_serving,
    triple_type="attribute",
    lang="zh",
)
operator.run(
    storage=storage,
    input_key="raw_chunk",
    input_key_meta="legal_ontology",
    output_key="triple",
    output_key_meta1="entity_class",
    output_key_meta2="case_summary",
)
```

#### 默认输出格式

| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `triple` | `List[str]` | 抽取出的法律图谱条目列表；属性模式通常为 `<entity> ... <attribute> ... <value> ...`，关系模式通常为 `<subj> ... <obj> ... <rel> ...` |
| `entity_class` | `List[List[str]]` / `List` | 通常是与 `triple` 按顺序对齐的实体类别信息；当文本预处理失败时，`_construct_examples` 失败分支仅返回 `{"source_text": "", "triple": []}`，`run()` 回写时用 `o.get("entity_class", [])` 取默认值，因此该列会被明确写成空列表 `[]` |
| `case_summary` | `str` / `List` | 通常是大模型生成的案件摘要字符串；当文本预处理失败时，同 `entity_class`——`run()` 回写时用 `o.get("case_summary", [])` 取默认值，该列会被明确写成空列表 `[]` |

#### 输入示例

```json
[
  {
    "raw_chunk": "The defendant Zhang San secretly took a mobile phone from a shopping mall, with a value of RMB 6000. The police later arrested the defendant. The court held that the conduct constituted theft."
  }
]
```

#### 输出示例

```json
[
  {
    "raw_chunk": "The defendant Zhang San secretly took a mobile phone from a shopping mall, with a value of RMB 6000. The police later arrested the defendant. The court held that the conduct constituted theft.",
    "triple": [
      "<entity> Zhang San <attribute> amount_involved <value> RMB 6000",
      "<entity> Zhang San <attribute> charge <value> theft"
    ],
    "entity_class": [
      ["Defendant"],
      ["Defendant"]
    ],
    "case_summary": "The defendant Zhang San stole a mobile phone valued at RMB 6000 from a shopping mall. The court determined that the conduct constituted theft."
  }
]
```

#### 相关链接

- 算子实现：`DataFlow-KG/dataflow/operators/domain_kg/legal_kg/generate/legalkg_triple_extractor.py`
- 默认 Prompt：`DataFlow-KG/dataflow/prompts/diverse_kg/legalkg.py`
