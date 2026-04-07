---
title: MMKGImgDictLink2WikiSimple
createTime: 2026/04/07 09:00:00
permalink: /zh/kg_operators/mmkg/refine/mmkg_entity_link2database/
---

#### 📚 概述

`MMKGImgDictLink2WikiSimple` 把 `img_dict` 中的图片映射到 Wikidata 实体链接。它可以直接使用 `img_entity_mapping` 指定“图片ID -> 实体名”的映射；如果没有提供映射，就会根据图片 ID 自动生成实体名再检索 Wikidata。

#### 📚 `__init__` 函数

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
| `user_agent` | `str` | `"DataFlow/1.0"` | 请求 Wikidata 时使用的 User-Agent |
| `max_retries` | `int` | `3` | 检索失败后的最大重试次数 |
| `retry_delay` | `float` | `1.0` | 每次重试之间的等待时间 |

#### 💡 `run` 函数

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
| `input_key_img` | `str` | `"img_dict"` | 图片字典列 |
| `output_key` | `str` | `"linked_result"` | 输出列名 |
| `img_entity_mapping` | `Dict[str, str]` | `None` | 手动指定图片 ID 对应的实体名 |

输出列中的每一项通常是列表，列表元素形如 `{"img": 图片ID, "wikidata_url": 链接}`。

#### 🤖 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.multi_model_kg.refine.mmkg_entity_link2database import MMKGImgDictLink2WikiSimple

storage = FileStorage(
    first_entry_file_name="mmkg_link_input.json",
    cache_path="./cache",
    file_name_prefix="mmkg_link_wiki",
    cache_type="json",
).step()

op = MMKGImgDictLink2WikiSimple()
op.run(
    storage=storage,
    input_key_img="img_dict",
    output_key="linked_result",
    img_entity_mapping={"img_einstein": "Albert Einstein", "img_paris": "Paris"}
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
    {"img": "img_einstein", "wikidata_url": "https://www.wikidata.org/wiki/Q937"},
    {"img": "img_paris", "wikidata_url": "https://www.wikidata.org/wiki/Q90"}
  ]
}
```
