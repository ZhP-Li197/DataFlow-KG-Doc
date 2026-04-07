---
title: MMKGVisualTripleExtraction
createTime: 2026/04/07 09:00:00
permalink: /zh/kg_operators/mmkg/generate/mmkg_visual_triple_extractor/
---

#### 📚 概述

`MMKGVisualTripleExtraction` 根据图片和候选实体列表抽取视觉三元组，输出统一采用 `<subj> 实体 <rel> depicted_in <obj> 图片ID` 的格式。它会逐张图片调用支持多模态输入的模型，并用 `quality_threshold` 过滤低质量识别结果。

#### 📚 `__init__` 函数

```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    quality_threshold: int = 3,
    lang: str = "en"
):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | - | 需要支持多图输入的视觉语言模型服务 |
| `quality_threshold` | `int` | `3` | 小于该分数的识别结果会被丢弃 |
| `lang` | `str` | `"en"` | 提示词语言 |

#### 💡 `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "img_dict",
    input_key_meta: str = "entity",
    output_key: str = "vis_triple"
) -> List[str]:
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | 输入输出存储对象 |
| `input_key` | `str` | `"img_dict"` | 图片字典列，格式通常为 `{图片ID: 图片URL或路径}` |
| `input_key_meta` | `str` | `"entity"` | 候选实体列 |
| `output_key` | `str` | `"vis_triple"` | 写回视觉三元组的列名 |

如果实体列是字符串，算子会按逗号切分；如果图片字典是字符串，算子会尝试先解析为 JSON。

#### 🤖 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.multi_model_kg.generate.mmkg_visual_triple_extractor import MMKGVisualTripleExtraction

storage = FileStorage(
    first_entry_file_name="mmkg_visual_input.json",
    cache_path="./cache",
    file_name_prefix="mmkg_visual_extract",
    cache_type="json",
).step()

op = MMKGVisualTripleExtraction(
    llm_serving=llm_serving,
    quality_threshold=5,
    lang="en"
)
op.run(storage=storage, input_key="img_dict", input_key_meta="entity", output_key="vis_triple")
```

输入示例：

```json
{
  "img_dict": {
    "img_einstein": "./images/einstein.jpg",
    "img_paris": "./images/paris.jpg"
  },
  "entity": ["Albert Einstein", "Paris", "London"]
}
```

输出示例：

```json
{
  "vis_triple": [
    "<subj> Albert Einstein <rel> depicted_in <obj> img_einstein",
    "<subj> Paris <rel> depicted_in <obj> img_paris"
  ]
}
```
