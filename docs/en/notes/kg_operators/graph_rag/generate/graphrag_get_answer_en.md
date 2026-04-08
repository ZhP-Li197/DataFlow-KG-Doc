---
title: KGGraphRAGGetAnswer
createTime: 2026/04/01 12:45:00
icon: material-symbols:deployed-code-outline
permalink: /en/kg_operators/graph_rag/generate/graphrag_get_answer/
---

## 📚 Overview
`KGGraphRAGGetAnswer` is a generate-category operator for Graph RAG answer generation.
It reads a question column and a subgraph prompt column, calls an LLM to generate the final answer based on graph facts, and writes the result back into the DataFrame.

Key characteristics of this operator:

- It depends on `LLMServingABC` for LLM inference
- It reads `question` and `subgraph_prompt` by default
- It writes to `answer` by default
- It supports both single-question/single-prompt input and multi-question/multi-prompt input in one row
- The current implementation uses a fixed English system prompt, while `lang` is only stored as an instance attribute and does not affect generation logic

---

## ✒️ __init__ Function
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    lang: str = "en",
):
    ...
```

## `__init__` Parameters

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM serving instance. The operator calls `generate_from_input` to generate answers from subgraph prompts. |
| `lang` | `str` | `"en"` | Language parameter. In the current implementation, the value is stored but generation still uses a fixed English system prompt. |

---

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_keys: List[str] = ["question", "subgraph_prompt"],
    output_key: str = "answer",
) -> List[str]:
    ...
```

`run` first reads a DataFrame from `storage`, validates the required input columns and output column, and then processes each row by reading the question and its corresponding subgraph prompt. If both `question` and `subgraph_prompt` are strings, the operator generates a single answer directly. If both are lists, it first aligns their lengths and then generates one answer per prompt, producing a row-level answer list. After processing, it writes the result back to the column specified by `output_key`.

In the answer generation stage, the content actually sent to the LLM is `subgraph_prompt`, together with a fixed system prompt instructing the model to answer only from the provided facts. After generation, the operator removes Markdown code blocks with a regex and trims leading and trailing whitespace. If an LLM call fails, it falls back to an empty string.

## `run` Parameters

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow storage object. The operator reads the `dataframe` from it and writes answers back to it. |
| `input_keys` | `List[str]` | `["question", "subgraph_prompt"]` | Input column name list. By default, the first column is the question column and the second is the subgraph prompt column. |
| `output_key` | `str` | `"answer"` | Output answer column name. The current implementation writes results using this parameter directly. |

---

## 🤖 Example Usage
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.graph_rag.generate.graphrag_get_answer import (
    KGGraphRAGGetAnswer,
)

llm_serving = YourLLMServing(...)

operator = KGGraphRAGGetAnswer(
    llm_serving=llm_serving,
    lang="en",
)
operator.run(
    storage=storage,
    input_keys=["question", "subgraph_prompt"],
    output_key="answer",
)
```

---

## Default Output Format

| Field | Type | Description |
| :-- | :-- | :-- |
| `question` | `str` / `List[str]` | Input question column. It can be a single question or multiple questions in one row. |
| `subgraph_prompt` | `str` / `List[str]` | Prompt produced by the upstream subgraph retrieval operator. This is the content actually sent to the LLM. |
| `answer` | `str` / `List[str]` / `None` | Generated answer output. If the input shape is unsupported, the current implementation writes `None` for that row. |

---

### Example Input

```json
[
  {
    "question": "Who trained Henry?",
    "subgraph_prompt": "You are given a question and relevant knowledge graph facts. Use ONLY the provided facts to answer the question. Question: Who trained Henry? Subgraph centered at [Henry]: - <subj> Henry <obj> Maria Rodriguez <rel> is_trained_by"
  }
]
```

### Example Output

```json
[
  {
    "question": "Who trained Henry?",
    "subgraph_prompt": "You are given a question and relevant knowledge graph facts. Use ONLY the provided facts to answer the question. Question: Who trained Henry? Subgraph centered at [Henry]: - <subj> Henry <obj> Maria Rodriguez <rel> is_trained_by",
    "answer": "Maria Rodriguez"
  }
]
```

---

### Related Links

- Operator implementation: `DataFlow-KG/dataflow/operators/graph_rag/generate/graphrag_get_answer.py`
- Upstream subgraph prompt operator: `DataFlow-KG/dataflow/operators/graph_rag/generate/graphrag_prompt_generator.py`
- Storage implementation: `DataFlow-KG/dataflow/utils/storage.py`
