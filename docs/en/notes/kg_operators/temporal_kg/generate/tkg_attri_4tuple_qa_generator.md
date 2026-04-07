---
title: TKGAttriuteQAGeneration
createTime: 2026/04/07 09:00:00
permalink: /en/kg_operators/temporal_kg/generate/tkg_attri_4tuple_qa_generator/
---

#### 📚 Overview

`TKGAttriuteQAGeneration` generates QA pairs from attribute-oriented temporal subgraphs. It is suitable for building time-point, event-order, temporal-order, and time-interval QA data. The usual input column is `subgraph`, and the usual output column is `QA_pairs`.

#### 📚 `__init__` Function

```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    qa_type: str = "time_interval",
    num_q: int = 5
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | Model serving backend used for QA generation |
| `seed` | `int` | `0` | Random seed |
| `lang` | `str` | `"en"` | Prompt language |
| `qa_type` | `str` | `"time_interval"` | Supports `time_point`, `event_order`, `time_order`, and `time_interval` |
| `num_q` | `int` | `5` | Reserved parameter; not directly used to limit output count in the current implementation |

#### 💡 `run` Function

```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "subgraph",
    output_key: str = "QA_pairs"
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Input/output storage object |
| `input_key` | `str` | `"subgraph"` | Column containing attribute-oriented temporal subgraphs |
| `output_key` | `str` | `"QA_pairs"` | Output column for generated QA pairs |

`run` sends each subgraph to the selected prompt template, parses the `QA_pairs` field from the returned JSON, and writes it back to the dataframe.

#### 🤖 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.temporal_kg.generate.tkg_attri_4tuple_qa_generator import TKGAttriuteQAGeneration

storage = FileStorage(
    first_entry_file_name="dataflow/data_for_operator_testing/tkg_attri_qa.json",
    cache_path="./cache",
    file_name_prefix="tkg_attri_qa",
    cache_type="json",
).step()

op = TKGAttriuteQAGeneration(
    llm_serving=llm_serving,
    qa_type="time_interval",
    lang="en"
)
op.run(storage=storage, input_key="subgraph", output_key="QA_pairs")
```

Example input:

```json
{
  "subgraph": [
    "<entity> Elon Musk <attribute> company founded <value> SpaceX <time> 2002",
    "<entity> Elon Musk <attribute> company founded <value> Neuralink <time> 2016"
  ]
}
```

Example output:

```json
{
  "QA_pairs": [
    {
      "question": "How many years passed between Elon Musk founding SpaceX and Neuralink?",
      "answer": "14 years."
    }
  ]
}
```
