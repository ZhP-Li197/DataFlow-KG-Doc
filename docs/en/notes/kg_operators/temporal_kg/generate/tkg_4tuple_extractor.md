---
title: TKGTupleExtraction
createTime: 2026/04/07 09:00:00
permalink: /en/kg_operators/temporal_kg/generate/tkg_4tuple_extractor/
---

#### 📚 Overview

`TKGTupleExtraction` extracts temporal quadruples from raw text. The `triple_type` argument switches between relation quadruples and attribute quadruples, and the parsed result is written to the `tuple` column.

Typical input is `raw_chunk`, and typical output is `tuple`.

#### 📚 `__init__` Function

```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    triple_type: str = "attribute",
    seed: int = 0,
    lang: str = "en",
    num_q: int = 5
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | Model serving backend used for temporal tuple extraction |
| `triple_type` | `str` | `"attribute"` | Use `"attribute"` for attribute quadruples and `"relation"` for relation quadruples |
| `seed` | `int` | `0` | Random seed |
| `lang` | `str` | `"en"` | Prompt language |
| `num_q` | `int` | `5` | Reserved parameter; not directly used in the current `run` implementation |

#### 💡 `run` Function

```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "raw_chunk",
    output_key: str = "tuple"
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Storage object used to read and write the DataFrame |
| `input_key` | `str` | `"raw_chunk"` | Column containing raw text |
| `output_key` | `str` | `"tuple"` | Output column for extracted quadruples |

`run` validates the dataframe schema, invokes the prompt template row by row, and stores the parsed list of tuples in the output column. If text is empty, fails the quality check, or the LLM output cannot be parsed as JSON, the row receives an empty list.

#### 🤖 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.temporal_kg.generate.tkg_4tuple_extractor import TKGTupleExtraction

storage = FileStorage(
    first_entry_file_name="dataflow/data_for_operator_testing/tkg_rel.json",
    cache_path="./cache",
    file_name_prefix="tkg_extract",
    cache_type="json",
).step()

op = TKGTupleExtraction(
    llm_serving=llm_serving,
    triple_type="relation",
    lang="en"
)
op.run(storage=storage, input_key="raw_chunk", output_key="tuple")
```

Example input:

```json
{
  "raw_chunk": "After graduating from Stanford University in 2004, Elon Musk founded SpaceX in 2002 and took over Tesla Motors as CEO in 2008."
}
```

Example output:

```json
{
  "tuple": [
    "<subj> Elon Musk <obj> Stanford University <rel> graduated from <time> 2004",
    "<subj> Elon Musk <obj> SpaceX <rel> founded <time> 2002",
    "<subj> Elon Musk <obj> Tesla Motors <rel> took over as CEO <time> 2008"
  ]
}
```
