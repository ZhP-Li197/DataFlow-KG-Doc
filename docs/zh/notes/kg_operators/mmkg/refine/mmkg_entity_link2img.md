---
title: MMKGEntityLink2ImgUrl
createTime: 2026/04/07 09:00:00
permalink: /zh/kg_operators/mmkg/refine/mmkg_entity_link2img/
---

#### 📚 概述

`MMKGEntityLink2ImgUrl` 为文本实体补齐百科链接，并在可视化实体上追加代表图片链接。输出格式是字符串列表，每项通常形如 `<entity> 实体名 <link> wiki_url [<image> image_url]`。

#### 📚 `__init__` 函数

```python
def __init__(
    self,
    user_agent: str = "DataFlow/1.0",
    max_retries: int = 3,
    retry_delay: float = 1.0,
    wiki_lang: str = "en",
    visualizable_types: Optional[List[str]] = None
):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `user_agent` | `str` | `"DataFlow/1.0"` | 请求百科接口时使用的 User-Agent |
| `max_retries` | `int` | `3` | 检索失败后的最大重试次数 |
| `retry_delay` | `float` | `1.0` | 每次重试之间的等待时间 |
| `wiki_lang` | `str` | `"en"` | Wikipedia 语言版本 |
| `visualizable_types` | `Optional[List[str]]` | `None` | 预留实体类型列表；当前实现主要依据实体名称形式判断是否追加图片 |

#### 💡 `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "entity",
    output_key: str = "linked_result"
):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | 输入输出存储对象 |
| `input_key` | `str` | `"entity"` | 实体列，支持列表、JSON 字符串或逗号分隔字符串 |
| `output_key` | `str` | `"linked_result"` | 输出列名 |

#### 🤖 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.multi_model_kg.refine.mmkg_entity_link2img import MMKGEntityLink2ImgUrl

storage = FileStorage(
    first_entry_file_name="mmkg_entity_input.json",
    cache_path="./cache",
    file_name_prefix="mmkg_link_img",
    cache_type="json",
).step()

op = MMKGEntityLink2ImgUrl(wiki_lang="en")
op.run(storage=storage, input_key="entity", output_key="linked_result")
```

输入示例：

```json
{
  "entity": ["Albert Einstein", "Paris"]
}
```

输出示例：

```json
{
  "linked_result": [
    "<entity> Albert Einstein <link> https://en.wikipedia.org/wiki/Albert_Einstein",
    "<entity> Paris <link> https://en.wikipedia.org/wiki/Paris"
  ]
}
```
