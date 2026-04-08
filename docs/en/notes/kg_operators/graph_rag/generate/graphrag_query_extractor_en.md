---
title: KGGraphRAGQueryExtraction
createTime: 2026/04/01 12:10:00
permalink: /en/kg_operators/graph_rag/generate/graphrag_query_extractor/
---

## 📚 Overview
`KGGraphRAGQueryExtraction` is a generate-category operator for Graph RAG query understanding.
It extracts entities and relations required for knowledge graph retrieval from input questions, then writes the results back into the DataFrame for downstream subgraph retrieval and answer generation operators.

Key characteristics of this operator:

- It depends on `LLMServingABC` for LLM inference
- It uses `KGQueryExtractionPrompt` by default and also supports custom prompt injection
- It reads the `question` input column
- It writes `entities` and `relations` by default
- It supports two cell input formats: a single question `str`, or multiple questions in one row as `List[str]`

---

## ✒️ __init__ Function
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    prompt_template: Union[
        KGQueryExtractionPrompt, DIYPromptABC
    ] = None,
):
    ...
```

#### `__init__` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM serving instance. The operator calls `generate_from_input` on it to extract entities and relations. |
| `seed` | `int` | `0` | Used to initialize the internal random number generator. In the current implementation, it is initialized but not further used in the main logic. |
| `lang` | `str` | `"en"` | Language for the default prompt. If no custom prompt is provided, the operator creates `KGQueryExtractionPrompt(lang=lang)`. |
| `prompt_template` | `Union[KGQueryExtractionPrompt, DIYPromptABC]` | `None` | Custom prompt template. If `None`, the default `KGQueryExtractionPrompt` is used. |

---

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "question",
    output_keys: List[str] = ["entities", "relations"],
):
    ...
```

`run` first reads a DataFrame from `storage`, validates the required input column and output column constraints, and then processes the `question` column row by row. If a cell is a string, the operator directly calls the LLM to extract entities and relations. If a cell is `List[str]`, it processes each question one by one and stores the results as nested lists. Finally, the operator writes the updated DataFrame back to storage and returns the output field names.

When parsing the LLM result, the operator tries to clean the response into JSON and read the `entities` and `relations` fields. If parsing fails, it logs a warning and falls back to empty lists.

#### `run` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow storage object. The operator reads the `dataframe` from it and writes the processed result back. |
| `input_key` | `str` | `"question"` | Input question column name. Each cell in this column can be either `str` or `List[str]`. |
| `output_keys` | `List[str]` | `["entities", "relations"]` | Expected output field names. In the current implementation, this argument is used for column existence validation and as the return value, but the operator still writes fixed columns named `entities` and `relations` into the DataFrame. |

---

## 🤖 Example Usage
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.prompts.application_kg.graph_rag import KGQueryExtractionPrompt
from dataflow.operators.graph_rag.generate.graphrag_query_extractor import (
    KGGraphRAGQueryExtraction,
)

operator = KGGraphRAGQueryExtraction(
    llm_serving=llm_serving,
    lang="en",
    prompt_template=KGQueryExtractionPrompt(lang="en"),
)
operator.run(
    storage=storage,
    input_key="question",
    output_keys=["entities", "relations"],
)
```

---

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `question` | `str` / `List[str]` | Input question column. It supports either a single question or multiple questions in one row. |
| `entities` | `List[str]` / `List[List[str]]` | Extracted entity list. If the input contains multiple questions in one row, this field becomes a nested list aligned by question. |
| `relations` | `List[str]` / `List[List[str]]` | Extracted relation list. If the input contains multiple questions in one row, this field becomes a nested list aligned by question. |

---

#### Example Input
```json
[
  {
    "question": "Who trained Henry?"
  }
]
```

#### Example Output
```json
[
  {
    "question": "Who trained Henry?",
    "entities": ["Henry"],
    "relations": ["trained_by"]
  }
]
```

---
#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/graph_rag/generate/graphrag_query_extractor.py`
- Default prompt: `DataFlow-KG/dataflow/prompts/application_kg/graph_rag.py`
- Storage implementation: `DataFlow-KG/dataflow/utils/storage.py`


