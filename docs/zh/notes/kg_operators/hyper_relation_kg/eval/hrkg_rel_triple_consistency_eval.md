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

Prompt 使用 `HRKGTripleCompletenessPrompt`：

```python
def build_system_prompt(self):
    return textwrap.dedent("""\
        You are an expert in Knowledge Graph triple quality evaluation.
        Your task is to evaluate the **consistency** of each triple.

        ### Evaluation Criteria
        - Check if the subject, object, and relation are logically coherent
        - Check if the relation's different attributes are consistent (e.g., time, location, values)
        - Detect any obvious contradictions or conflicts

        ### Output Format
        Return ONLY a JSON object:

        {
            "consistency_scores": [float, float, ...]
        }

        Each score corresponds to one triple (0-1):
        1 = fully consistent
        0.5 = partially consistent, minor conflicts
        0 = severely inconsistent or contradictory

        Do not output explanations.
    """)

def build_prompt(self, triples: list):
    triple_block = ""
    for idx, t in enumerate(triples):
        triple_block += f"ID {idx}: {t}\n"
    return f"""Evaluate the consistency of the following KG triples.

        --- Triples ---
        {triple_block}

        Return ONLY a JSON object containing consistency scores for each triple (0-1)."""
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
    "<subj> Elon Musk <obj> Announcement <rel> MadeAt <Time> May 15, 2025 <Location> Tesla Gigafactory, Berlin, Germany",
    "<subj> Tesla Model Y <obj> 4680 Battery <rel> WillAdopt <Time> Third quarter of 2025 <Location> European market",
    "<subj> Tesla Model Y <obj> Cruising Range <rel> IncreasedTo <Value> 600 kilometers"
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

- 算子实现：`DataFlow-KG/dataflow/operators/hyper_relation_kg/eval/hrkg_rel_triple_consistence_eval.py`
- Prompt 模板：`DataFlow-KG/dataflow/prompts/diverse_kg/hrkg.py`
- 下游算子：`DataFlow-KG/dataflow/operators/hyper_relation_kg/filter/hrkg_rel_triple_consistence_filtering.py`
