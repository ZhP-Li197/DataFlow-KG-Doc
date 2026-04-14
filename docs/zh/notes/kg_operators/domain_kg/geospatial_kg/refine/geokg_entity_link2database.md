---
title: GeoKGEntityLink2Database
createTime: 2026/04/13 09:00:00
permalink: /zh/kg_operators/domain_kg/geospatial_kg/refine/geokg_entity_link2database/
---

## 📚 概述

`GeoKGEntityLink2Database` 用于将地理图谱条目中的实体链接到 GeoNames。它会自动识别输入条目是关系型还是属性型，再提取需要链接的实体，并输出统一格式：

`<entity> 实体名 <link> GeoNamesURL`

如果未找到可用候选，链接结果会写成 `NA`。

## ✒️ `__init__` 函数

```python
def __init__(
    self,
    geonames_username: str = "dataflow_kg",
    max_candidates: int = 5,
    similarity_threshold: float = 0.5,
    request_timeout: int = 10,
):
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `geonames_username` | `str` | `"dataflow_kg"` | GeoNames 用户名 |
| `max_candidates` | `int` | `5` | 每次检索最多返回的候选数 |
| `similarity_threshold` | `float` | `0.5` | 候选相似度阈值 |
| `request_timeout` | `int` | `10` | 网络请求超时时间，单位秒 |

## 💡 `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage = None,
    input_key: str = "tuple",
    output_key: str = "linked_result",
) -> List[str]:
    ...
```

| 参数 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | `None` | 输入输出存储对象 |
| `input_key` | `str` | `"tuple"` | 图谱条目列名 |
| `output_key` | `str` | `"linked_result"` | 实体链接结果列名 |

算子会先把单元格规范成 `List[str]`，再抽取实体并逐个请求 GeoNames。最终每一行输出一个 `list[str]`，每个元素都形如 `<entity> Name <link> URL`。

## 🤖 示例用法

```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.domain_kg.geospatial_kg.refine.geokg_entity_link2database import (
    GeoKGEntityLink2Database,
)

storage = DummyStorage()
storage.set_data([
    {
        "tuple": [
            "<subj> Wuhan <obj> Hubei <rel> located_in <time> NA",
            "<subj> Yangtze River <obj> East China Sea <rel> flows_into <time> NA"
        ]
    }
])

op = GeoKGEntityLink2Database()
op.run(storage=storage)
```

#### 输入示例

```json
{
  "tuple": [
    "<subj> Wuhan <obj> Hubei <rel> located_in <time> NA",
    "<subj> Yangtze River <obj> East China Sea <rel> flows_into <time> NA"
  ]
}
```

#### 输出示例

```json
{
  "linked_result": [
    "<entity> Wuhan <link> https://www.geonames.org/1791247",
    "<entity> Hubei <link> https://www.geonames.org/1806949",
    "<entity> Yangtze River <link> https://www.geonames.org/1788201",
    "<entity> East China Sea <link> https://www.geonames.org/1814991"
  ]
}
```


