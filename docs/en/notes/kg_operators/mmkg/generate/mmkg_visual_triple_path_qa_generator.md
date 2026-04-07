---
title: MMKGPathBaseQAGeneration
createTime: 2026/04/07 09:00:00
permalink: /en/kg_operators/mmkg/generate/mmkg_visual_triple_path_qa_generator/
---

#### 📚 Overview

`MMKGPathBaseQAGeneration` generates multimodal QA pairs from path facts and their corresponding images. It resolves image IDs from `vis_triple`, combines them with `vis_url` and path columns such as `2_hop_paths`, and produces QA pairs that depend on both graph structure and visual evidence.

#### 📚 `__init__` Function

```python
def __init__(self, llm_serving: LLMServingABC, lang: str = "en", hop=2):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | Vision-language serving backend that supports multi-image input |
| `lang` | `str` | `"en"` | Prompt language |
| `hop` | `int` | `2` | Path hop count; controls dynamic column names such as `2_hop_paths` and `2_QA_pairs` |

#### 💡 `run` Function

```python
def run(
    self,
    storage: DataFlowStorage,
    input_key="vis_url",
    input_key_meta="hop_paths",
    output_key_meta="QA_pairs"
) -> List[str]:
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Input/output storage object |
| `input_key` | `str` | `"vis_url"` | Column containing image URLs or image paths |
| `input_key_meta` | `str` | `"hop_paths"` | Combined with `hop` to form the real input column, such as `2_hop_paths` |
| `output_key_meta` | `str` | `"QA_pairs"` | Combined with `hop` to form the real output column, such as `2_QA_pairs` |

#### 🤖 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.multi_model_kg.generate.mmkg_visual_triple_path_qa_generator import MMKGPathBaseQAGeneration

storage = FileStorage(
    first_entry_file_name="mmkg_path_input.json",
    cache_path="./cache",
    file_name_prefix="mmkg_path_qa",
    cache_type="json",
).step()

op = MMKGPathBaseQAGeneration(llm_serving=llm_serving, hop=2, lang="en")
op.run(storage=storage, input_key="vis_url", input_key_meta="hop_paths", output_key_meta="QA_pairs")
```

Example input:

```json
{
  "2_hop_paths": "<subj> Albert Einstein <obj> Nobel Prize in Physics <rel> won || <subj> Nobel Prize in Physics <obj> 1921 <rel> awarded_in",
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
  "2_QA_pairs": [
    {
      "question": "Based on the image, in which year was the prize won by this person awarded?",
      "answer": "It was awarded in 1921."
    }
  ]
}
```
