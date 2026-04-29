---
title: HRKGTripleConsistencyEvaluator
createTime: 2026/04/13 00:00:00
permalink: /zh/kg_operators/hyper_relation_kg/eval/hrkg_rel_triple_consistency_eval/
---

## 📚 概述

[HRKGTripleConsistencyEvaluator](https://github.com/ZhP-Li197/DataFlow-KG/tree/main/dataflow/operators/hyper_relation_kg/eval/hrkg_rel_triple_consistency_eval.py) 是一个基于大语言模型（LLM）的超关系知识图谱三元组一致性评估算子。它评估每个超关系元组中的属性在逻辑上是否相互一致，以及与关系是否一致，并为每个元组分配一致性分数（0-1）。算子支持 Python 列表和 JSON 编码的字符串列表输入，并返回与输入元组对齐的分数列表。

## ✒️ `__init__`函数

```python
def __init__(self, llm_serving: LLMServingABC, lang: str = "en"):
```

#### 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| **llm_serving** | LLMServingABC | 必填 | 大语言模型服务实例，用于一致性评估推理。 |
| **lang** | str | "en" | 语言设置，影响 Prompt 模板语言；支持 "en" 或 "zh"。 |

#### Prompt 模板

Prompt 使用 `HRKGTripleConsistencyPrompt`：

```python
def build_system_prompt(self):
    return textwrap.dedent("""\
        你是一名知识图谱三元组质量评估专家。
        你的任务是评估每个三元组的**一致性**。

        ### 判断标准
        - 三元组的主体、客体和关系是否逻辑上协调
        - 关系的不同属性是否相互一致（例如时间、地点、数值等是否合理匹配）
        - 检查是否存在明显矛盾或冲突信息

        ### 输出格式
        仅返回 JSON：
        {
            "consistency_scores": [float, float, ...]
        }

        每个三元组对应一个分数，范围 0-1：
        1 = 完全一致
        0.5 = 部分一致，有轻微矛盾
        0 = 严重不一致或属性冲突

        不要输出任何解释。
    """)

def build_prompt(self, triples: list):
    triple_block = ""
    for idx, t in enumerate(triples):
        triple_block += f"ID {idx}: {t}\n"
    return f"""请评估以下知识图谱三元组的属性一致性。

        --- Triples ---
        {triple_block}

        请返回每个三元组的一致性得分（0-1），并严格按照 JSON 输出。"""
```

## 💡 `run`函数

`run` 从 `storage` 读取 DataFrame，验证存储可用，并遍历每一行。对于每一行，从 `input_key` 提取元组列表，解析它（支持 Python 列表和 JSON 字符串格式），然后使用 Prompt 模板调用 LLM 评估一致性分数。结果分数列表写入 `output_key` 列。如果某行为空、解析失败或 LLM 调用抛出异常，则该行写入空列表。函数返回包含 `output_key` 字符串的列表。

```python
def run(self, storage: DataFlowStorage = None, input_key: str = "tuple", output_key: str = "consistency_scores"):
```

#### 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| **storage** | DataFlowStorage | None | DataFlow 存储实例，负责数据读写。 |
| **input_key** | str | "tuple" | 输入列名，对应超关系元组列表字段。每行可以是 Python 列表或 JSON 编码的字符串。 |
| **output_key** | str | "consistency_scores" | 输出列名，对应一致性分数列表字段。 |

## 🤖 示例用法

```python
from dataflow.operators.hyper_relation_kg.eval import HRKGTripleConsistencyEvaluator
from dataflow.utils.storage import FileStorage
from dataflow.utils.llm_serving import APILLMServing_request

storage = FileStorage(first_entry_file_name="hrkg_eval.json")

llm_serving = APILLMServing_request(
    api_url="http://<your_llm_api_endpoint>",
    model_name="<your_model_name>",
)

evaluator = HRKGTripleConsistencyEvaluator(
    llm_serving=llm_serving,
    lang="en",
)
evaluator.run(
    storage.step(),
    input_key="tuple",
    output_key="consistency_scores",
)
```

#### 🧾 默认输出格式（Output Format）

| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| **tuple** | **List[str]** | 输入的超关系元组列表（保留）。 |
| **consistency_scores** | **List[float]** | 每个元组的一致性分数（0-1）；1=完全一致，0=严重不一致。 |

**示例输入：**

```json
{
  "tuple": [
    "<subj> Elon Musk <obj> Announcement <rel> MadeAt <time> May 15, 2025 <location> Tesla Gigafactory, Berlin, Germany",
    "<subj> Tesla Model Y <obj> 4680 Battery <rel> WillAdopt <time> Third quarter of 2025 <location> European market",
    "<subj> Tesla Model Y <obj> Cruising Range <rel> IncreasedTo <value> 600 kilometers"
  ]
}
```

**示例输出：**

```json
{
  "tuple": ["..."],
  "consistency_scores": [1.0, 1.0, 0.95]
}
```

---

#### 相关链接

- 算子实现：`DataFlow-KG/dataflow/operators/hyper_relation_kg/eval/hrkg_rel_triple_consistency_eval.py`
- Prompt 模板：`DataFlow-KG/dataflow/prompts/diverse_kg/hrkg.py`
- 下游算子：`DataFlow-KG/dataflow/operators/hyper_relation_kg/filter/hrkg_rel_triple_consistency_filtering.py`
