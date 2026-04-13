---
title: HRKGRelationTripleSubgraphQAGeneration
createTime: 2026/04/13 00:00:00
permalink: /zh/kg_operators/hyper_relation_kg/generate/hrkg_rel_triple_subgraph_qa_generator/
---

## 📚 概述

[HRKGRelationTripleSubgraphQAGeneration](https://github.com/ZhP-Li197/DataFlow-KG/tree/main/dataflow/operators/hyper_relation_kg/generate/hrkg_rel_triple_subgraph_qa_generator.py) 是一个基于大语言模型（LLM）的超关系知识图谱子图问答生成算子。它以超关系知识图谱子图作为输入，生成结构化的问答对。算子支持两种问答类型：`num`（数值型问答对）和 `set`（集合型问答对）。每个问题必须依赖子图中至少两个元组，答案从元组中的显式关系属性推导得出。

## ✒️ `__init__`函数

```python
def __init__(self, llm_serving: LLMServingABC, seed: int = 0, lang: str = "en", qa_type: str = "num", num_q: int = 5):
```

#### 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| **llm_serving** | LLMServingABC | 必填 | 大语言模型服务实例。 |
| **seed** | int | 0 | 随机种子。 |
| **lang** | str | "en" | 语言设置，支持 "en" 或 "zh"。 |
| **qa_type** | str | "num" | 问答类型；`"num"` 用于数值型问答对，`"set"` 用于集合型问答对。 |
| **num_q** | int | 5 | 预留参数，用于未来扩展。 |

#### Prompt 模板

Prompt 模板根据 `qa_type` 参数自动选择：

| qa_type | Prompt 类 | 主要用途 |
| :-- | :-- | :-- |
| num | HRKGRelationTripleSubgraphNumericQAPrompt | 生成答案为数字的问答对 |
| set | HRKGRelationTripleSubgraphSetQAPrompt | 生成答案为实体、值、位置等集合的问答对 |

默认 Prompt（qa_type="num"）如下：

```python
def build_system_prompt(self):
    return textwrap.dedent("""\
        You are a hyper-relational knowledge graph QA generation expert.

        === TASK ===
        Given a subgraph composed of hyper-relational tuples, generate
        numeric QA pairs.

        === CORE REQUIREMENTS ===
        1. The answer must be a NUMBER.
        2. Each question must rely on at least two tuples.
        3. You may use explicit relation attributes such as Time,
           Location, Condition, Purpose, Value, Degree, Market, Method,
           Capacity, or Frequency when forming the question.
        4. Use only the given tuples; do not introduce external knowledge.
        5. Do not ignore explicit qualifiers in the tuples.

        === OUTPUT FORMAT ===
        {
          "QA_pairs": [
            {
              "question": "...",
              "answer": "..."
            }
          ]
        }

        Do not explain reasoning or mention tuples explicitly.
    """)

def build_prompt(self, tuples: str):
    return textwrap.dedent(f"""\
        Please generate numeric QA pairs strictly following the rules above.

        Each question must rely on at least two tuples.

        Hyper-relational subgraph tuples:
        {tuples}

        Output QA pairs in JSON format only:
    """)
```

`set` 类型的 Prompt 遵循相同结构，但要求答案为由逗号分隔的实体、值、位置或其他显式结果的集合。

## 💡 `run`函数

`run` 从 `storage` 读取 DataFrame，验证其包含 `input_key` 指定的列且 `output_key` 指定的列尚不存在。然后遍历每一行，调用 `process_batch()` 通过 LLM 为每个子图文本生成问答对，并将结果列表写入 `output_key` 列。如果输入为空或 LLM 响应无法解析，则该行写入空列表。函数返回包含 `output_key` 字符串的列表。

```python
def run(self, storage: DataFlowStorage = None, input_key: str = "subgraph", output_key: str = "QA_pairs"):
```

#### 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| **storage** | DataFlowStorage | None | DataFlow 存储实例，负责数据读写。 |
| **input_key** | str | "subgraph" | 输入列名，对应超关系子图。每行可以是 `List[str]` 或 `str`。 |
| **output_key** | str | "QA_pairs" | 输出列名，对应生成的问答对列表。 |

## 🤖 示例用法

```python
from dataflow.operators.hyper_relation_kg.generate import HRKGRelationTripleSubgraphQAGeneration
from dataflow.utils.storage import FileStorage
from dataflow.utils.llm_serving import APILLMServing_request

storage = FileStorage(first_entry_file_name="hrkg_subgraph_qa.json")

llm_serving = APILLMServing_request(
    api_url="http://<your_llm_api_endpoint>",
    model_name="<your_model_name>",
)

generator = HRKGRelationTripleSubgraphQAGeneration(
    llm_serving=llm_serving,
    qa_type="num",
    lang="en",
)
generator.run(
    storage.step(),
    input_key="subgraph",
    output_key="QA_pairs",
)
```

#### 🧾 默认输出格式（Output Format）

| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| **subgraph** | **List[str] / str** | 输入的超关系子图（保留）。 |
| **QA_pairs** | **List[Dict]** | 生成的问答对；每个元素包含 `question` 和 `answer`。 |

**示例输入：**

```json
{
  "subgraph": [
    "<subj> Elon Musk <obj> Announcement <rel> MadeAt <Time> May 15, 2025 <Location> Tesla Gigafactory, Berlin, Germany",
    "<subj> Tesla Model Y <obj> 4680 Battery <rel> WillAdopt <Time> Third quarter of 2025 <Location> European market",
    "<subj> Tesla Model Y <obj> Cruising Range <rel> IncreasedTo <Value> 600 kilometers",
    "<subj> Tesla Model Y <obj> Price <rel> RemainsUnchanged <Value> 49,990 euros",
    "<subj> 4680 Battery <obj> Tesla Gigafactory, Nevada, United States <rel> ProducedAt <Material> Silicon-carbon anode <EnergyDensity> 15% higher",
    "<subj> Berlin Gigafactory <obj> Production <rel> Started <Time> March 2022 <Capacity> 500,000 vehicles <Market> European Union, United Kingdom, Norway"
  ]
}
```

**示例输出（qa_type="num"）：**

```json
{
  "subgraph": ["..."],
  "QA_pairs": [
    {
      "question": "What is the annual capacity of the Berlin Gigafactory, which started production in March 2022?",
      "answer": "500,000 vehicles"
    },
    {
      "question": "What is the cruising range of Tesla Model Y after adopting the 4680 battery?",
      "answer": "600 kilometers"
    }
  ]
}
```

**示例输出（qa_type="set"）：**

```json
{
  "subgraph": ["..."],
  "QA_pairs": [
    {
      "question": "Which markets does the Berlin Gigafactory mainly supply?",
      "answer": "European Union, United Kingdom, Norway"
    }
  ]
}
```

---

#### 相关链接

- 算子实现：`DataFlow-KG/dataflow/operators/hyper_relation_kg/generate/hrkg_rel_triple_subgraph_qa_generator.py`
- Prompt 模板：`DataFlow-KG/dataflow/prompts/diverse_kg/hrkg.py`
