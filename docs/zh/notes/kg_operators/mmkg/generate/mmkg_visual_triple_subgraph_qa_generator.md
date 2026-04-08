---
title: MMKGSubgraphBaseQAGeneration
createTime: 2026/04/07 09:00:00
permalink: /zh/kg_operators/mmkg/generate/mmkg_visual_triple_subgraph_qa_generator/
---

## 📚 概述

`MMKGSubgraphBaseQAGeneration` 根据子图和视觉证据生成多模态问答对。它会固定读取 `vis_triple` 列，再把 `vis_triple` 和 `vis_url` 按顺序配对成图片字典，对每张图片分别生成 QA，最后合并到 `QA_pairs`。

`subgraph` 既可以是 `list[str]`，也可以是按换行分隔的字符串；如果输入是字符串，代码会先按 `\n` 切分。

## ✒️ `__init__` 函数

```python
def __init__(self, llm_serving: LLMServingABC, lang: str = "en"):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 支持多图输入的视觉语言模型服务 |
| `lang` | `str` | `"en"` | 提示词语言 |

## 💡 `run` 函数

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

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | 输入输出存储对象 |
| `input_key` | `str` | `"vis_url"` | 图片 URL 或图片路径列 |
| `input_key_meta` | `str` | `"subgraph"` | 子图列名，支持列表或换行字符串 |
| `output_key` | `str` | `"QA_pairs"` | 输出问答对列名 |

算子始终读取名为 `vis_triple` 的列；如果 `vis_triple` 和 `vis_url` 数量不一致，只有可以配对上的部分会参与生成。

## 🤖 示例用法

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

输入示例：

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

输出示例：

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
