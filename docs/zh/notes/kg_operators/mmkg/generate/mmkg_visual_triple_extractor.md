---
title: MMKGVisualTripleExtraction
createTime: 2026/04/07 09:00:00
permalink: /zh/kg_operators/mmkg/generate/mmkg_visual_triple_extractor/
---

## 📚 概述

`MMKGVisualTripleExtraction` 根据 `img_dict` 和候选实体列 `entity` 抽取视觉三元组。对每张图片，prompt 要求模型先返回一段 JSON，格式固定为：

```json
{
  "entity": ["实体1", "实体2"],
  "quality_score": 0
}
```

算子随后只保留 JSON 里命中候选实体列表的实体，并把它们转换成 `<subj> 实体 <rel> depicted_in <obj> 图片ID` 写回 `vis_triple`。如果模型返回的 JSON 解析失败，或者 `quality_score` 小于 `quality_threshold`，该图片不会产出三元组。

## ✒️ `__init__` 函数

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
| `llm_serving` | `LLMServingABC` | - | 视觉语言模型服务，必须实现 `generate_from_input_multi_images` |
| `quality_threshold` | `int` | `3` | 视觉识别质量阈值；低于该分数的结果会被过滤 |
| `lang` | `str` | `"en"` | 提示词语言，传给 `MMKGVisualTripleExtractionPrompt` |

## 💡 `run` 函数

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
| `input_key` | `str` | `"img_dict"` | 图片字典列，格式通常为 `{图片ID: 图片路径或 URL}` |
| `input_key_meta` | `str` | `"entity"` | 候选实体列，支持 `list[str]` 或逗号分隔字符串 |
| `output_key` | `str` | `"vis_triple"` | 输出列名，每行写入算子转换后的 `list[str]` |

如果 `img_dict` 是字符串，算子会先尝试按 JSON 解析；如果 `entity` 是字符串，算子会按英文逗号切分。函数返回值为 `[output_key]`，真正落盘的是转换后的 `vis_triple`，而不是模型原始 JSON。

## 🤖 示例用法

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
    lang="en",
)
op.run(
    storage=storage,
    input_key="img_dict",
    input_key_meta="entity",
    output_key="vis_triple",
)
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

单张图片的模型原始返回示例：

```json
{
  "entity": ["Albert Einstein"],
  "quality_score": 9
}
```

算子写回 `storage` 的输出示例：

```json
{
  "vis_triple": [
    "<subj> Albert Einstein <rel> depicted_in <obj> img_einstein",
    "<subj> Paris <rel> depicted_in <obj> img_paris"
  ]
}
```
