---
title: TKGTupleSubgraphQAGeneration
createTime: 2026/03/18 00:00:00
permalink: /zh/kg_operators/temporal_kg/generate/tkg_rel_4tuple_subgraph_qa_generator/
---

## 📚 概述

[TKGTupleSubgraphQAGeneration](https://github.com/ZhP-Li197/DataFlow-KG/tree/main/dataflow/operators/temporal_kg/generate/tkg_rel_4tuple_subgraph_qa_generator.py) 是一个基于大语言模型（LLM）从时序知识图谱关系四元组子图生成问答对的算子。它接收由关系四元组组成的子图数据，通过 LLM 生成结构化的时序问答对。该算子支持四种问答生成模式：时间点问答、事件顺序问答、时间先后比较问答和时间区间问答，分别适用于不同的时序推理场景。

## ✒️ `__init__` 函数

```python
def __init__(self, llm_serving: LLMServingABC, seed: int = 0, lang: str = "en", qa_type: str = "time_point", num_q: int = 5):
```

#### 参数

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| **llm_serving** | LLMServingABC | 必需 | 大语言模型服务实例。 |
| **seed** | int | 0 | 随机种子。 |
| **lang** | str | "en" | 语言设置，支持 "en" 或 "zh"。 |
| **qa_type** | str | "time_point" | QA 类型，可选值：`"time_point"`、`"event_order"`、`"time_order"`、`"time_interval"`。 |
| **num_q** | int | 5 | 预期生成的 QA 对数量。 |

#### Prompt 模板说明

根据 `qa_type` 自动选择 prompt 模板：

| qa_type | Prompt 类 | 主要用途 |
| :-- | :-- | :-- |
| time_point | TKGTupleTimePointQAGenerationPrompt | 问具体时间，答案为四元组中的时间值 |
| event_order | TKGTupleEventOrderQAGenerationPrompt | 问事件之后发生了什么，答案为后续事件 |
| time_order | TKGTupleTimeOrderQAGenerationPrompt | 两两事件比较先后，答案为更早的事件 |
| time_interval | TKGTupleTimeIntervalQAGenerationPrompt | 问时间区间内发生了什么，答案为区间内事件 |

默认 prompt（qa_type="time_point"）如下：

```python
def build_system_prompt(self):
    return textwrap.dedent("""\
        You are an expert in generating temporal knowledge graph QA.

        === TASK ===
        Given:
        - ENTITY-RELATION-ENTITY-TIME quadruples

        Generate QA pairs such that:

        === CORE REQUIREMENT ===
        - Each question asks for the **specific time** associated with an entity relation
        - The answer MUST be the time value from the quadruple
        - Do NOT invent times, entities, or relations beyond the given quadruples

        Each QA MUST:
        - Mention the two entities and the relation explicitly in the question
        - Ask something like:
          "When did [Entity1] [Relation] [Entity2]?"

        === OUTPUT FORMAT ===
        {
          "QA_pairs": [
            {
              "question": "...",
              "answer": "TimeValue"
            }
          ]
        }

        Do NOT explain reasoning or mention quadruples explicitly.
    """)

def build_prompt(self, temporal_quadruples: str):
    return textwrap.dedent(f"""\
        Please generate **temporal QA pairs** strictly following the rules above.

        ENTITY-RELATION-ENTITY-TIME quadruples:
        {temporal_quadruples}

        Output QA pairs in JSON format only:
    """)
```

## 💡 `run` 函数

`run` 从 `storage` 中读取 DataFrame，验证其包含 `input_key` 指定的列且 `output_key` 指定的列不存在。随后遍历每一行，调用 `process_batch()` 对每条子图文本通过 LLM 生成问答对，将结果列表写入 `output_key` 列。若 LLM 返回无法解析则该行写入空列表。函数返回包含 `output_key` 字符串的列表。

```python
def run(self, storage: DataFlowStorage = None, input_key: str = "subgraph", output_key: str = "QA_pairs"):
```

#### 参数

| 名称 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| **storage** | DataFlowStorage | None | 数据流存储实例，负责读取与写入数据。 |
| **input_key** | str | "subgraph" | 输入列名，对应关系四元组子图。每行为 `List[str]` 或 `str`。 |
| **output_key** | str | "QA_pairs" | 输出列名，对应生成的 QA 对列表。 |

## 🤖 示例用法

```python
from dataflow.operators.temporal_kg.generate import TKGTupleSubgraphQAGeneration
from dataflow.utils.storage import FileStorage
from dataflow.utils.llm_serving import APILLMServing_request

storage = FileStorage(first_entry_file_name="tkg_rel_subgraph_qa.json")

llm_serving = APILLMServing_request(
    api_url="http://<your_llm_api_endpoint>",
    model_name="<your_model_name>",
)

generator = TKGTupleSubgraphQAGeneration(
    llm_serving=llm_serving,
    qa_type="time_point",
    lang="en",
)
generator.run(
    storage.step(),
    input_key="subgraph",
    output_key="QA_pairs",
)
```

#### 默认输出格式

| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| **subgraph** | List[str] / str | 输入的关系四元组子图（保留）。 |
| **QA_pairs** | List[Dict] | 生成的 QA 对列表，每个元素包含 `question` 和 `answer`。 |

**示例输入：**

```json
{
  "subgraph": [
    "<subj> Elon Musk <obj> Stanford University <rel> graduated from <time> 2004",
    "<subj> Elon Musk <obj> Tesla Motors <rel> took over as CEO <time> 2008",
    "<subj> Elon Musk <obj> SpaceX <rel> founded <time> 2002",
    "<subj> SpaceX <obj> ISS <rel> first commercial spacecraft docking with <time> 2012",
    "<subj> Elon Musk <obj> Neuralink <rel> founded <time> 2016"
  ]
}
```

**示例输出（qa_type="time_point"）：**

```json
{
  "subgraph": ["..."],
  "QA_pairs": [
    {
      "question": "When did Elon Musk graduate from Stanford University?",
      "answer": "2004"
    },
    {
      "question": "When did Elon Musk found SpaceX?",
      "answer": "2002"
    },
    {
      "question": "When did SpaceX first dock a commercial spacecraft with the ISS?",
      "answer": "2012"
    }
  ]
}
```

---

#### 相关链接

- 算子实现：`DataFlow-KG/dataflow/operators/temporal_kg/generate/tkg_rel_4tuple_subgraph_qa_generator.py`
- Prompt 模板：`DataFlow-KG/dataflow/prompts/diverse_kg/tkg.py`
