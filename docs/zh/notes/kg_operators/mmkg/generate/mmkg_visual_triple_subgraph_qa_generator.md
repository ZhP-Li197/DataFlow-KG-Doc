---
title: MMKGSubgraphBaseQAGeneration
createTime: 2026/04/07 09:00:00
permalink: /zh/kg_operators/mmkg/generate/mmkg_visual_triple_subgraph_qa_generator/
---

#### 📚 概述

`MMKGSubgraphBaseQAGeneration` 根据子图和对应图片生成多模态 QA。与路径版不同，它直接消费 `subgraph` 列，更适合围绕视觉锚点构造局部推理题。

#### 📚 `__init__` 函数

```python
def __init__(self, llm_serving: LLMServingABC, lang: str = "en"):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 需要支持多图输入的视觉语言模型服务 |
| `lang` | `str` | `"en"` | 提示词语言 |

#### 💡 `run` 函数

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
| `input_key` | `str` | `"vis_url"` | 图片 URL 或路径列表列 |
| `input_key_meta` | `str` | `"subgraph"` | 子图列 |
| `output_key` | `str` | `"QA_pairs"` | 写回问答对的列名 |

#### 🤖 示例用法

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

输出示例：

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
