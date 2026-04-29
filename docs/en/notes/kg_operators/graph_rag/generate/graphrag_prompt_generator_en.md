---
title: KGGraphRAGSubgraphRetrieval
createTime: 2026/04/01 12:35:00
permalink: /en/kg_operators/graph_rag/generate/graphrag_prompt_generator/
---

## 📚 Overview
`KGGraphRAGSubgraphRetrieval` is a generate-category operator for Graph RAG subgraph retrieval and prompt construction.
It uses the question list, extracted entities, and knowledge graph triples to build one answer prompt per question, so that downstream answer generation operators can directly consume the retrieved graph context.

Key characteristics of this operator:

- It does not rely on an LLM and instead performs rule-based subgraph retrieval and prompt assembly
- It is mainly designed for the input format where one row contains multiple questions
- It builds a graph from the `triple` column and performs `k`-hop BFS as an undirected graph
- It writes to `subgraph_prompt` by default
- In the current implementation, it actually reads `question`, `entities`, and `triple`, and does not depend on `relations`

---

## ✒️ `__init__` Function
```python
def __init__(self, hop: int = 1):
    ...
```

#### `__init__` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `hop` | `int` | `1` | Number of hops for subgraph retrieval. The operator performs `k`-hop BFS around seed entities and writes the collected triples into the prompt. |

---

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    output_key: str = "subgraph_prompt",
) -> List[List[str]]:
    ...
```

`run` first reads a DataFrame from `storage`, validates the required columns, and then processes the data row by row. For each row, it takes the question list, entity list, and triple list, aligns question and entity counts, and then performs `k`-hop subgraph retrieval from the `triple` data for each question-specific entity set. The retrieved facts are then assembled into English prompts, and the resulting prompt list is written back to the output column.

Internally, the operator parses triples in the `<subj> ... <obj> ... <rel> ...` format, builds an entity catalog and adjacency structure, and then selects seed entities. Seed entities are taken from the intersection between extracted entities and graph entities. If no extracted entity matches but the graph still contains entities, the operator falls back to the first entity in the catalog and continues prompt construction.

#### `run` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow storage object. The operator reads the `dataframe` from it and writes generated prompts back to it. |
| `output_key` | `str` | `"subgraph_prompt"` | Output column name. The current implementation writes results using this parameter directly. |

---

## 🤖 Example Usage
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.graph_rag.generate.graphrag_prompt_generator import (
    KGGraphRAGSubgraphRetrieval,
)

operator = KGGraphRAGSubgraphRetrieval(hop=1)
operator.run(
    storage=storage,
    output_key="subgraph_prompt",
)
```

---

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `question` | `List[str]` | Multiple questions within one row. The current implementation mainly processes this format. |
| `entities` | `List[List[str]]` | Entity lists aligned with each question. Each question corresponds to one entity sub-list. |
| `triple` | `List[str]` | Raw knowledge graph triple list. Each item should follow a format close to `<subj> ... <obj> ... <rel> ...`. |
| `subgraph_prompt` | `List[str]` | Prompt list generated for each question. |

---

#### Example Input
```json
[
  {
    "question":[
      "On which date was Polar Lights released?",
      "Who trained Henry?"
    ],
    "entities":[
      [
        "Polar Lights"
      ],
      [
        "Henry"
      ]
    ],
    "relations":[
      [
        "release_date"
      ],
      [
        "trained_by"
      ]
    ],
    "triple":[
      "<subj> Henry <obj> Maria Rodriguez <rel> is_trained_by",
      "<subj> Henry <obj> The Maple Leaves <rel> forms",
      "<subj> The Maple Leaves <obj> Polar Lights <rel> releases",
      "<subj> Polar Lights <obj> August 12 2020 <rel> is_released_on"
    ]
  }
]
```

#### Example Output
```json
[
  {
    "subgraph_prompt":[
      "You are given a question and relevant knowledge graph facts.\nUse ONLY the provided facts to answer the question.\n\nQuestion:\nOn which date was Polar Lights released?\n\nSubgraph centered at [Polar Lights]:\n- <subj> Polar Lights <obj> August 12 2020 <rel> is_released_on\n- <subj> The Maple Leaves <obj> Polar Lights <rel> releases\n\nAnswer the question based on the above knowledge graph subgraphs.",
      "You are given a question and relevant knowledge graph facts.\nUse ONLY the provided facts to answer the question.\n\nQuestion:\nWho trained Henry?\n\nSubgraph centered at [Henry]:\n- <subj> Henry <obj> Maria Rodriguez <rel> is_trained_by\n- <subj> Henry <obj> The Maple Leaves <rel> forms\n\nAnswer the question based on the above knowledge graph subgraphs."
    ]
  }
]
```

---

#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/graph_rag/generate/graphrag_prompt_generator.py`
- Upstream query extraction operator: `DataFlow-KG/dataflow/operators/graph_rag/generate/graphrag_query_extractor.py`
- Storage implementation: `DataFlow-KG/dataflow/utils/storage.py`
