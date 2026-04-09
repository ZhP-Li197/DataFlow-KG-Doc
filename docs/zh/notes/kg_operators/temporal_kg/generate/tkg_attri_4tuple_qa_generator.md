---
title: TKGAttributeQAGeneration
createTime: 2026/03/18 00:00:00
permalink: /zh/kg_operators/temporal_kg/generate/tkg_attri_4tuple_qa_generator/
---

## 📚 概述

[TKGAttributeQAGeneration](https://github.com/ZhP-Li197/DataFlow-KG/tree/main/dataflow/operators/temporal_kg/generate/tkg_attri_4tuple_qa_generator.py) 是一个基于大语言模型（LLM）从时序知识图谱属性四元组子图生成问答对的算子。它接收由属性四元组组成的子图数据，通过 LLM 生成结构化的时序问答对。该算子支持四种问答生成模式：时间点问答、事件顺序问答、时间先后比较问答和时间区间问答，分别使用属性四元组专用的 Prompt 模板，适用于围绕实体属性变化的时序推理场景。

## ✒️ `__init__` 函数

```python
def __init__(self, llm_serving: LLMServingABC, seed: int = 0, lang: str = "en", qa_type: str = "time_interval", num_q: int = 5):
```

#### 参数

| 参数名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| **llm_serving** | LLMServingABC | 必需 | 大语言模型服务实例。 |
| **seed** | int | 0 | 随机种子。 |
| **lang** | str | "en" | 语言设置，支持 "en" 或 "zh"。 |
| **qa_type** | str | "time_interval" | QA 类型，可选值：`"time_point"`、`"event_order"`、`"time_order"`、`"time_interval"`。 |
| **num_q** | int | 5 | 预期生成的 QA 对数量。 |

#### Prompt 模板说明

根据 `qa_type` 自动选择属性四元组专用的 prompt 模板：

| qa_type | Prompt 类 | 主要用途 |
| --- | --- | --- |
| time_point | TKGAttributeTimePointQAGenerationPrompt | 问实体属性对应的具体时间 |
| event_order | TKGAttributeEventOrderQAGenerationPrompt | 问实体某属性变化后发生了什么 |
| time_order | TKGAttributeTimeOrderQAGenerationPrompt | 两两属性事件比较先后 |
| time_interval | TKGAttributeTimeIntervalQAGenerationPrompt | 问时间区间内实体发生了哪些属性事件 |

默认 prompt（qa_type="time_interval"）如下：

```python
def build_system_prompt(self):
    return textwrap.dedent("""\
        You are an expert in generating LARGE-SCALE temporal interval QA.

        === TASK ===
        Given:
        - ENTITY–ATTRIBUTE–VALUE–TIME quadruples

        You MUST:

        1. Group events by entity
        2. Sort events chronologically
        3. Construct ALL valid time intervals using earlier and later events
        4. Generate QA asking what happened BETWEEN two times or two events
        5. Use as many valid interval combinations as possible
        6. For each interval, generate multiple question variations

        === CORE REQUIREMENTS ===
        - Use ALL possible valid time intervals
        - Do NOT generate only a few QA
        - Each question must clearly define a time interval
        - The answer must list the event(s) inside the interval
        - Do NOT invent events or times
        - Questions must not repeat

        === OUTPUT FORMAT ===
        {
          "QA_pairs": [
            {
              "question": "...",
              "answer": "EventDescription or ListOfEvents"
            }
          ]
        }

        Generate as many valid QA pairs as possible.
        Do NOT explain reasoning.
        Do NOT mention quadruples explicitly.
    """)

def build_prompt(self, temporal_quadruples: str):
    return textwrap.dedent(f"""\
        Please generate **temporal QA pairs** strictly following the rules above.

        ENTITY–ATTRIBUTE–VALUE–TIME quadruples:
        {temporal_quadruples}

        Output QA_pairs in JSON format only:
    """)
```

## 💡 `run` 函数

`run` 从 `storage` 中读取 DataFrame，验证其包含 `input_key` 指定的列且 `output_key` 指定的列不存在。随后遍历每一行，调用 `process_batch()` 对每条属性子图文本通过 LLM 生成问答对，将结果列表写入 `output_key` 列。若 LLM 返回无法解析则该行写入空列表。函数返回包含 `output_key` 字符串的列表。

```python
def run(self, storage: DataFlowStorage = None, input_key: str = "subgraph", output_key: str = "QA_pairs"):
```

#### 参数

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| **storage** | DataFlowStorage | None | 数据流存储实例，负责读取与写入数据。 |
| **input_key** | str | "subgraph" | 输入列名，对应属性四元组子图。 |
| **output_key** | str | "QA_pairs" | 输出列名，对应生成的 QA 对列表。 |

## 🤖 示例用法

```python
from dataflow.operators.temporal_kg.generate import TKGAttributeQAGeneration
from dataflow.utils.storage import FileStorage
from dataflow.utils.llm_serving import APILLMServing_request

storage = FileStorage(first_entry_file_name="tkg_attri_qa.json")

llm_serving = APILLMServing_request(
    api_url="http://<your_llm_api_endpoint>",
    model_name="<your_model_name>",
)

generator = TKGAttributeQAGeneration(
    llm_serving=llm_serving,
    qa_type="time_interval",
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
| --- | --- | --- |
| **subgraph** | List[str] | 输入的属性四元组子图（保留）。 |
| **QA_pairs** | List[Dict] | 生成的 QA 对列表，每个元素包含 `question` 和 `answer`。 |

**示例输入：**

```json
{
  "subgraph": [
    "⟨entity⟩ Elon Musk ⟨attribute⟩ university graduation ⟨value⟩ Stanford University ⟨time⟩ 2004",
    "⟨entity⟩ Elon Musk ⟨attribute⟩ CEO position ⟨value⟩ Tesla Motors ⟨time⟩ 2008",
    "⟨entity⟩ Elon Musk ⟨attribute⟩ company founded ⟨value⟩ SpaceX ⟨time⟩ 2002",
    "⟨entity⟩ Elon Musk ⟨attribute⟩ company founded ⟨value⟩ Neuralink ⟨time⟩ 2016"
  ]
}
```

**示例输出（qa_type="time_interval"）：**

```json
{
  "subgraph": ["..."],
  "QA_pairs": [
    {
      "question": "Between 2002 and 2008, what major events involving Elon Musk occurred?",
      "answer": "Elon Musk took over as CEO of Tesla Motors in 2008."
    },
    {
      "question": "What happened between 2002 (SpaceX founded) and 2012 (ISS docking)?",
      "answer": "SpaceX achieved the first commercial spacecraft docking with the ISS in 2012."
    },
    {
      "question": "Between 2002 and 2016, what companies did Elon Musk found?",
      "answer": "SpaceX in 2002 and Neuralink in 2016."
    }
  ]
}
```

---

#### 相关链接

- 算子实现：`DataFlow-KG/dataflow/operators/temporal_kg/generate/tkg_attri_4tuple_qa_generator.py`
- Prompt 模板：`DataFlow-KG/dataflow/prompts/diverse_kg/tkg.py`