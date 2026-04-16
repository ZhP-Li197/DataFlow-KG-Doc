---
title: SchoKGRecommendOperator
createTime: 2026/04/11 11:05:00
permalink: /en/kg_operators/domain_kg/scholar_kg/generate/schokg_recommend/
---

## 📚 Overview
`SchoKGRecommendOperator` is a generation-category operator for node recommendation over a scholarly knowledge graph.
It first identifies candidate nodes and supporting paths from the query, triples, and entity-type metadata, then uses an LLM to produce the final recommendation list and justification.

Key characteristics of this operator:

- It relies on `LLMServingABC` for recommendation generation
- It uses `SchoKGRecommendPrompt` by default
- It reads `query`, `triple`, and `entity_class` by default
- It writes `recommended_node` and `recommendation_reason` by default
- It supports explicit control over the target node type via `target_type`

---

## ✒️ __init__ Function
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    max_hop: int = 3,
    max_candidate_nodes: int = 20,
    max_paths_per_node: int = 3,
    prompt_template=None,
):
    ...
```

#### `__init__` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | LLM service object. |
| `seed` | `int` | `0` | Initializes the internal random generator. |
| `lang` | `str` | `"en"` | Default prompt language. |
| `max_hop` | `int` | `3` | Maximum graph-search hop count. |
| `max_candidate_nodes` | `int` | `20` | Maximum number of candidate nodes retained. |
| `max_paths_per_node` | `int` | `3` | Maximum number of supporting paths kept for each candidate node. |
| `prompt_template` | `Any` | `None` | Custom prompt template. When omitted, the operator uses `SchoKGRecommendPrompt(lang=self.lang)`. |

---

## 💡 run Function
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key_query: str = "query",
    input_key_triple: str = "triple",
    input_key_class: str = "entity_class",
    target_type: str = "Author",
    output_key_node: str = "recommended_node",
    output_key_reason: str = "recommendation_reason",
):
    ...
```

`run` validates the query, triple, entity-class, and output columns, then processes each row by building a graph and an entity-type map. It matches graph entities against the query text, starts path exploration from the top two seed entities, and keeps only candidate nodes whose inferred type matches `target_type`. Each candidate node aggregates supporting paths, and candidates are ranked by path count, lexical overlap with the query, and shortest path length. The selected candidate-node bundle is finally passed to the prompt to generate `recommended_node` and `recommendation_reason`.

#### `run` Parameters
| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow storage object. |
| `input_key_query` | `str` | `"query"` | Input query column name. |
| `input_key_triple` | `str` | `"triple"` | Input triple column name. |
| `input_key_class` | `str` | `"entity_class"` | Input entity-class column name. It is expected to align item-by-item with the triples. |
| `target_type` | `str` | `"Author"` | Target type for recommended nodes. |
| `output_key_node` | `str` | `"recommended_node"` | Output recommended-node column name. |
| `output_key_reason` | `str` | `"recommendation_reason"` | Output recommendation-reason column name. |

---

## 🤖 Example Usage
```python
import pandas as pd

from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.scholar_kg.generate.schokg_recommend import (
    SchoKGRecommendOperator,
)

# Step 1: Assume llm_serving has been initialized in your project

# Step 2: Prepare input data
dataframe = pd.DataFrame(
    [
        {
            "query": "Recommend an author working on graph neural networks.",
            "triple": [
                "<subj> Jure Leskovec <obj> graph neural networks <rel> studies",
                "<subj> Jure Leskovec <obj> Stanford University <rel> affiliated_with"
            ],
            "entity_class": [
                ["Author", "Topic"],
                ["Author", "University"]
            ]
        }
    ]
)

storage = DummyStorage()
storage.set_data(dataframe)

operator = SchoKGRecommendOperator(
    llm_serving=llm_serving,
    lang="en",
)
operator.run(
    storage=storage,
    target_type="Author",
)
```

---

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `query` | `str` | Input user query. |
| `triple` | `List[str]` | Input scholarly triple list. |
| `entity_class` | `List[List[str]]` | Entity-type list aligned with the triples. |
| `recommended_node` | `List[str]` | Model-recommended node-name list. |
| `recommendation_reason` | `str` | Recommendation justification generated from supporting paths. |

---

#### Example Input
```json
[
  {
    "query": "Recommend an author working on graph neural networks.",
    "triple": [
      "<subj> Jure Leskovec <obj> graph neural networks <rel> studies",
      "<subj> Jure Leskovec <obj> Stanford University <rel> affiliated_with"
    ],
    "entity_class": [
      ["Author", "Topic"],
      ["Author", "University"]
    ]
  }
]
```

#### Example Output
```json
[
  {
    "query": "Recommend an author working on graph neural networks.",
    "triple": [
      "<subj> Jure Leskovec <obj> graph neural networks <rel> studies",
      "<subj> Jure Leskovec <obj> Stanford University <rel> affiliated_with"
    ],
    "entity_class": [
      ["Author", "Topic"],
      ["Author", "University"]
    ],
    "recommended_node": ["Jure Leskovec"],
    "recommendation_reason": "Jure Leskovec is directly connected to graph neural networks in the candidate evidence and is therefore a strong recommendation."
  }
]
```

---
#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/domain_kg/scholar_kg/generate/schokg_recommend.py`
- Default prompt: `DataFlow-KG/dataflow/prompts/diverse_kg/schokg.py`
- Related operator: `DataFlow-KG/dataflow/operators/domain_kg/scholar_kg/generate/schokg_query_reasoning.py`


