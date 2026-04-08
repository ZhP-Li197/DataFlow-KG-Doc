---
title: MMKGSubgraphBaseQAGeneration
createTime: 2026/04/07 09:00:00
permalink: /en/kg_operators/mmkg/generate/mmkg_visual_triple_subgraph_qa_generator/
---

## 📚 Overview

`MMKGSubgraphBaseQAGeneration` generates multimodal QA pairs from a subgraph and visual evidence. It always reads the `vis_triple` column, pairs `vis_triple` with `vis_url`, and builds an image dictionary before generating QA for each image and merging everything into `QA_pairs`.

`subgraph` can be either a `list[str]` or a newline-separated string. If the input is a string, the code splits it by `\n` first.

## ✒️ `__init__` Function

```python
def __init__(self, llm_serving: LLMServingABC, lang: str = "en"):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | Vision-language serving backend that supports multi-image input |
| `lang` | `str` | `"en"` | Prompt language |

## 💡 `run` Function

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
| `input_key_meta` | `str` | `"subgraph"` | Subgraph column; supports either a list or a newline-separated string |
| `output_key` | `str` | `"QA_pairs"` | Output QA pair column |

The operator always reads the column named `vis_triple`. If `vis_triple` and `vis_url` have different lengths, only the paired items participate in generation.

## 🤖 Example Usage

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
    "<subj> Albert Einstein <obj> Nobel Prize in Physics <rel> won",
    "<subj> Nobel Prize in Physics <obj> 1921 <rel> awarded_in"
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
      "question": "Based on the image, in which year was the prize won by this person awarded?",
      "answer": "It was awarded in 1921."
    }
  ]
}
```
