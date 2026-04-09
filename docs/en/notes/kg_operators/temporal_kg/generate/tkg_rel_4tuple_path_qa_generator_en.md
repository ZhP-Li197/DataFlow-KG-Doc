---
title: TKGTuplePathQAGeneration
createTime: 2026/03/18 00:00:00
permalink: /en/kg_operators/temporal_kg/generate/tkg_rel_4tuple_path_qa_generator_en/
---

## 📚 Overview

[TKGTuplePathQAGeneration](https://github.com/ZhP-Li197/DataFlow-KG/tree/main/dataflow/operators/temporal_kg/generate/tkg_rel_4tuple_path_qa_generator.py) is a temporal KG multi-hop path QA generation operator based on large language models (LLM). It takes multi-hop path data as input and generates structured temporal QA pairs. The operator supports four QA modes: time-point, event-order, time-order, and time-interval questions. Unlike subgraph QA generation, the input and output column names are dynamically generated based on the hop parameter, making it suitable for temporal QA scenarios based on path reasoning.

## ✒️ `__init__` Function

```python
def __init__(self, llm_serving: LLMServingABC, seed: int = 0, lang: str = "en", hop: int = 2, qa_type: str = "time_point", num_q: int = 5):
```

#### Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| **llm_serving** | LLMServingABC | Required | Large language model serving instance. |
| **seed** | int | 0 | Random seed. |
| **lang** | str | "en" | Language setting, supports "en" or "zh". |
| **hop** | int | 2 | Hop count. Affects input/output column names: when hop > 1 the input column is `{hop}_{input_key_meta}`, when hop == 1 the input column is `"tuple"`. The output column is always `{hop}_{output_key_meta}`. |
| **qa_type** | str | "time_point" | QA type, options: `"time_point"`, `"event_order"`, `"time_order"`, `"time_interval"`. |
| **num_q** | int | 5 | Expected number of QA pairs to generate. |

#### Prompt Template

The prompt template is automatically selected based on `qa_type` (shared with TKGTupleSubgraphQAGeneration for relation quadruple prompts):

| qa_type | Prompt Class | Primary Use |
| --- | --- | --- |
| time_point | TKGTupleTimePointQAGenerationPrompt | Ask for specific time; answer is the time value from the quadruple |
| event_order | TKGTupleEventOrderQAGenerationPrompt | Ask what happened after an event; answer is the subsequent event |
| time_order | TKGTupleTimeOrderQAGenerationPrompt | Compare two events chronologically; answer is the earlier event |
| time_interval | TKGTupleTimeIntervalQAGenerationPrompt | Ask what happened within a time interval; answer is the events within the interval |

The default prompt (qa_type="time_point") is the same as TKGTupleSubgraphQAGeneration; see that operator's documentation.

## 💡 `run` Function

`run` reads a DataFrame from `storage`. Before processing, it constructs the actual input and output column names based on `hop`: when `hop > 1`, the input column is `{hop}_{input_key_meta}` (e.g., `2_hop_paths`), and when `hop == 1`, the input column is `"tuple"`. The output column is always `{hop}_{output_key_meta}` (e.g., `2_QA_pairs`). It then validates the DataFrame, iterates over each row calling `process_batch()` to generate QA pairs via the LLM, and writes the resulting list into the output column. If the LLM response cannot be parsed, an empty list is written for that row. The function returns a list containing the `output_key` string.

```python
def run(self, storage: DataFlowStorage = None, input_key_meta: str = "hop_paths", output_key_meta: str = "QA_pairs"):
```

The actual input column name: when `hop > 1` it is `{hop}_{input_key_meta}` (e.g., `2_hop_paths`), when `hop == 1` it is `"tuple"`. The output column name is always `{hop}_{output_key_meta}` (e.g., `2_QA_pairs`).

#### Parameters

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| **storage** | DataFlowStorage | None | DataFlow storage instance, responsible for reading and writing data. |
| **input_key_meta** | str | "hop_paths" | Input column name meta information. |
| **output_key_meta** | str | "QA_pairs" | Output column name meta information. |

## 🤖 Example Usage

```python
from dataflow.operators.temporal_kg.generate import TKGTuplePathQAGeneration
from dataflow.utils.storage import FileStorage
from dataflow.utils.llm_serving import APILLMServing_request

storage = FileStorage(first_entry_file_name="tkg_rel_qa.json")

llm_serving = APILLMServing_request(
    api_url="http://<your_llm_api_endpoint>",
    model_name="<your_model_name>",
)

generator = TKGTuplePathQAGeneration(
    llm_serving=llm_serving,
    hop=2,
    qa_type="time_point",
    lang="en",
)
generator.run(
    storage.step(),
    input_key_meta="hop_paths",
    output_key_meta="QA_pairs",
)
```

#### Default Output Format

| Field | Type | Description |
| --- | --- | --- |
| 2_hop_paths | str | Input multi-hop path string (preserved; column name varies with hop). |
| 2_QA_pairs | List[Dict] | Generated QA pairs; each element contains `question` and `answer` (column name varies with hop). |

**Example Input:**

```json
{
  "2_hop_paths": "<subj> Elon Musk <obj> SpaceX <rel> founded <time> 2002 || <subj> SpaceX <obj> ISS <rel> first commercial spacecraft docking with <time> 2012"
}
```

**Example Output (hop=2, qa_type="time_point"):**

```json
{
  "2_hop_paths": "...",
  "2_QA_pairs": [
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

- Operator implementation: `DataFlow-KG/dataflow/operators/temporal_kg/generate/tkg_rel_4tuple_path_qa_generator.py`
- Prompt templates: `DataFlow-KG/dataflow/prompts/diverse_kg/tkg.py`
