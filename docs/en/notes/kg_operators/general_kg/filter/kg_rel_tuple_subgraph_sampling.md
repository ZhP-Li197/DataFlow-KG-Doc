---
title: KGEntityBasedSubgraphSampling
createTime: 2026/04/10 15:40:44
permalink: /en/kg_operators/general_kg/sample/kg_rel_tuple_subgraph_sampling/
---

## 📚 Overview
`KGEntityBasedSubgraphSampling` is a sampling operator that samples subgraphs from a knowledge graph on a per-entity basis.
It supports three sampling strategies — BFS, Random Walk (RW), and Hop-based — sampling a subgraph for each entity in the graph and outputting each entity's result as one row.

Key characteristics of this operator:

- Does not actually call `LLMServingABC` (must be passed at construction but is not used)
- Supports three subgraph sampling strategies: `bfs` (breadth-first), `hop` (k-hop neighborhood), `rw` (random walk)
- By default, samples from **all entities** in the graph, generating one output row per entity; a specific entity list can be provided via `start_entity`
- When the DataFrame has multiple rows, triples from all rows are merged before processing; for a single-row DataFrame, the row is used directly
- The number of output rows equals the number of sampled entities, independent of the number of input rows

---

## ✒️ `__init__` Parameters
```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    seed: int = 0,
    lang: str = "en",
    num_q: int = 5
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | Interface compatibility parameter. The operator does not call the LLM internally but requires this argument at construction. |
| `seed` | `int` | `0` | Random seed for neighbor selection in the random walk strategy. |
| `lang` | `str` | `"en"` | Language setting. Does not affect processing logic in the current version. |
| `num_q` | `int` | `5` | Reserved parameter. Not used in the main processing flow in the current version. |

---

## 💡 `run` Parameters
```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "triple",
    output_key: str = "subgraph",
    sampling_type: str = "hop",
    start_entity: Optional[str] = None,
    M: int = 5,
    hop: int = 2,
    num_walks: int = 5,
    walk_length: int = 3
):
    ...
```

`run` reads the DataFrame from `storage`, determines the input column by priority (`input_key` → `triple` → `tuple`), and merges all triples. It determines sampling starting points from `start_entity` (uses all entities in the graph if `None`), then samples a subgraph for each starting point using the strategy specified by `sampling_type`. The three strategies are: `bfs` — breadth-first expansion from the starting point, collecting at most `M` triples; `hop` — collects all triples within `hop` hops of the starting point; `rw` — runs `num_walks` random walks of length `walk_length` each and collects triples along the way. Each entity's sampling result is written as a new row in the output DataFrame.

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | Dataflow storage object. The operator reads the `dataframe` from it and writes the sampling results to a new DataFrame. |
| `input_key` | `str` | `"triple"` | Input triple column name. Also supports fallback to `triple` and `tuple` column names. |
| `output_key` | `str` | `"subgraph"` | Output subgraph column name. Each row stores the list of sampled triples for the corresponding entity. |
| `sampling_type` | `str` | `"hop"` | Sampling strategy. Options: `"bfs"`, `"hop"`, `"rw"`. |
| `start_entity` | `List[str]` / `None` | `None` | List of starting entities for sampling. If `None`, all entities in the graph are used. |
| `M` | `int` | `5` | Maximum number of triples to collect under the BFS strategy. |
| `hop` | `int` | `2` | Number of hops to collect under the Hop strategy. |
| `num_walks` | `int` | `5` | Number of random walks under the random walk strategy. |
| `walk_length` | `int` | `3` | Step length of each random walk under the random walk strategy. |

---

## 🤖 Example Usage
```python
from dataflow.operators.general_kg.sample.kg_rel_tuple_subgraph_sampling import (
    KGEntityBasedSubgraphSampling,
)

operator = KGEntityBasedSubgraphSampling(
    llm_serving=llm_serving,
    seed=42,
)
operator.run(
    storage=storage,
    input_key="triple",
    output_key="subgraph",
    sampling_type="hop",
    hop=2,
)
```

---

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `subgraph` | `List[str]` | List of sampled subgraph triples for the entity. Each row corresponds to one starting entity. |

---

#### Example Input
```json
[
  {
    "triple": [
      "<subj> Alice <obj> Bob <rel> knows",
      "<subj> Bob <obj> Carol <rel> worksWith",
      "<subj> Carol <obj> Dave <rel> manages"
    ]
  }
]
```

#### Example Output (`sampling_type="hop"`, `hop=1`, starting from Alice)
```json
[
  {
    "subgraph": [
      "<subj> Alice <obj> Bob <rel> knows"
    ]
  }
]
```

---

#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/general_kg/sample/kg_rel_tuple_subgraph_sampling.py`