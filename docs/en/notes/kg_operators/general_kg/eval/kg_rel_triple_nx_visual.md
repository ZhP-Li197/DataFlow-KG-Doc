---
title: KGRelationTripleVisualization
createTime: 2026/04/10 15:40:44
permalink: /en/kg_operators/general_kg/eval/kg_rel_triple_nx_visual/
---

## 📚 Overview
`KGRelationTripleVisualization` is an operator that visualizes knowledge graph relation triples as interactive graph structures.
It reads a list of triples from each row, parses entities and relations, constructs a directed graph using NetworkX, and renders an interactive HTML visualization file via PyVis.

Key characteristics of this operator:

- Does **not** require `LLMServingABC` — this is a pure graph processing operator.
- Uses regular expressions to parse triples in `<subj> ... <obj> ... <rel> ...` format.
- Node size is dynamically scaled by entity occurrence frequency, making core entities easy to identify.
- Uses PyVis's `barnes_hut` layout to render an interactive directed graph with relation labels on edges.
- Outputs a single HTML file that can be opened directly in a browser for exploration.

---

## ✒️ `__init__` Parameters
```python
def __init__(
    self,
    llm_serving: LLMServingABC = None,
    seed: int = 0,
    lang: str = "en"
):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | `None` | This operator does not use an LLM. This parameter is reserved for interface compatibility only and has no effect if provided. |
| `seed` | `int` | `0` | Random seed for the internal random number generator. |
| `lang` | `str` | `"en"` | Language setting; does not currently affect visualization output. |

---

## 💡 `run` Function
```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "triple",
    output_key: str = "kg_visualization"
):
    ...
```

`run` reads the DataFrame from `storage`, validates that the `input_key` column exists and the `output_key` column does not, then extracts and flattens all rows' triple lists. For each triple, the operator uses a regular expression to parse the subject, object, and relation, builds a NetworkX directed graph, and renders it as an interactive HTML file written to disk via PyVis. If no valid triples are found in the graph, the operator logs a warning and skips rendering.

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow storage object. The operator reads the `dataframe` from it. |
| `input_key` | `str` | `"triple"` | Input triple column name. Each cell should be a `List[str]` of triples. |
| `output_key` | `str` | `"kg_visualization"` | Output column name (the actual rendered result is written to an HTML file in the current version; this name is used for conflict validation). |

---

## 🤖 Example Usage
```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.general_kg.eval.kg_rel_triple_nx_visual import (
    KGRelationTripleVisualization,
)

operator = KGRelationTripleVisualization(
    seed=42,
    lang="en",
)
operator.run(
    storage=storage,
    input_key="triple",
    output_key="kg_visualization",
)
```

---

#### Default Output Format
| Field | Type | Description |
| :-- | :-- | :-- |
| `triple` | `List[str]` | Input triple list in `<subj> ... <obj> ... <rel> ...` format. |
| HTML file | `str` (file path) | Output interactive knowledge graph visualization file, openable in a browser. |

---

#### Example Input
```json
[
  {
    "triple": [
      "<subj> Newton <obj> gravity <rel> discovered",
      "<subj> Newton <obj> Cambridge <rel> studiedAt",
      "<subj> gravity <obj> Earth <rel> affects"
    ]
  }
]
```

#### Example Output

The operator generates an HTML file (default path specified internally in the code). When opened in a browser, the interactive graph shows:

- Nodes: `Newton` (high frequency, larger node), `gravity`, `Cambridge`, `Earth`
- Directed edges with relation labels: `discovered`, `studiedAt`, `affects`
- Interactive features: drag, zoom, hover to view entity frequency

---

#### Related Links
- Operator implementation: `DataFlow-KG/dataflow/operators/general_kg/eval/kg_rel_triple_nx_visual.py`
- Dependencies: [NetworkX](https://networkx.org/), [PyVis](https://pyvis.readthedocs.io/)