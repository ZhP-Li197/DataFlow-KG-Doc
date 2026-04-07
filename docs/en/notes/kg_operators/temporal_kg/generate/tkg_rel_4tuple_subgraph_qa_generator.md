---
title: TKGTupleSubgraphQAGeneration
createTime: 2026/04/07 09:00:00
permalink: /en/kg_operators/temporal_kg/generate/tkg_rel_4tuple_subgraph_qa_generator/
---

#### 📚 Overview

`TKGTupleSubgraphQAGeneration` generates QA pairs from temporal subgraphs. Compared with the path-based version, it directly consumes the `subgraph` column and is better suited for producing local temporal QA around a specific entity.

#### 📚 `__init__` Function

```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    qa_type: str = "time_point",
    num_q: int = 5
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | Model serving backend used for QA generation |
| `seed` | `int` | `0` | Random seed |
| `lang` | `str` | `"en"` | Prompt language |
| `qa_type` | `str` | `"time_point"` | Supports `time_point`, `event_order`, `time_order`, and `time_interval` |
| `num_q` | `int` | `5` | Reserved parameter; not directly used to control output count in the current implementation |

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
| `input_key` | `str` | `"subgraph"` | Column containing the temporal subgraph |
| `output_key` | `str` | `"QA_pairs"` | Output column for generated QA pairs |

#### 🤖 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.temporal_kg.generate.tkg_rel_4tuple_subgraph_qa_generator import TKGTupleSubgraphQAGeneration

storage = FileStorage(
    first_entry_file_name="dataflow/data_for_operator_testing/tkg_attri_qa.json",
    cache_path="./cache",
    file_name_prefix="tkg_subgraph_qa",
    cache_type="json",
).step()

op = TKGTupleSubgraphQAGeneration(
    llm_serving=llm_serving,
    qa_type="time_order",
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
      "question": "Which happened earlier for Elon Musk, founding SpaceX or founding Neuralink?",
      "answer": "Founding SpaceX happened earlier, in 2002."
    }
  ]
}
```
