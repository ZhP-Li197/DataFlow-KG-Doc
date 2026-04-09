---
title: TKGTupleSubgraphQAGeneration
createTime: 2026/03/18 00:00:00
permalink: /en/kg_operators/temporal_kg/generate/tkg_rel_4tuple_subgraph_qa_generator_en/
---

## 📚 Overview

[TKGTupleSubgraphQAGeneration](https://github.com/ZhP-Li197/DataFlow-KG/tree/main/dataflow/operators/temporal_kg/generate/tkg_rel_4tuple_subgraph_qa_generator.py) is a temporal KG relation-quadruple subgraph QA generation operator based on large language models (LLM). It takes relation-quadruple subgraphs as input and generates structured temporal QA pairs. The operator supports four QA modes: time-point, event-order, time-order, and time-interval questions, each suited to different temporal reasoning scenarios.

## ✒️ `__init__` Function

```python
def __init__(self, llm_serving: LLMServingABC, seed: int = 0, lang: str = "en", qa_type: str = "time_point", num_q: int = 5):
```

#### Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| **llm_serving** | LLMServingABC | Required | Large language model serving instance. |
| **seed** | int | 0 | Random seed. |
| **lang** | str | "en" | Language setting, supports "en" or "zh". |
| **qa_type** | str | "time_point" | QA type, options: `"time_point"`, `"event_order"`, `"time_order"`, `"time_interval"`. |
| **num_q** | int | 5 | Expected number of QA pairs to generate. |

#### Prompt Template

The prompt template is automatically selected based on `qa_type`:

| qa_type | Prompt Class | Primary Use |
| --- | --- | --- |
| time_point | TKGTupleTimePointQAGenerationPrompt | Ask for specific time; answer is the time value from the quadruple |
| event_order | TKGTupleEventOrderQAGenerationPrompt | Ask what happened after an event; answer is the subsequent event |
| time_order | TKGTupleTimeOrderQAGenerationPrompt | Compare two events chronologically; answer is the earlier event |
| time_interval | TKGTupleTimeIntervalQAGenerationPrompt | Ask what happened within a time interval; answer is the events within the interval |

The default prompt (qa_type="time_point") is as follows:

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

## 💡 `run` Function

`run` reads a DataFrame from `storage`, validates that it contains the column specified by `input_key` and that the column specified by `output_key` does not yet exist. It then iterates over each row, calls `process_batch()` to generate QA pairs via the LLM for every subgraph text, and writes the resulting list into the `output_key` column. If the LLM response cannot be parsed, an empty list is written for that row. The function returns a list containing the `output_key` string.

```python
def run(self, storage: DataFlowStorage = None, input_key: str = "subgraph", output_key: str = "QA_pairs"):
```

#### Parameters

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| **storage** | DataFlowStorage | None | DataFlow storage instance, responsible for reading and writing data. |
| **input_key** | str | "subgraph" | Input column name, corresponding to the relation-quadruple subgraph. Each row is `List[str]` or `str`. |
| **output_key** | str | "QA_pairs" | Output column name, corresponding to the generated QA pair list. |

## 🤖 Example Usage

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

#### Default Output Format

| Field | Type | Description |
| --- | --- | --- |
| subgraph | List[str] / str | Input relation-quadruple subgraph (preserved). |
| QA_pairs | List[Dict] | Generated QA pairs; each element contains `question` and `answer`. |

**Example Input:**

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

**Example Output (qa_type="time_point"):**

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

#### Related Links

- Operator implementation: `DataFlow-KG/dataflow/operators/temporal_kg/generate/tkg_rel_4tuple_subgraph_qa_generator.py`
- Prompt templates: `DataFlow-KG/dataflow/prompts/diverse_kg/tkg.py`
