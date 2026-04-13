---
title: KGEntityClassification
createTime: 2026/04/11 13:00:00
permalink: /zh/kg_operators/general_kg/refine/kg_entity_classification/
---

## 📚 概述
`KGEntityClassification` 用于给已抽取的实体做类型分类。它接收实体列表，通过大模型判断每个实体所属的类别，并将预测结果写回 DataFrame。

算子默认读取 `entity` 列，输出到 `entity_type` 列。模型返回内容会尝试按 JSON 解析；如果返回的不是列表，则会自动包装成单元素列表；解析失败时输出空列表。

## ✒️ __init__ 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    prompt_template: Union[KGEntityTypeClassificationPrompt, DIYPromptABC] = None,
    num_q: int = 5
):
    ...
```

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 大模型服务对象。 |
| `seed` | `int` | `0` | 内部随机数种子。 |
| `lang` | `str` | `"en"` | Prompt 语言。 |
| `prompt_template` | `Union[KGEntityTypeClassificationPrompt, DIYPromptABC]` | `None` | 自定义分类 Prompt。 |
| `num_q` | `int` | `5` | 预留参数，当前实现中未显式限制批大小。 |

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "entity",
    output_key: str = "entity_type"
):
    ...
```

`run` 会读取 DataFrame，检查输入列和输出列，然后把 `entity` 列逐行送入 `process_batch()`。在批处理过程中，算子使用 `KGEntityTypeClassificationPrompt` 构建提示词，调用模型并尝试把结果解析为类型列表。最终每一行的类型预测会写入 `entity_type`。

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | DataFrame 存储对象。 |
| `input_key` | `str` | `"entity"` | 输入实体列名。 |
| `output_key` | `str` | `"entity_type"` | 输出实体类型列名。 |

## 🤖 示例用法
```python
from dataflow.operators.general_kg.refinement.kg_entity_classification import (
    KGEntityClassification,
)

operator = KGEntityClassification(
    llm_serving=llm_serving,
    lang="en",
)

operator.run(
    storage=storage,
    input_key="entity",
    output_key="entity_type",
)
```

默认输入输出格式如下：

| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `entity` | `str` | 输入实体字符串；当前测试数据中通常为逗号分隔的实体列表。 |
| `entity_type` | `List[str]` | 与输入实体顺序对齐的类型标签列表。 |

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
    "entity_type": ["Person", "Organization"]
  }
]
```

相关文件：

- 算子实现：`DataFlow-KG/dataflow/operators/general_kg/refinement/kg_entity_classification.py`
