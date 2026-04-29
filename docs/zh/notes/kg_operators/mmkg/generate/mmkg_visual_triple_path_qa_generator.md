---
title: MMKGPathBaseQAGeneration
createTime: 2026/04/07 09:00:00
permalink: /zh/kg_operators/mmkg/generate/mmkg_visual_triple_path_qa_generator/
---

## 📚 概述

`MMKGPathBaseQAGeneration` 根据路径事实和视觉证据生成多模态问答对。算子会固定读取 `vis_triple` 列，再将 `vis_triple` 与 `vis_url` 按顺序配对，利用视觉三元组最后一个 token 中的图片 ID 重建 `img_dict`。

当 `hop=1` 时，输入列会被切换为 `triple`，输出列会写成 `1_QA_pairs`；当 `hop>1` 时，输入列为 `f"{hop}_{input_key_meta}"`，输出列为 `f"{hop}_{output_key_meta}"`。

## ✒️ `__init__` 函数

```python
def __init__(self, llm_serving: LLMServingABC, lang: str = "en", hop=2):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 支持多图输入的视觉语言模型服务 |
| `lang` | `str` | `"en"` | 提示词语言 |
| `hop` | `int` | `2` | 路径跳数，同时决定真实输入列和输出列名称 |

## 💡 `run` 函数

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

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | 输入输出存储对象 |
| `input_key` | `str` | `"vis_url"` | 图片 URL 或图片路径列 |
| `input_key_meta` | `str` | `"hop_paths"` | 路径列基名；会和 `hop` 拼成真实输入列 |
| `output_key_meta` | `str` | `"QA_pairs"` | 输出列基名；会和 `hop` 拼成真实输出列 |

算子固定读取 `vis_triple` 列，并通过 `zip(vis_triple, vis_url)` 重建图片映射，所以这两列长度不一致时会以较短的一侧为准。

## 🤖 示例用法

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

输入示例：

```json
{
  "2_hop_paths": "<subj> Albert Einstein <obj> Nobel Prize in Physics <rel> won || <subj> Nobel Prize in Physics <obj> 1921 <rel> awarded_in",
  "vis_triple": [
    "<subj> Albert Einstein <obj> img_einstein <rel> depicted_in"
  ],
  "vis_url": [
    "./images/einstein.jpg"
  ]
}
```

输出示例：

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
