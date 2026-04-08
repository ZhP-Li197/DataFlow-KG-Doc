---
title: MMKGEntityLink2ImgUrl
createTime: 2026/04/07 09:00:00
permalink: /zh/kg_operators/mmkg/refine/mmkg_entity_link2img/
---

## 📚 概述

`MMKGEntityLink2ImgUrl` 为实体列表补充百科链接，并在满足条件时继续补一张代表图片链接。它会先搜索 Wikipedia 标题并做模糊匹配，再用 Wikidata 的 `P18` 属性拼出 `commons.wikimedia.org` 的图片地址。

输入实体既支持 `list[str]`，也支持 JSON 字符串或逗号分隔字符串。输出列 `linked_result` 的每个元素都是格式化字符串：`<entity> 实体名 <link> wiki_url [<image> image_url]`。该算子依赖外网访问 Wikipedia、Wikidata 和 Wikimedia Commons。

## ✒️ `__init__` 函数

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
| `user_agent` | `str` | `"DataFlow/1.0"` | 访问 Wikipedia/Wikidata 时使用的请求头 |
| `max_retries` | `int` | `3` | 请求失败后的最大重试次数 |
| `retry_delay` | `float` | `1.0` | 重试间隔，单位为秒 |
| `wiki_lang` | `str` | `"en"` | Wikipedia 语言，例如 `"en"`、`"zh"` |
| `visualizable_types` | `Optional[List[str]]` | `None` | 预留参数；当前实现会保存它，但图片抓取实际依赖 `_is_visualizable` 的大小写启发式判断 |

## 💡 `run` 函数

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
| `input_key` | `str` | `"entity"` | 实体列名，支持列表、JSON 字符串或逗号分隔字符串 |
| `output_key` | `str` | `"linked_result"` | 输出列名，每行写入 `list[str]` |

代码会逐实体执行“Wikipedia 搜索 -> 最佳标题匹配 -> 可视化实体判定 -> Wikidata 图片查询”这条流程；任一步失败，该实体就不会写入结果。

## 🤖 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.multi_model_kg.refine.mmkg_entity_link2img import MMKGEntityLink2ImgUrl

storage = FileStorage(
    first_entry_file_name="mmkg_entity_input.json",
    cache_path="./cache",
    file_name_prefix="mmkg_entity_link",
    cache_type="json",
).step()

op = MMKGEntityLink2ImgUrl(wiki_lang="en")
op.run(storage=storage, input_key="entity", output_key="linked_result")
```

输入示例：

```json
{
  "entity": ["Albert Einstein"]
}
```

输出示例：

```json
{
  "linked_result": [
    "<entity> Albert Einstein <link> https://en.wikipedia.org/wiki/Albert_Einstein <image> https://commons.wikimedia.org/wiki/Special:FilePath/Einstein_1921_by_F_Schmutzer_-_restoration.jpg"
  ]
}
```
