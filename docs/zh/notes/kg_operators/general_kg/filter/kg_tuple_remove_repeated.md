---
title: KGTupleRemoveRepeated
createTime: 2026/04/10 15:40:44
permalink: /zh/kg_operators/general_kg/filter/kg_tuple_remove_repeated/
---

## 📚 概述
`KGTupleRemoveRepeated` 是一个用于清洗和去重知识图谱三元组或多元组的过滤类算子。
它会将输入 DataFrame 中所有行的元组列表展平后合并，删除完全相同的元组字符串，最终将去重后的结果以单行形式写出。

这个算子的几个关键特点如下：

- 无需 `LLMServingABC`，是纯字符串去重算子，不依赖大模型
- 去重策略为**严格精确匹配**：仅删除完全相同的字符串，不做语义归并
- 同时支持关系型三元组（`<subj>...<obj>...<rel>...`）、属性型三元组（`<entity>...<attribute>...<value>...`）及任意带 `<tag>` 标记的多元组
- 跨行展平后统一去重，最终输出为**单行** DataFrame（输出行数固定为 1）
- 输入列自动回退：优先使用 `input_key` 指定的列，依次回退到 `triple`、`tuple`
- 输出列名默认与输入列名相同（即原地覆盖），可通过 `output_key` 参数自定义

---

## ✒️ __init__ 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC = None,
    seed: int = 0,
    lang: str = "en",
    merge_to_input: bool = False
):
    ...
```

#### `__init__` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | `None` | 本算子不使用大模型，该参数仅为兼容接口预留，传入后不生效。 |
| `seed` | `int` | `0` | 随机种子，用于初始化内部随机数生成器（当前版本未影响去重逻辑）。 |
| `lang` | `str` | `"en"` | 语言设置，当前版本未影响实际处理逻辑。 |
| `merge_to_input` | `bool` | `False` | 预留参数，当前版本未在主流程中实际使用。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "triple",
    output_key: str = "triple",
):
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，按优先级确定输入列（`input_key` → `triple` → `tuple`），并根据输入列名自动设置默认输出列名。随后将所有行的元组列表展平合并为一个一维列表，对其中的字符串进行严格精确去重（保持首次出现的顺序），最终将去重后的列表作为单行写入新 DataFrame 并输出。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow 数据存储对象。算子会从中读取 `dataframe`，并将去重结果写入新 DataFrame 后输出。 |
| `input_key` | `str` | `"triple"` | 输入元组列名。兼容 `triple` 和 `tuple` 列名的自动回退。 |
| `output_key` | `str` | `"triple"` | 输出列名。默认与输入列同名（即覆盖写入）。 |

---

## 🤖 示例用法
```python
from dataflow.operators.general_kg.filter.kg_tuple_remove_repeated import (
    KGTupleRemoveRepeated,
)

operator = KGTupleRemoveRepeated()
operator.run(
    storage=storage,
    input_key="triple",
    output_key="triple",
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `triple` / `tuple` | `List[str]` | 去重后的元组字符串列表，输出 DataFrame 固定为 1 行，包含所有唯一元组。 |

---

#### 示例输入
```json
[
  {
    "triple": [
      "<subj> Alice <obj> Bob <rel> knows",
      "<subj> Bob <obj> Carol <rel> worksWith"
    ]
  },
  {
    "triple": [
      "<subj> Bob <obj> Carol <rel> worksWith",
      "<subj> Carol <obj> Dave <rel> manages"
    ]
  }
]
```

#### 示例输出
```json
[
  {
    "triple": [
      "<subj> Alice <obj> Bob <rel> knows",
      "<subj> Bob <obj> Carol <rel> worksWith",
      "<subj> Carol <obj> Dave <rel> manages"
    ]
  }
]
```

---

#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/general_kg/filter/kg_tuple_remove_repeated.py`