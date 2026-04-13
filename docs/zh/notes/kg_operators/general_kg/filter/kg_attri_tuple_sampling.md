---
title: KGAttributeTupleSampler
createTime: 2026/04/10 15:40:44
permalink: /zh/kg_operators/general_kg/sample/kg_attri_tuple_sampling/
---

## 📚 概述
`KGAttributeTupleSampler` 是一个用于对实体属性多元组进行分组采样的采样类算子。
它会将输入的属性多元组按实体或属性分组，对组数和每组元组数量进行可选截断，最终将每组多元组作为一个子图输出。

这个算子的几个关键特点如下：

- 无需 `LLMServingABC`，是纯规则采样算子，不依赖大模型
- 支持两种分组模式：`group_by="entity"` 按实体聚合，`group_by="attribute"` 按属性聚合
- 支持通过 `max_groups` 限制最大输出组数，通过 `max_per_group` 限制每组最多元组数
- 当 DataFrame 为多行时，自动合并所有行的元组后统一处理；单行时直接使用该行数据
- 输入列同时兼容 `tuple` 和 `triple` 列名，优先使用 `run` 中指定的 `input_key`
- 输出不再保持原 DataFrame 的行结构，而是将每个分组作为新的一行输出

---

## ✒️ __init__ 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC = None,
    seed: int = 0,
    lang: str = "en",
    group_by: str = "entity",
    max_groups: int = None,
    max_per_group: int = None,
):
    ...
```

#### `__init__` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | `None` | 本算子不使用大模型，该参数仅为兼容接口预留，传入后不生效。 |
| `seed` | `int` | `0` | 随机种子，用于控制组数截断和每组元组截断时的随机打乱顺序。 |
| `lang` | `str` | `"en"` | 语言设置，当前版本未影响实际处理逻辑。 |
| `group_by` | `str` | `"entity"` | 分组依据。`"entity"` 按实体聚合同一实体的所有属性；`"attribute"` 按属性聚合相同属性的所有实体记录。 |
| `max_groups` | `int` | `None` | 最大输出组数。若为 `None` 则输出所有分组；设置后将随机打乱后取前 N 组。 |
| `max_per_group` | `int` | `None` | 每组最多保留的元组数量。若为 `None` 则保留组内全部元组；设置后将随机打乱后取前 N 条。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "tuple",
    output_key: str = "subgraph",
):
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，并按以下规则确定输入列：优先使用 `input_key` 指定的列，若不存在则依次回退到 `tuple`、`triple` 列。随后根据 DataFrame 行数决定处理方式：单行时直接使用该行数据，多行时合并所有行的元组列表后统一处理。对合并后的元组列表调用 `_group_and_sample()` 完成分组与采样，最终将每个分组作为新 DataFrame 的一行写出，输出列名由 `output_key` 指定。

> 注意：输出的 DataFrame 行数等于分组数量，与输入 DataFrame 的行数无关。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将采样结果写入新 DataFrame 后输出。 |
| `input_key` | `str` | `"tuple"` | 输入属性多元组列名。每个单元格应为 `List[str]` 格式的属性多元组列表。 |
| `output_key` | `str` | `"subgraph"` | 输出子图列名。新 DataFrame 中每行对应一个分组，存储该组内的元组列表。 |

---

## 🤖 示例用法
```python
from dataflow.operators.general_kg.sample.kg_attri_tuple_sampling import (
    KGAttributeTupleSampler,
)

operator = KGAttributeTupleSampler(
    seed=42,
    group_by="entity",
    max_groups=100,
    max_per_group=10,
)
operator.run(
    storage=storage,
    input_key="tuple",
    output_key="subgraph",
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `subgraph` | `List[str]` | 该分组内所有属性多元组的原始字符串列表，每行对应一个实体（或属性）分组。 |

---

#### 示例输入
```json
[
  {
    "tuple": [
      "<entity> Henry <attribute> occupation <value> singer <time> 2018",
      "<entity> Henry <attribute> nationality <value> British",
      "<entity> Lucy <attribute> occupation <value> writer",
      "<entity> Lucy <attribute> award <value> Booker Prize <time> 2020"
    ]
  }
]
```

#### 示例输出（`group_by="entity"`）
```json
[
  {
    "subgraph": [
      "<entity> Henry <attribute> occupation <value> singer <time> 2018",
      "<entity> Henry <attribute> nationality <value> British"
    ]
  },
  {
    "subgraph": [
      "<entity> Lucy <attribute> occupation <value> writer",
      "<entity> Lucy <attribute> award <value> Booker Prize <time> 2020"
    ]
  }
]
```

---

#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/general_kg/sample/kg_attri_tuple_sampling.py`