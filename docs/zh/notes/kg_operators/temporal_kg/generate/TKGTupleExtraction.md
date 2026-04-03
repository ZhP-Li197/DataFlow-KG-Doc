---
title: TKGTupleExtraction
createTime: 2026/03/18 00:00:00
icon: material-symbols-light:bolt
permalink: /zh/api/operators/temporal_kg/generate/tkgtupleextraction/
---

## 📚 概述

[TKGTupleExtraction](https://github.com/ZhP-Li197/DataFlow-KG/tree/main/dataflow/operators/temporal_kg/generate/tkg_4tuple_extractor.py) 是一个基于大语言模型（LLM）的时序知识图谱四元组抽取算子。它从原始文本中抽取结构化的时序四元组，支持关系四元组和属性四元组两种类型，通过参数控制抽取模式。该算子对时间值进行标准化处理，支持精确日期、月份、年份、季度和时间区间等格式，若文本中无明确时间则自动填入 NA。算子还内置了文本质量检查机制，会过滤过短、过长或特殊字符过多的文本。

## ✒️ `__init__`函数

```python
def __init__(self, llm_serving: LLMServingABC, triple_type: str = "attribute", seed: int = 0, lang: str = "en", num_q: int = 5):
```

### `init`参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| **llm_serving** | LLMServingABC | 必需 | 大语言模型服务实例，用于执行抽取推理。 |
| **triple_type** | str | "attribute" | 抽取类型，`"attribute"` 为属性四元组，`"relation"` 为关系四元组。 |
| **seed** | int | 0 | 随机种子。 |
| **lang** | str | "en" | 语言设置，影响 prompt 模板语言，支持 "en" 或 "zh"。 |
| **num_q** | int | 5 | 保留参数，用于未来扩展。 |

### Prompt模板说明

根据 `triple_type` 自动选择 prompt 模板：

| triple_type | Prompt 类 | 主要用途 |
| --- | --- | --- |
| relation | TKGRelationQuadrupleExtractorPrompt | 抽取实体-关系-实体-时间四元组 |
| attribute | TKGAttributeQuadrupleExtractorPrompt | 抽取实体-属性-属性值-时间四元组 |

默认 prompt（triple_type="attribute"）如下：

```python
def build_system_prompt(self):
    return textwrap.dedent("""\
        You are an expert in extracting temporal entity-attribute quadruples from natural language text.

        Each quadruple MUST follow this exact format:
        &lt;entity&gt; Entity &lt;attribute&gt; AttributeName &lt;value&gt; AttributeValue &lt;time&gt; TimeValue

        === TIME STANDARDIZATION ===
        1. Specific date: YYYY-MM-DD, e.g., 2025-03-03
        2. Month: Full month name + year, e.g., March 2025
        3. Year: YYYY, e.g., 2025
        4. Quarter: QX YYYY, e.g., Q1 2025
        5. Time span / interval: start_date|end_date, e.g., 2025-01-01|2025-01-03
        6. If no time is explicitly mentioned in the text, set &lt;time&gt; to 'NA'.

        === CORE RULES ===
        - ENTITY: clear noun/noun phrase, no pronouns
        - ATTRIBUTE: the property of the entity explicitly stated in the text
        - VALUE: the value corresponding to the attribute
        - TIME: optional; fill with standardized value if present, otherwise 'NA'
        - Each quadruple expresses ONE fact
        - Do NOT invent entities, attributes, values, or times beyond the text

        === OUTPUT FORMAT ===
        - JSON object only
        - Key: "tuple"
        - Do NOT add explanations or extra text
    """)

def build_prompt(self, text: str):
    return textwrap.dedent(f"""\
        Extract temporal entity-attribute quadruples from the following text according to the rules above.

        Text:
        {text}

        Output ONLY JSON:
        {{
          "tuple": [
            "&lt;entity&gt; Entity &lt;attribute&gt; AttributeName &lt;value&gt; AttributeValue &lt;time&gt; TimeValue"
          ]
        }}
    """)
```

## 💡 `run`函数

```python
def run(self, storage: DataFlowStorage = None, input_key: str = "raw_chunk", output_key: str = "tuple"):
```

#### `参数`

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| **storage** | DataFlowStorage | None | 数据流存储实例，负责读取与写入数据。 |
| **input_key** | str | "raw_chunk" | 输入列名，对应原始文本字段。 |
| **output_key** | str | "tuple" | 输出列名，对应抽取出的四元组列表字段。 |

## 🤖 示例用法

```python
from dataflow.operators.temporal_kg.generate import TKGTupleExtraction
from dataflow.utils.storage import FileStorage
from dataflow.utils.llm_serving import APILLMServing_request

storage = FileStorage(first_entry_file_name="knowledge_extraction.json")

llm_serving = APILLMServing_request(
    api_url="http://<your_llm_api_endpoint>",
    model_name="<your_model_name>",
)

extractor = TKGTupleExtraction(
    llm_serving=llm_serving,
    triple_type="relation",
    lang="en",
)
extractor.run(
    storage.step(),
    input_key="raw_chunk",
    output_key="tuple",
)
```

#### 🧾 默认输出格式（Output Format）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| raw_chunk | str | 输入的原始文本（保留）。 |
| tuple | List[str] | 从文本中抽取的四元组列表。 |

**示例输入：**

```json
{
  "raw_chunk": "After graduating from Stanford University in 2004, Elon Musk co-founded multiple technology companies..."
}
```

**示例输出（triple_type="relation"）：**

```json
{
  "raw_chunk": "After graduating from Stanford University in 2004...",
  "tuple": [
    "<subj> Elon Musk <obj> Stanford University <rel> graduated from &lt;time&gt; 2004",
    "<subj> Elon Musk <obj> multiple technology companies <rel> co-founded &lt;time&gt; NA",
    "<subj> Elon Musk <obj> Tesla Motors <rel> took over as CEO &lt;time&gt; 2008"
  ]
}
```