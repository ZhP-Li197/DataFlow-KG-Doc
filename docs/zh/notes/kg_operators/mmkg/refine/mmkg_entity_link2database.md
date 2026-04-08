---
title: MMKGImgDictLink2WikiSimple
createTime: 2026/04/07 09:00:00
permalink: /zh/kg_operators/mmkg/refine/mmkg_entity_link2database/
---

## 📚 概述

`MMKGImgDictLink2WikiSimple` 直接把 `img_dict` 中的图片 ID 映射到 Wikidata 实体 URL。输出列 `linked_result` 中的每个元素都是一个字典，形如 `{"img": 图片ID, "wikidata_url": "https://www.wikidata.org/wiki/Q..."}`。

如果调用 `run` 时传入了 `img_entity_mapping`，算子会优先使用这份映射；否则它会把图片键名按 `img_` 前缀去掉、下划线转空格、首字母大写的规则，自动猜测实体名。该算子依赖外网访问 Wikidata。

## ✒️ `__init__` 函数

```python
def __init__(
    self,
    user_agent: str = "DataFlow/1.0",
    max_retries: int = 3,
    retry_delay: float = 1.0,
):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `user_agent` | `str` | `"DataFlow/1.0"` | 访问 Wikidata 时使用的请求头 |
| `max_retries` | `int` | `3` | 请求失败后的最大重试次数 |
| `retry_delay` | `float` | `1.0` | 重试间隔，单位为秒 |

## 💡 `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage,
    input_key_img: str = "img_dict",
    output_key: str = "linked_result",
    img_entity_mapping: Dict[str, str] = None
) -> List[str]:
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | 输入输出存储对象 |
| `input_key_img` | `str` | `"img_dict"` | 图片字典列，格式为 `{图片ID: 图片路径或 URL}` |
| `output_key` | `str` | `"linked_result"` | 输出列名，每行写入 `list[dict]` |
| `img_entity_mapping` | `Dict[str, str] \| None` | `None` | 可选的图片 ID 到实体名映射；提供后会覆盖默认猜测逻辑 |

若实体搜索失败，算子仍会保留该图片 ID，但把 `wikidata_url` 写成 `None`。

## 🤖 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.multi_model_kg.refine.mmkg_entity_link2database import MMKGImgDictLink2WikiSimple

storage = FileStorage(
    first_entry_file_name="mmkg_img_input.json",
    cache_path="./cache",
    file_name_prefix="mmkg_img_link",
    cache_type="json",
).step()

op = MMKGImgDictLink2WikiSimple()
op.run(
    storage=storage,
    input_key_img="img_dict",
    output_key="linked_result",
    img_entity_mapping={
        "img_einstein": "Albert Einstein",
        "img_paris": "Paris"
    },
)
```

输入示例：

```json
{
  "img_dict": {
    "img_einstein": "./images/einstein.jpg",
    "img_paris": "./images/paris.jpg"
  }
}
```

输出示例：

```json
{
  "linked_result": [
    {
      "img": "img_einstein",
      "wikidata_url": "https://www.wikidata.org/wiki/Q937"
    },
    {
      "img": "img_paris",
      "wikidata_url": "https://www.wikidata.org/wiki/Q90"
    }
  ]
}
```
