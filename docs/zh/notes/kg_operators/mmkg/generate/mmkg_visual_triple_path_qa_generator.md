---
title: MMKGPathBaseQAGeneration
createTime: 2026/04/07 09:00:00
permalink: /zh/kg_operators/mmkg/generate/mmkg_visual_triple_path_qa_generator/
---

#### 📚 概述

`MMKGPathBaseQAGeneration` 基于路径事实和对应图片生成多模态 QA。它会从 `vis_triple` 中解析图片 ID，再和 `vis_url`、`2_hop_paths` 这样的路径列组合，生成依赖图结构和视觉信息的问答对。

#### 📚 `__init__` 函数

```python
def __init__(self, llm_serving: LLMServingABC, lang: str = "en", hop=2):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 需要支持多图输入的视觉语言模型服务 |
| `lang` | `str` | `"en"` | 提示词语言 |
| `hop` | `int` | `2` | 路径跳数；决定实际读取列和输出列，如 `2_hop_paths`、`2_QA_pairs` |

#### 💡 `run` 函数

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
| `input_key` | `str` | `"vis_url"` | 图片 URL 或路径列表列 |
| `input_key_meta` | `str` | `"hop_paths"` | 与 `hop` 拼接后的真实路径列名，如 `2_hop_paths` |
| `output_key_meta` | `str` | `"QA_pairs"` | 与 `hop` 拼接后的真实输出列名，如 `2_QA_pairs` |

#### 🤖 示例用法

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

输入示例：

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
