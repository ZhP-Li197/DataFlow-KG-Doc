---
title: MMKGSubgraphBaseQAGeneration
createTime: 2026/04/07 09:00:00
permalink: /en/kg_operators/mmkg/generate/mmkg_visual_triple_subgraph_qa_generator/
---

#### 📚 Overview

`MMKGSubgraphBaseQAGeneration` generates multimodal QA pairs from subgraphs and their corresponding images. Unlike the path-based version, it directly consumes the `subgraph` column and is better suited for local reasoning tasks around visual anchors.

#### 📚 `__init__` Function

```python
def __init__(self, llm_serving: LLMServingABC, lang: str = "en"):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | Vision-language serving backend that supports multi-image input |
| `lang` | `str` | `"en"` | Prompt language |

#### 💡 `run` Function

```python
def run(
    self,
    storage: DataFlowStorage,
    input_key="vis_url",
    input_key_meta="subgraph",
    output_key="QA_pairs"
) -> List[str]:
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Input/output storage object |
| `input_key` | `str` | `"vis_url"` | Column containing image URLs or image paths |
| `input_key_meta` | `str` | `"subgraph"` | Column containing the subgraph |
| `output_key` | `str` | `"QA_pairs"` | Output column for generated QA pairs |

#### 🤖 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.multi_model_kg.generate.mmkg_visual_triple_subgraph_qa_generator import MMKGSubgraphBaseQAGeneration

storage = FileStorage(
    first_entry_file_name="mmkg_subgraph_input.json",
    cache_path="./cache",
    file_name_prefix="mmkg_subgraph_qa",
    cache_type="json",
).step()

op = MMKGSubgraphBaseQAGeneration(llm_serving=llm_serving, lang="en")
op.run(storage=storage, input_key="vis_url", input_key_meta="subgraph", output_key="QA_pairs")
```

Example input:

```json
{
  "subgraph": [
    "<subj> Albert Einstein <obj> Princeton University <rel> worked_at",
    "<subj> Albert Einstein <obj> Nobel Prize in Physics <rel> won"
  ],
  "vis_triple": [
    "<subj> Albert Einstein <rel> depicted_in <obj> img_einstein"
  ],
  "vis_url": [
    "./images/einstein.jpg"
  ]
}
```

Example output:

```json
{
  "QA_pairs": [
    {
      "question": "Based on the person shown in the image, what major prize did he win?",
      "answer": "He won the Nobel Prize in Physics."
    }
  ]
}
```
