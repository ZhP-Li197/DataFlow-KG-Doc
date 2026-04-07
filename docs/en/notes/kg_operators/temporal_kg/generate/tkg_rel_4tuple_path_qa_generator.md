---
title: TKGTuplePathQAGeneration
createTime: 2026/04/07 09:00:00
permalink: /en/kg_operators/temporal_kg/generate/tkg_rel_4tuple_path_qa_generator/
---

#### 📚 Overview

`TKGTuplePathQAGeneration` generates temporal QA pairs from one-hop tuples or multi-hop paths. When `hop=1`, it reads the `tuple` column. When `hop>1`, it reads a dynamic path column such as `2_hop_paths` and writes results to a dynamic output column such as `2_QA_pairs`.

#### 📚 `__init__` Function

```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    hop: int = 2,
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
| `hop` | `int` | `2` | Hop count; `1` means direct generation from the `tuple` column |
| `qa_type` | `str` | `"time_point"` | Supports `time_point`, `event_order`, `time_order`, and `time_interval` |
| `num_q` | `int` | `5` | Reserved parameter; not directly used to control output count in the current implementation |

#### 💡 `run` Function

```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key_meta: str = "hop_paths",
    output_key_meta: str = "QA_pairs"
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Input/output storage object |
| `input_key_meta` | `str` | `"hop_paths"` | Combined with `hop` to form the actual input column, such as `2_hop_paths` |
| `output_key_meta` | `str` | `"QA_pairs"` | Combined with `hop` to form the actual output column, such as `2_QA_pairs` |

#### 🤖 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.temporal_kg.generate.tkg_rel_4tuple_path_qa_generator import TKGTuplePathQAGeneration

storage = FileStorage(
    first_entry_file_name="dataflow/data_for_operator_testing/tkg_rel_qa.json",
    cache_path="./cache",
    file_name_prefix="tkg_path_qa",
    cache_type="json",
).step()

op = TKGTuplePathQAGeneration(
    llm_serving=llm_serving,
    hop=2,
    qa_type="time_point",
    lang="en"
)
op.run(storage=storage, input_key_meta="hop_paths", output_key_meta="QA_pairs")
```

Example input:

```json
{
  "2_hop_paths": "<subj> Elon Musk <obj> SpaceX <rel> founded <time> 2002 || <subj> SpaceX <obj> ISS <rel> first commercial spacecraft docking with <time> 2012"
}
```

Example output:

```json
{
  "2_QA_pairs": [
    {
      "question": "In what year did the company founded by Elon Musk achieve its first commercial spacecraft docking with the ISS?",
      "answer": "2012."
    }
  ]
}
```
