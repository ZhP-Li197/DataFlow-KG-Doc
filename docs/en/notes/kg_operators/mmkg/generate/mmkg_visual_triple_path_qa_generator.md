---
title: MMKGPathBaseQAGeneration
createTime: 2026/04/07 09:00:00
permalink: /en/kg_operators/mmkg/generate/mmkg_visual_triple_path_qa_generator/
---

## 📚 Overview

`MMKGPathBaseQAGeneration` generates multimodal QA pairs from path facts and visual evidence. The operator always reads the `vis_triple` column, zips `vis_triple` with `vis_url`, and rebuilds an `img_dict` by taking the image ID from the last token of each visual triple.

When `hop=1`, the input column becomes `triple` and the output column becomes `1_QA_pairs`. When `hop>1`, the input column is `f"{hop}_{input_key_meta}"` and the output column is `f"{hop}_{output_key_meta}"`.

## ✒️ `__init__` Function

```python
def __init__(self, llm_serving: LLMServingABC, lang: str = "en", hop=2):
    ...
```

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | Vision-language serving backend that supports multi-image input |
| `lang` | `str` | `"en"` | Prompt language |
| `hop` | `int` | `2` | Hop count that determines the real input and output column names |

## 💡 `run` Function

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
| `input_key_meta` | `str` | `"hop_paths"` | Base name of the path column; combined with `hop` to form the real input column |
| `output_key_meta` | `str` | `"QA_pairs"` | Base name of the output column; combined with `hop` to form the real output column |

The operator always reads `vis_triple` and rebuilds the image mapping with `zip(vis_triple, vis_url)`, so if the two columns have different lengths, only the paired prefix is used.

## 🤖 Example Usage

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
op.run(
    storage=storage,
    input_key="vis_url",
    input_key_meta="hop_paths",
    output_key_meta="QA_pairs",
)
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
