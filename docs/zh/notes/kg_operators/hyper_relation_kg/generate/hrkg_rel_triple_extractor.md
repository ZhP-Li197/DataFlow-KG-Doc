---
title: HRKGTripleExtraction
createTime: 2026/04/13 00:00:00
permalink: /zh/kg_operators/hyper_relation_kg/generate/hrkg_rel_triple_extractor/
---

## 📚 概述

[HRKGTripleExtraction](https://github.com/ZhP-Li197/DataFlow-KG/tree/main/dataflow/operators/hyper_relation_kg/generate/hrkg_rel_triple_extractor.py) 是一个基于大语言模型（LLM）的超关系知识图谱三元组抽取算子。它从原始文本中抽取结构化的超关系知识，其中每个元组将标准的（实体-关系-实体）三元组扩展为包含关系级属性，如 Time、Location、Condition、Purpose、Manner、Degree 或 Frequency。算子还执行文本质量检查，过滤过短、过长的输入或包含过多特殊字符的输入。

## ✒️ `__init__`函数

```python
def __init__(self, llm_serving: LLMServingABC, seed: int = 0, lang: str = "en", num_q: int = 5):
```

#### 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| **llm_serving** | LLMServingABC | 必填 | 大语言模型服务实例，用于抽取推理。 |
| **seed** | int | 0 | 随机种子。 |
| **lang** | str | "en" | 语言设置，影响 Prompt 模板语言；支持 "en" 或 "zh"。 |
| **num_q** | int | 5 | 预留参数，用于未来扩展。 |

#### Prompt 模板

Prompt 使用 `HRKGHyperRelationExtractorPrompt`：

```python
def build_system_prompt(self):
    return textwrap.dedent("""\
        You are an expert in extracting Hyper-Relation Knowledge Graphs from natural language text.

        A Hyper-Relation KG extends a standard (Entity–Relation–Entity) triple by attaching
        structured attributes to the RELATION, capturing contextual constraints such as
        time, condition, purpose, manner, frequency, reason, or degree.

        === TASK DEFINITION ===
        Extract hyper-relation knowledge in the following form:

        <subj> EntityName
        <obj> EntityName
        <rel> Relation
        <Attribute1> AttributeValue1
        <Attribute2> AttributeValue2
        ...

        === CORE RULES ===
        1. ENTITY:
           - Clear noun or noun phrase (concrete or abstract)
           - NO pronouns (he / she / it / they)
           - Normalized, concise wording

        2. RELATION:
           - A commonsense or semantic relation describing what / why / how
           - Examples: UsedFor, Causes, CapableOf, AtLocation, Helps, Makes, HasProperty

        3. RELATION ATTRIBUTES (CRITICAL):
           - Attributes MODIFY THE RELATION, NOT THE ENTITY
           - Attributes must be explicitly supported by the text
           - Typical attribute types include (but are not limited to):
             · Time (when)
             · Location (where)
             · Condition (under what condition)
             · Purpose / Goal (why)
             · Manner / Method (how)
             · Degree / Intensity
             · Frequency
           - Do NOT invent attributes or values

        4. FACT CONSTRAINT:
           - Each hyper-relation expresses ONE core fact
           - Attributes only add constraints to that fact
           - Avoid mixing multiple relations into one extraction

        === OUTPUT FORMAT ===
        - Output ONLY a JSON object
        - Key: "tuple"
        - Each item is a single string formatted exactly as:

          "<subj> Entity <obj> Entity <rel> Relation <AttributeName1> ValueName1 <AttributeName2> ValueName2"

        - Do NOT add explanations or extra text
    """)

def build_prompt(self, text: str):
    return textwrap.dedent(f"""\
        Extract Hyper-Relation Knowledge Graphs from the following text according to the rules above.

        Text:
        {text}

        Output ONLY JSON:
        {{
          "tuple": [
            "<subj> Entity <obj> Entity <rel> Relation <AttributeName1> ValueName1",
            "<subj> Entity <obj> Entity <rel> Relation <AttributeName1> ValueName1"
          ]
        }}
    """)
```

## 💡 `run`函数

`run` 从 `storage` 读取 DataFrame，验证其包含 `input_key` 指定的列且 `output_key` 指定的列尚不存在。然后遍历每一行，调用 `process_batch()` 通过 LLM 为每个输入文本抽取超关系元组，并将结果列表写入 `output_key` 列。如果输入文本未通过质量检查或 LLM 响应无法解析为有效 JSON，则该行写入空列表。函数返回包含 `output_key` 字符串的列表。

```python
def run(self, storage: DataFlowStorage = None, input_key: str = "raw_chunk", output_key: str = "tuple"):
```

#### 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| **storage** | DataFlowStorage | None | DataFlow 存储实例，负责数据读写。 |
| **input_key** | str | "raw_chunk" | 输入列名，对应原始文本字段。 |
| **output_key** | str | "tuple" | 输出列名，对应抽取的超关系元组列表字段。 |

#### 文本质量检查

算子在抽取前执行以下预处理检查：

| 检查项 | 规则 | 失败处理 |
| :-- | :-- | :-- |
| 长度检查 | 文本必须在 10 到 200,000 个字符之间 | 返回空列表 |
| 标点检查 | 必须包含至少 2 个句号（`.`）或中文句号（`。`） | 返回空列表 |
| 特殊字符比例 | 特殊字符比例必须 ≤ 30% | 返回空列表 |

## 🤖 示例用法

```python
from dataflow.operators.hyper_relation_kg.generate import HRKGTripleExtraction
from dataflow.utils.storage import FileStorage
from dataflow.utils.llm_serving import APILLMServing_request

storage = FileStorage(first_entry_file_name="hrkg_extraction.json")

llm_serving = APILLMServing_request(
    api_url="http://<your_llm_api_endpoint>",
    model_name="<your_model_name>",
)

extractor = HRKGTripleExtraction(
    llm_serving=llm_serving,
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
| :-- | :-- | :-- |
| **raw_chunk** | **str** | 输入的原始文本（保留）。 |
| **tuple** | **List[str]** | 从文本中抽取的超关系元组。 |

**示例输入：**

```json
{
  "raw_chunk": "On May 15, 2025, Elon Musk announced at the Tesla Gigafactory in Berlin, Germany, that the Tesla Model Y would adopt the 4680 battery in the European market starting from the third quarter of 2025. With this upgrade, the cruising range of Model Y will be increased to 600 kilometers, while its price will remain unchanged at 49,990 euros. The 4680 battery is produced at Tesla's Gigafactory in Nevada, United States, using silicon-carbon anode material, and its energy density is 15% higher than that of the previous generation. The Berlin Gigafactory officially started production in March 2022, with a designed annual capacity of 500,000 vehicles, mainly supplying the European Union, the United Kingdom, and Norway."
}
```

**示例输出：**

```json
{
  "raw_chunk": "On May 15, 2025...",
  "tuple": [
    "<subj> Elon Musk <obj> Announcement <rel> MadeAt <Time> May 15, 2025 <Location> Tesla Gigafactory, Berlin, Germany",
    "<subj> Tesla Model Y <obj> 4680 Battery <rel> WillAdopt <Time> Third quarter of 2025 <Location> European market",
    "<subj> Tesla Model Y <obj> Cruising Range <rel> IncreasedTo <Value> 600 kilometers",
    "<subj> Tesla Model Y <obj> Price <rel> RemainsUnchanged <Value> 49,990 euros",
    "<subj> 4680 Battery <obj> Tesla Gigafactory, Nevada, United States <rel> ProducedAt <Material> Silicon-carbon anode <EnergyDensity> 15% higher",
    "<subj> Berlin Gigafactory <obj> Production <rel> Started <Time> March 2022 <Capacity> 500,000 vehicles <Market> European Union, United Kingdom, Norway"
  ]
}
```

---

#### 相关链接

- 算子实现：`DataFlow-KG/dataflow/operators/hyper_relation_kg/generate/hrkg_rel_triple_extractor.py`
- Prompt 模板：`DataFlow-KG/dataflow/prompts/diverse_kg/hrkg.py`
