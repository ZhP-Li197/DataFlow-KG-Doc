---
title: TKGAttributeQAGeneration
createTime: 2026/03/18 00:00:00
permalink: /en/kg_operators/temporal_kg/generate/tkg_attri_4tuple_qa_generator/
---

## 📚 Overview

[TKGAttributeQAGeneration](https://github.com/ZhP-Li197/DataFlow-KG/tree/main/dataflow/operators/temporal_kg/generate/tkg_attri_4tuple_qa_generator.py) is a temporal KG attribute-quadruple QA generation operator based on large language models (LLM). It takes attribute-quadruple subgraphs as input and generates structured temporal QA pairs. The operator supports four QA modes: time-point, event-order, time-order, and time-interval questions, each using dedicated attribute-quadruple prompts for temporal reasoning about entity attribute changes.

## ✒️ `__init__` Function

```python
def __init__(self, llm_serving: LLMServingABC, seed: int = 0, lang: str = "en", qa_type: str = "time_interval", num_q: int = 5):
```

#### Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| **llm_serving** | LLMServingABC | Required | Large language model serving instance. |
| **seed** | int | 0 | Random seed. |
| **lang** | str | "en" | Language setting, supports "en" or "zh". |
| **qa_type** | str | "time_interval" | QA type, options: `"time_point"`, `"event_order"`, `"time_order"`, `"time_interval"`. |
| **num_q** | int | 5 | Expected number of QA pairs to generate. |

#### Prompt Template

The prompt template is automatically selected based on `qa_type`, using attribute-quadruple-specific prompts:

| qa_type | Prompt Class | Primary Use |
| --- | --- | --- |
| time_point | TKGAttributeTimePointQAGenerationPrompt | Ask for the specific time of an entity attribute |
| event_order | TKGAttributeEventOrderQAGenerationPrompt | Ask what happened after an entity's attribute changed |
| time_order | TKGAttributeTimeOrderQAGenerationPrompt | Compare two attribute events chronologically |
| time_interval | TKGAttributeTimeIntervalQAGenerationPrompt | Ask what attribute events occurred within a time interval |

The default prompt (qa_type="time_interval") is as follows:

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

## 💡 `run` Function

`run` reads a DataFrame from `storage`, validates that it contains the column specified by `input_key` and that the column specified by `output_key` does not yet exist. It then iterates over each row, calls `process_batch()` to generate QA pairs via the LLM for every attribute subgraph text, and writes the resulting list into the `output_key` column. If the LLM response cannot be parsed, an empty list is written for that row. The function returns a list containing the `output_key` string.

```python
def run(self, storage: DataFlowStorage = None, input_key: str = "subgraph", output_key: str = "QA_pairs"):
```

#### Parameters

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| **storage** | DataFlowStorage | None | DataFlow storage instance, responsible for reading and writing data. |
| **input_key** | str | "subgraph" | Input column name, corresponding to the attribute-quadruple subgraph. |
| **output_key** | str | "QA_pairs" | Output column name, corresponding to the generated QA pair list. |

## 🤖 Example Usage

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

#### Default Output Format

| Field | Type | Description |
| --- | --- | --- |
| **subgraph** | List[str] | Input attribute-quadruple subgraph (preserved). |
| **QA_pairs** | List[Dict] | Generated QA pairs; each element contains `question` and `answer`. |

**Example Input:**

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

**Example Output (qa_type="time_interval"):**

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

#### Related Links

- Operator implementation: `DataFlow-KG/dataflow/operators/temporal_kg/generate/tkg_attri_4tuple_qa_generator.py`
- Prompt templates: `DataFlow-KG/dataflow/prompts/diverse_kg/tkg.py`