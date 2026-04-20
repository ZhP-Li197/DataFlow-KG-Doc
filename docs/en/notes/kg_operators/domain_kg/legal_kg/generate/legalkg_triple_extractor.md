---
title: LegalKGTupleExtraction
createTime: 2026/04/15 09:00:00
permalink: /en/kg_operators/domain_kg/legal_kg/generate/legalkg_triple_extractor/
---

## 📚 Overview

`LegalKGTupleExtraction` extracts legal KG tuples from legal text and also generates a case summary. Depending on `triple_type`, it switches between relation-triple prompting and attribute-triple prompting.

Key characteristics of this operator:

- It depends on `LLMServingABC` for extraction
- It reads `raw_chunk` by default
- It writes `triple`, `entity_class`, and `case_summary` by default
- The current implementation effectively relies on the cached ontology file `./.cache/api/legal_ontology.json`
- It applies text preprocessing and basic quality checks before calling the model

## ✒️ `__init__` Function

```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    triple_type: str = "attribute",
    lang: str = "zh",
    num_q: int = 5
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM service object |
| `seed` | `int` | `0` | Initializes the internal random generator; the current main flow does not use random sampling |
| `triple_type` | `str` | `"attribute"` | Extraction mode. `"attribute"` uses the attribute extractor prompt and `"relation"` uses the relation extractor prompt |
| `lang` | `str` | `"zh"` | Prompt language |
| `num_q` | `int` | `5` | Reserved parameter not used in the current pipeline |

## 💡 `run` Function

```python
def run(
    self,
    storage: DataFlowStorage = None,
    ontology_lists = None,
    input_key: str = "raw_chunk",
    input_key_meta: str = "legal_ontology",
    output_key: str = "triple",
    output_key_meta1: str = "entity_class",
    output_key_meta2: str = "case_summary",
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | DataFlow storage object |
| `ontology_lists` | `Any` | `None` | This parameter remains in the function signature, but the current `run()` implementation does not reliably support directly using an externally supplied ontology object |
| `input_key` | `str` | `"raw_chunk"` | Input legal text column |
| `input_key_meta` | `str` | `"legal_ontology"` | Ontology cache identifier; the code reads `./.cache/api/{input_key_meta}.json` |
| `output_key` | `str` | `"triple"` | Output tuple column name |
| `output_key_meta1` | `str` | `"entity_class"` | Output entity-class column name |
| `output_key_meta2` | `str` | `"case_summary"` | Output case-summary column name |

`run` reads the DataFrame and extracts texts from `input_key`. In the current implementation, the working path is to load the first row from the cache file and construct:

```python
{
    "entity_type": row["entity_type"],
    "relation_type": row["relation_type"],
    "attribute_type": row.get("attribute_type", {})
}
```

Note that although the function signature still exposes `ontology_lists`, the current code only defines `ontology_dict` inside the `ontology_lists == None` branch and then always calls:

```python
self.process_batch(texts, ontology_dict)
```

So in the current implementation, passing a non-empty `ontology_lists` value does not reliably replace the cache-loading path.

The operator then preprocesses each text:

- non-string inputs are dropped
- surrounding whitespace is stripped
- text length must be between `10` and `200000`
- the text must contain at least two Chinese `。` or English `.` sentence markers
- the special-character ratio must not exceed `0.3`

Invalid texts produce empty outputs. Parsed results are written back to `triple`, `entity_class`, and `case_summary`. The function returns:

```python
["triple"]
```

## 🤖 Example Usage

```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.legal_kg.generate.legalkg_triple_extractor import (
    LegalKGTupleExtraction,
)

dataframe = pd.DataFrame(
    [
        {
            "raw_chunk": "The defendant secretly took a mobile phone from a shopping mall, with a value of RMB 6000. The police later arrested the defendant. The court held that the conduct constituted theft."
        }
    ]
)

storage = DummyStorage()
storage.set_data(dataframe)

operator = LegalKGTupleExtraction(
    llm_serving=llm_serving,
    triple_type="attribute",
    lang="en",
)
operator.run(
    storage=storage,
    input_key="raw_chunk",
    input_key_meta="legal_ontology",
    output_key="triple",
    output_key_meta1="entity_class",
    output_key_meta2="case_summary",
)
```

#### Default Output Format

| Field | Type | Description |
| :-- | :-- | :-- |
| `triple` | `List[str]` | Extracted legal KG tuple list; attribute mode usually returns `<entity> ... <attribute> ... <value> ...`, while relation mode usually returns `<subj> ... <obj> ... <rel> ...` |
| `entity_class` | `List[List[str]]` / `List` | Usually the entity-class metadata aligned with `triple`; when preprocessing fails, the `_construct_examples` failure branch only returns `{"source_text": "", "triple": []}`, and `run()` writes back `o.get("entity_class", [])`, so this column is explicitly set to an empty list `[]` |
| `case_summary` | `str` / `List` | Usually the case-summary string generated by the model; when preprocessing fails, same as `entity_class` — `run()` writes back `o.get("case_summary", [])`, so this column is explicitly set to an empty list `[]` |

#### Example Input

```json
[
  {
    "raw_chunk": "The defendant secretly took a mobile phone from a shopping mall, with a value of RMB 6000. The police later arrested the defendant. The court held that the conduct constituted theft."
  }
]
```

#### Example Output

```json
[
  {
    "raw_chunk": "The defendant secretly took a mobile phone from a shopping mall, with a value of RMB 6000. The police later arrested the defendant. The court held that the conduct constituted theft.",
    "triple": [
      "<entity> Zhang San <attribute> amount_involved <value> RMB 6000",
      "<entity> Zhang San <attribute> charge <value> theft"
    ],
    "entity_class": [
      ["Defendant"],
      ["Defendant"]
    ],
    "case_summary": "The defendant stole a mobile phone valued at RMB 6000 from a shopping mall. The court determined that the conduct constituted theft."
  }
]
```

#### Related Links

- Operator implementation: `DataFlow-KG/dataflow/operators/domain_kg/legal_kg/generate/legalkg_triple_extractor.py`
- Default prompt: `DataFlow-KG/dataflow/prompts/diverse_kg/legalkg.py`
