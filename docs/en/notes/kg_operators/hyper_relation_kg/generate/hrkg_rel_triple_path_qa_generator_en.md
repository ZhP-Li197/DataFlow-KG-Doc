---
title: HRKGRelationTriplePathQAGeneration
createTime: 2026/03/18 00:00:00
permalink: /en/kg_operators/hyper_relation_kg/generate/hrkg_rel_triple_path_qa_generator/
---

## 📚 Overview

[HRKGRelationTriplePathQAGeneration](https://github.com/ZhP-Li197/DataFlow-KG/tree/main/dataflow/operators/hyper_relation_kg/generate/hrkg_rel_triple_path_qa_generator.py) is a hyper-relational KG path QA generation operator based on large language models (LLM). It takes hyper-relational tuples (for one-hop) or multi-hop paths (for two-hop) as input and generates structured question-answer pairs. The operator supports `hop=1` for one-hop QA generation (each question is answerable from a single tuple) and `hop=2` for two-hop QA generation (each question requires reasoning across two tuples in a path). The operator enforces that at least two QA pairs must be generated per input; otherwise an empty list is returned.

## ✒️ `__init__` Function

```python
def __init__(self, llm_serving: LLMServingABC, seed: int = 0, lang: str = "en", hop: int = 1):
```

#### Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| **llm_serving** | LLMServingABC | Required | Large language model serving instance. |
| **seed** | int | 0 | Random seed. |
| **lang** | str | "en" | Language setting, supports "en" or "zh". |
| **hop** | int | 1 | Reasoning hops; `1` for one-hop (single-tuple) QA, `2` for two-hop (multi-tuple path) QA. |

#### Prompt Template

The prompt template is automatically selected based on `hop`:

| hop | Prompt Class | Primary Use |
| --- | --- | --- |
| 1 | HRKGOneHopQAPathGenerationPrompt | Generate one-hop QA pairs; each question is answerable from exactly one tuple |
| 2 | HRKGTwoHopPathQAGenerationPrompt | Generate two-hop QA pairs; each question requires reasoning across two tuples |

The default prompt (hop=1) is as follows:

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

The `hop=2` prompt follows the same pattern but requires two-hop reasoning:

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

## 💡 `run` Function

`run` reads a DataFrame from `storage`, validates that it contains the required input column. When `hop=1`, the input column defaults to `"tuple"`; when `hop>1`, the input column is named `f"{hop}_{input_key_meta}"` (e.g., `"2_hop_paths"`). It then iterates over each row, calls `process_batch()` to generate QA pairs via the LLM, and writes the resulting list into the `output_key` column. If the input is empty, parsing fails, or fewer than 2 QA pairs are generated, an empty list is written for that row. The function returns a list containing the `output_key` string.

```python
def run(self, storage: DataFlowStorage = None, input_key_meta: str = "hop_paths", output_key: str = "QA_pairs"):
```

#### Parameters

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| **storage** | DataFlowStorage | None | DataFlow storage instance, responsible for reading and writing data. |
| **input_key_meta** | str | "hop_paths" | Suffix for the input column name when hop > 1. The full input column name is `f"{hop}_{input_key_meta}"`; when hop=1, defaults to `"tuple"`. |
| **output_key** | str | "QA_pairs" | Output column name, corresponding to the generated QA pair list. |

## 🤖 Example Usage

```python
from dataflow.operators.hyper_relation_kg.generate import HRKGRelationTriplePathQAGeneration
from dataflow.utils.storage import FileStorage
from dataflow.utils.llm_serving import APILLMServing_request

storage = FileStorage(first_entry_file_name="hrkg_path_qa.json")

llm_serving = APILLMServing_request(
    api_url="http://<your_llm_api_endpoint>",
    model_name="<your_model_name>",
)

# One-hop QA generation
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
# Two-hop QA generation
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

#### Default Output Format

| Field | Type | Description |
| --- | --- | --- |
| **tuple** (hop=1) | List[str] | Input hyper-relational tuples (preserved). |
| **2_hop_paths** (hop=2) | List[str] | Input two-hop hyper-relational paths (preserved). |
| **QA_pairs** | List[str] | Generated QA pairs in `"Question: ... Answer: ..."` format; empty if fewer than 2 pairs generated. |

**Example Input (hop=1):**

```json
{
  "tuple": [
    "<subj> Tesla Model Y <obj> 4680 Battery <rel> WillAdopt <Time> Third quarter of 2025 <Location> European market",
    "<subj> Tesla Model Y <obj> Cruising Range <rel> IncreasedTo <Value> 600 kilometers",
    "<subj> Tesla Model Y <obj> Price <rel> RemainsUnchanged <Value> 49,990 euros"
  ]
}
```

**Example Output (hop=1):**

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

**Example Input (hop=2):**

```json
{
  "2_hop_paths": [
    "<subj> Elon Musk <obj> Announcement <rel> MadeAt <Time> May 15, 2025 <Location> Tesla Gigafactory, Berlin, Germany",
    "<subj> Tesla Gigafactory, Berlin, Germany <obj> Tesla Model Y <rel> ProducedAt <Time> Third quarter of 2025"
  ]
}
```

**Example Output (hop=2):**

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

#### Related Links

- Operator implementation: `DataFlow-KG/dataflow/operators/hyper_relation_kg/generate/hrkg_rel_triple_path_qa_generator.py`
- Prompt templates: `DataFlow-KG/dataflow/prompts/diverse_kg/hrkg.py`
