---
title: HRKGRelationTriplePathQAGeneration
createTime: 2026/04/13 00:00:00
permalink: /zh/kg_operators/hyper_relation_kg/generate/hrkg_rel_triple_path_qa_generator/
---

## 📚 概述

[HRKGRelationTriplePathQAGeneration](https://github.com/ZhP-Li197/DataFlow-KG/tree/main/dataflow/operators/hyper_relation_kg/generate/hrkg_rel_triple_path_qa_generator.py) 是一个基于大语言模型（LLM）的超关系知识图谱路径问答生成算子。它以超关系元组（单跳）或多元路径（多跳）作为输入，生成结构化的问答对。算子支持 `hop=1` 进行单跳问答生成（每个问题的答案来自单个元组），以及 `hop=2` 进行双跳问答生成（每个问题需要跨两个元组进行推理）。算子强制要求每个输入至少生成 2 个问答对，否则返回空列表。

## ✒️ `__init__`函数

```python
def __init__(self, llm_serving: LLMServingABC, seed: int = 0, lang: str = "en", hop: int = 1):
```

#### 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| **llm_serving** | LLMServingABC | 必填 | 大语言模型服务实例。 |
| **seed** | int | 0 | 随机种子。 |
| **lang** | str | "en" | 语言设置，支持 "en" 或 "zh"。 |
| **hop** | int | 1 | 推理跳数；`1` 表示单跳（单元组）问答，`2` 表示双跳（多元组路径）问答。 |

#### Prompt 模板

Prompt 模板根据 `hop` 参数自动选择：

| hop | Prompt 类 | 主要用途 |
| :-- | :-- | :-- |
| 1 | HRKGOneHopQAPathGenerationPrompt | 生成单跳问答对；每个问题可由恰好一个元组回答 |
| 2 | HRKGTwoHopPathQAGenerationPrompt | 生成双跳问答对；每个问题需要跨两个元组推理 |

默认 Prompt（hop=1）如下：

```python
def build_system_prompt(self):
    return textwrap.dedent("""\
        You are a hyper-relational knowledge graph question-answer generation expert.

        Your task:
        Generate ONE-HOP question-answer pairs strictly based on the given
        hyper-relational tuples.

        Definition of ONE-HOP QA:
        - Each question must be answerable using exactly ONE tuple
        - The answer must come directly from that tuple
        - The question may ask about the subject, object, or explicit
          relation attributes in the tuple
        - Do not combine information from multiple tuples
        - Do not introduce external or implicit knowledge

        Rules:
        - Preserve the tuple meaning and explicit qualifiers
        - Do not ignore relation attributes such as Time, Location,
          Condition, Purpose, Value, Degree, Market, or Method
        - Do not invent missing attributes or values
        - Do not explain reasoning
        - Each tuple may generate one or more QA pairs
        - Questions should be natural and fluent

        Output format (STRICT JSON):
        {
          "QA_pairs": [
            "Question: ... Answer: ...",
            "Question: ... Answer: ..."
          ]
        }
    """)

def build_prompt(self, tuples: str):
    return textwrap.dedent(f"""\
        Please generate one-hop QA pairs strictly following the rules above.

        Hyper-relational tuples:
        {tuples}

        Output QA_pairs in JSON format only:
    """)
```

`hop=2` 的 Prompt 遵循相同模式，但要求双跳推理：

```python
def build_system_prompt(self):
    return textwrap.dedent("""\
        You are a hyper-relational multi-hop question-answer generation expert.

        Your task:
        Generate QUESTION-ANSWER pairs that require EXACTLY TWO HOPS of reasoning,
        strictly based on the given two-hop hyper-relational paths.

        Critical requirements:
        1. Each QA must require both tuples in the path to answer.
        2. Do not generate one-hop questions.
        3. Relation attributes may be used as qualifiers in the question
           or answer, but the QA must still depend on both hops.
        4. Do not introduce external knowledge or assumptions.
        5. Do not modify entity names, relation meaning, or attribute values.

        Output format (STRICT JSON):
        {
          "QA_pairs": [
            "Question: ... Answer: ...",
            "Question: ... Answer: ..."
          ]
        }
    """)
```

## 💡 `run`函数

`run` 从 `storage` 读取 DataFrame，验证其包含必需的输入列。当 `hop=1` 时，输入列默认为 `"tuple"`；当 `hop>1` 时，输入列名为 `f"{hop}_{input_key_meta}"`（例如 `"2_hop_paths"`）。然后遍历每一行，调用 `process_batch()` 通过 LLM 生成问答对，并将结果列表写入 `output_key` 列。如果输入为空、解析失败或生成的问答对少于 2 个，则该行写入空列表。函数返回包含 `output_key` 字符串的列表。

```python
def run(self, storage: DataFlowStorage = None, input_key_meta: str = "hop_paths", output_key: str = "QA_pairs"):
```

#### 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| **storage** | DataFlowStorage | None | DataFlow 存储实例，负责数据读写。 |
| **input_key_meta** | str | "hop_paths" | 当 hop > 1 时输入列名的后缀。完整输入列名为 `f"{hop}_{input_key_meta}"`；当 hop=1 时默认为 `"tuple"`。 |
| **output_key** | str | "QA_pairs" | 输出列名，对应生成的问答对列表。 |

## 🤖 示例用法

```python
from dataflow.operators.hyper_relation_kg.generate import HRKGRelationTriplePathQAGeneration
from dataflow.utils.storage import FileStorage
from dataflow.utils.llm_serving import APILLMServing_request

storage = FileStorage(first_entry_file_name="hrkg_path_qa.json")

llm_serving = APILLMServing_request(
    api_url="http://<your_llm_api_endpoint>",
    model_name="<your_model_name>",
)

# 单跳问答生成
generator = HRKGRelationTriplePathQAGeneration(
    llm_serving=llm_serving,
    hop=1,
    lang="en",
)
generator.run(
    storage.step(),
    input_key_meta="hop_paths",
    output_key="QA_pairs",
)
```

```python
# 双跳问答生成
generator = HRKGRelationTriplePathQAGeneration(
    llm_serving=llm_serving,
    hop=2,
    lang="en",
)
generator.run(
    storage.step(),
    input_key_meta="hop_paths",
    output_key="QA_pairs",
)
```

#### 🧾 默认输出格式（Output Format）

| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| **tuple**（hop=1） | **List[str]** | 输入的超关系元组（保留）。 |
| **2_hop_paths**（hop=2） | **List[str]** | 输入的双跳超关系路径（保留）。 |
| **QA_pairs** | **List[str]** | 生成的问答对，格式为 `"Question: ... Answer: ..."`；如果生成少于 2 个问答对则为空。 |

**示例输入（hop=1）：**

```json
{
  "tuple": [
    "<subj> Tesla Model Y <obj> 4680 Battery <rel> WillAdopt <Time> Third quarter of 2025 <Location> European market",
    "<subj> Tesla Model Y <obj> Cruising Range <rel> IncreasedTo <Value> 600 kilometers",
    "<subj> Tesla Model Y <obj> Price <rel> RemainsUnchanged <Value> 49,990 euros"
  ]
}
```

**示例输出（hop=1）：**

```json
{
  "tuple": ["..."],
  "QA_pairs": [
    "Question: When will Tesla Model Y adopt the 4680 battery in the European market? Answer: Third quarter of 2025",
    "Question: What is the cruising range of Tesla Model Y after adopting the 4680 battery? Answer: 600 kilometers",
    "Question: What is the price of Tesla Model Y? Answer: 49,990 euros"
  ]
}
```

**示例输入（hop=2）：**

```json
{
  "2_hop_paths": [
    "<subj> Elon Musk <obj> Announcement <rel> MadeAt <Time> May 15, 2025 <Location> Tesla Gigafactory, Berlin, Germany",
    "<subj> Tesla Gigafactory, Berlin, Germany <obj> Tesla Model Y <rel> ProducedAt <Time> Third quarter of 2025"
  ]
}
```

**示例输出（hop=2）：**

```json
{
  "2_hop_paths": ["..."],
  "QA_pairs": [
    "Question: Where did Elon Musk announce the Tesla Model Y that will be produced in the third quarter of 2025? Answer: Tesla Gigafactory, Berlin, Germany",
    "Question: When will the Tesla Model Y, whose announcement was made at the Tesla Gigafactory in Berlin, be produced? Answer: Third quarter of 2025"
  ]
}
```

---

#### 相关链接

- 算子实现：`DataFlow-KG/dataflow/operators/hyper_relation_kg/generate/hrkg_rel_triple_path_qa_generator.py`
- Prompt 模板：`DataFlow-KG/dataflow/prompts/diverse_kg/hrkg.py`
