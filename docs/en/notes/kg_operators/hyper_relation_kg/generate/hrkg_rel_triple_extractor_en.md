---
title: HRKGTripleExtraction
createTime: 2026/03/18 00:00:00
permalink: /en/kg_operators/hyper_relation_kg/generate/hrkg_rel_triple_extractor/
---

## 📚 Overview

[HRKGTripleExtraction](https://github.com/ZhP-Li197/DataFlow-KG/tree/main/dataflow/operators/hyper_relation_kg/generate/hrkg_rel_triple_extractor.py) is a hyper-relational KG triple extraction operator based on large language models (LLM). It extracts structured hyper-relational knowledge from raw text, where each tuple extends a standard (Entity–Relation–Entity) triple with relation-level attributes such as Time, Location, Condition, Purpose, Manner, Degree, or Frequency. The operator also performs text quality checks to filter out inputs that are too short, too long, or contain excessive special characters.

## ✒️ `__init__` Function

```python
def __init__(self, llm_serving: LLMServingABC, seed: int = 0, lang: str = "en", num_q: int = 5):
```

#### Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| **llm_serving** | LLMServingABC | Required | Large language model serving instance, used for extraction reasoning. |
| **seed** | int | 0 | Random seed. |
| **lang** | str | "en" | Language setting, affects prompt template language; supports "en" or "zh". |
| **num_q** | int | 5 | Reserved parameter for future extension. |

#### Prompt Template

The prompt uses `HRKGHyperRelationExtractorPrompt`:

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

## 💡 `run` Function

`run` reads a DataFrame from `storage`, validates that it contains the column specified by `input_key` and that the column specified by `output_key` does not yet exist. It then iterates over each row, calls `process_batch()` to extract hyper-relational tuples via the LLM for every input text, and writes the resulting list into the `output_key` column. If the input text fails quality checks or the LLM response cannot be parsed as valid JSON, an empty list is written for that row. The function returns a list containing the `output_key` string.

```python
def run(self, storage: DataFlowStorage = None, input_key: str = "raw_chunk", output_key: str = "tuple"):
```

#### Parameters

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| **storage** | DataFlowStorage | None | DataFlow storage instance, responsible for reading and writing data. |
| **input_key** | str | "raw_chunk" | Input column name, corresponding to the raw text field. |
| **output_key** | str | "tuple" | Output column name, corresponding to the extracted hyper-relational tuple list field. |

#### Text Quality Checks

The operator performs the following preprocessing checks before extraction:

| Check | Rule | Behavior on Failure |
| --- | --- | --- |
| Length check | Text must be between 10 and 200,000 characters | Return empty list |
| Punctuation check | Must contain at least 2 full stops (`.`) or Chinese full stops (`。`) | Return empty list |
| Special character ratio | Special character ratio must be ≤ 30% | Return empty list |

## 🤖 Example Usage

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

#### Default Output Format

| Field | Type | Description |
| --- | --- | --- |
| **raw_chunk** | str | Input raw text (preserved). |
| **tuple** | List[str] | Extracted hyper-relational tuples from the text. |

**Example Input:**

```json
{
  "raw_chunk": "On May 15, 2025, Elon Musk announced at the Tesla Gigafactory in Berlin, Germany, that the Tesla Model Y would adopt the 4680 battery in the European market starting from the third quarter of 2025. With this upgrade, the cruising range of Model Y will be increased to 600 kilometers, while its price will remain unchanged at 49,990 euros. The 4680 battery is produced at Tesla's Gigafactory in Nevada, United States, using silicon-carbon anode material, and its energy density is 15% higher than that of the previous generation. The Berlin Gigafactory officially started production in March 2022, with a designed annual capacity of 500,000 vehicles, mainly supplying the European Union, the United Kingdom, and Norway."
}
```

**Example Output:**

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

#### Related Links

- Operator implementation: `DataFlow-KG/dataflow/operators/hyper_relation_kg/generate/hrkg_rel_triple_extractor.py`
- Prompt templates: `DataFlow-KG/dataflow/prompts/diverse_kg/hrkg.py`
