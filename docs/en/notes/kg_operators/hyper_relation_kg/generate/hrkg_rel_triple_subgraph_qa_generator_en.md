---
title: HRKGRelationTripleSubgraphQAGeneration
createTime: 2026/03/18 00:00:00
permalink: /en/kg_operators/hyper_relation_kg/generate/hrkg_rel_triple_subgraph_qa_generator/
---

## 📚 Overview

[HRKGRelationTripleSubgraphQAGeneration](https://github.com/ZhP-Li197/DataFlow-KG/tree/main/dataflow/operators/hyper_relation_kg/generate/hrkg_rel_triple_subgraph_qa_generator.py) is a hyper-relational KG subgraph QA generation operator based on large language models (LLM). It takes hyper-relational KG subgraphs as input and generates structured QA pairs. The operator supports two QA types: `num` (numeric QA pairs) and `set` (set-based QA pairs). Each question must rely on at least two tuples from the subgraph, and the answer is derived from explicit relation attributes in the tuples.

## ✒️ `__init__` Function

```python
def __init__(self, llm_serving: LLMServingABC, seed: int = 0, lang: str = "en", qa_type: str = "num", num_q: int = 5):
```

#### Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| **llm_serving** | LLMServingABC | Required | Large language model serving instance. |
| **seed** | int | 0 | Random seed. |
| **lang** | str | "en" | Language setting, supports "en" or "zh". |
| **qa_type** | str | "num" | QA type; `"num"` for numeric QA pairs, `"set"` for set-based QA pairs. |
| **num_q** | int | 5 | Reserved parameter for future extension. |

#### Prompt Template

The prompt template is automatically selected based on `qa_type`:

| qa_type | Prompt Class | Primary Use |
| --- | --- | --- |
| num | HRKGRelationTripleSubgraphNumericQAPrompt | Generate QA pairs where the answer is a number |
| set | HRKGRelationTripleSubgraphSetQAPrompt | Generate QA pairs where the answer is a set of entities, values, or locations |

The default prompt (qa_type="num") is as follows:

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

The `set` prompt follows the same structure but requires the answer to be a comma-separated set of entities, values, locations, or other explicit results.

## 💡 `run` Function

`run` reads a DataFrame from `storage`, validates that it contains the column specified by `input_key` and that the column specified by `output_key` does not yet exist. It then iterates over each row, calls `process_batch()` to generate QA pairs via the LLM for every subgraph text, and writes the resulting list into the `output_key` column. If the input is empty or the LLM response cannot be parsed, an empty list is written for that row. The function returns a list containing the `output_key` string.

```python
def run(self, storage: DataFlowStorage = None, input_key: str = "subgraph", output_key: str = "QA_pairs"):
```

#### Parameters

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| **storage** | DataFlowStorage | None | DataFlow storage instance, responsible for reading and writing data. |
| **input_key** | str | "subgraph" | Input column name, corresponding to the hyper-relational subgraph. Each row is `List[str]` or `str`. |
| **output_key** | str | "QA_pairs" | Output column name, corresponding to the generated QA pair list. |

## 🤖 Example Usage

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

#### Default Output Format

| Field | Type | Description |
| --- | --- | --- |
| **subgraph** | List[str] / str | Input hyper-relational subgraph (preserved). |
| **QA_pairs** | List[Dict] | Generated QA pairs; each element contains `question` and `answer`. |

**Example Input:**

```json
{
  "subgraph": [
    "<subj> Elon Musk <obj> Announcement <rel> MadeAt <time> May 15, 2025 <location> Tesla Gigafactory, Berlin, Germany",
    "<subj> Tesla Model Y <obj> 4680 Battery <rel> WillAdopt <time> Third quarter of 2025 <location> European market",
    "<subj> Tesla Model Y <obj> Cruising Range <rel> IncreasedTo <value> 600 kilometers",
    "<subj> Tesla Model Y <obj> Price <rel> RemainsUnchanged <value> 49,990 euros",
    "<subj> 4680 Battery <obj> Tesla Gigafactory, Nevada, United States <rel> ProducedAt <material> Silicon-carbon anode <energydensity> 15% higher",
    "<subj> Berlin Gigafactory <obj> Production <rel> Started <time> March 2022 <capacity> 500,000 vehicles <market> European Union, United Kingdom, Norway"
  ]
}
```

**Example Output (qa_type="num"):**

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

**Example Output (qa_type="set"):**

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

#### Related Links

- Operator implementation: `DataFlow-KG/dataflow/operators/hyper_relation_kg/generate/hrkg_rel_triple_subgraph_qa_generator.py`
- Prompt templates: `DataFlow-KG/dataflow/prompts/diverse_kg/hrkg.py`
