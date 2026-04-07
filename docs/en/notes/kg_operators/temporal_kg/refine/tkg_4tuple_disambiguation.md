---
title: TKGTupleDisambiguation
createTime: 2026/04/07 09:00:00
permalink: /en/kg_operators/temporal_kg/refine/tkg_4tuple_disambiguation/
---

#### 📚 Overview

`TKGTupleDisambiguation` resolves ambiguous quadruples produced by the merge stage. It reads candidate tuples from `merged_tuples["ambiguous"]`, detects whether each candidate is attribute-style or relation-style, and then calls the corresponding prompt template to produce the final `resolved` output.

#### 📚 `__init__` Function

```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    attribute_prompt: Union[KGAttributeTripleDisambiguationPrompt, DIYPromptABC] = None,
    relation_prompt: Union[TKGRelationDisambiguationPrompt, DIYPromptABC] = None,
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | Model serving backend used for disambiguation |
| `seed` | `int` | `0` | Random seed |
| `lang` | `str` | `"en"` | Prompt language |
| `attribute_prompt` | `Prompt` | `None` | Custom prompt for attribute-style disambiguation; falls back to the default template when omitted |
| `relation_prompt` | `Prompt` | `None` | Custom prompt for relation-style disambiguation; falls back to the default template when omitted |

#### 💡 `run` Function

```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "merged_tuples",
    input_key_meta: str = "ambiguous",
    output_key: str = "resolved",
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Input/output storage object |
| `input_key` | `str` | `"merged_tuples"` | Column containing merge results |
| `input_key_meta` | `str` | `"ambiguous"` | Dictionary key that points to the ambiguous candidate list |
| `output_key` | `str` | `"resolved"` | Output column for resolved tuples |

If a candidate cannot be parsed from the model output, the operator falls back to the original candidate string instead of dropping it.

#### 🤖 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.temporal_kg.refinement.tkg_4tuple_disambiguation import TKGTupleDisambiguation

storage = FileStorage(
    first_entry_file_name="dataflow/data_for_operator_testing/tkg_merge.json",
    cache_path="./cache",
    file_name_prefix="tkg_disamb",
    cache_type="json",
).step()

op = TKGTupleDisambiguation(llm_serving=llm_serving, lang="en")
op.run(
    storage=storage,
    input_key="merged_tuples",
    input_key_meta="ambiguous",
    output_key="resolved"
)
```

Example input:

```json
{
  "merged_tuples": {
    "ambiguous": [
      "<subj> E1 <obj> E2 <rel> relA <time> 2026-03-01 锝?<subj> E1 <obj> E2 <rel> relB <time> 2026-03-01"
    ]
  }
}
```

Example output:

```json
{
  "resolved": [
    "<subj> E1 <obj> E2 <rel> relA <time> 2026-03-01"
  ]
}
```
