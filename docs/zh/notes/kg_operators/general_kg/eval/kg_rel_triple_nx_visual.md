---
title: KGRelationTripleVisualization
createTime: 2026/04/10 15:40:44
permalink: /zh/kg_operators/general_kg/eval/kg_rel_triple_nx_visual/
---

## 📚 概述
`KGRelationTripleVisualization` 是一个用于将知识图谱关系三元组可视化为交互式图结构的算子。
它会读取每一行中的三元组列表，解析实体与关系，基于 NetworkX 构建有向图，并通过 PyVis 渲染输出可交互的 HTML 可视化文件。

这个算子的几个关键特点如下：

- 无需 `LLMServingABC`，是纯图结构处理算子
- 使用正则表达式解析 `<subj> ... <obj> ... <rel> ...` 格式的三元组
- 节点大小按实体出现频率动态缩放，便于识别核心实体
- 使用 PyVis 的 `barnes_hut` 布局渲染交互式有向图，边上附有关系标签
- 输出为单个 HTML 文件，可在浏览器中直接打开进行探索

---

## ✒️ `__init__` 函数
```python
def __init__(
    self,
    llm_serving: LLMServingABC = None,
    seed: int = 0,
    lang: str = "en"
):
    ...
```

#### `__init__` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `llm_serving` | `LLMServingABC` | `None` | 本算子不使用大模型，该参数仅为兼容接口预留，传入后不生效。 |
| `seed` | `int` | `0` | 随机种子，用于初始化内部随机数生成器。 |
| `lang` | `str` | `"en"` | 语言设置，当前版本暂未影响可视化输出内容。 |

---

## 💡 run 函数
```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "triple",
    output_key: str = "kg_visualization"
):
    ...
```

`run` 会先从 `storage` 中读取 DataFrame，校验 `input_key` 列存在且 `output_key` 列不存在，随后提取所有行的三元组列表并展平。对每条三元组，算子用正则表达式解析出主体、客体和关系，构建 NetworkX 有向图，再通过 PyVis 将图渲染为交互式 HTML 文件写入磁盘。当图中无任何有效三元组时，算子会记录警告并跳过渲染。

#### `run` 参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow 数据存储对象。算子会从中读取 `dataframe`。 |
| `input_key` | `str` | `"triple"` | 输入三元组列名。每个单元格应为 `List[str]` 格式的三元组列表。 |
| `output_key` | `str` | `"kg_visualization"` | 输出列名（当前版本实际渲染结果写入 HTML 文件，该列名用于校验冲突）。 |

---

## 🤖 示例用法
```python
from dataflow.utils.storage import DummyStorage
from dataflow.operators.general_kg.eval.kg_rel_triple_nx_visual import (
    KGRelationTripleVisualization,
)

operator = KGRelationTripleVisualization(
    seed=42,
    lang="en",
)
operator.run(
    storage=storage,
    input_key="triple",
    output_key="kg_visualization",
)
```

---

#### 默认输出格式
| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `triple` | `List[str]` | 输入三元组列表，格式为 `<subj> ... <obj> ... <rel> ...`。 |
| HTML 文件 | `str`（文件路径） | 输出的交互式知识图谱可视化文件，可在浏览器中打开。 |

---

#### 示例输入
```json
[
  {
    "triple": [
      "<subj> Newton <obj> gravity <rel> discovered",
      "<subj> Newton <obj> Cambridge <rel> studiedAt",
      "<subj> gravity <obj> Earth <rel> affects"
    ]
  }
]
```

#### 示例输出

算子将生成一个 HTML 文件（默认路径由代码内部指定），在浏览器中打开后可查看如下交互图：

- 节点 `Newton`（高频，节点较大）、`gravity`、`Cambridge`、`Earth`
- 有向边附有关系标签：`discovered`、`studiedAt`、`affects`
- 支持拖拽、缩放、悬浮查看实体频率等交互操作

---

#### 相关链接
- 算子实现：`DataFlow-KG/dataflow/operators/general_kg/eval/kg_rel_triple_nx_visual.py`
- 依赖库：[NetworkX](https://networkx.org/)、[PyVis](https://pyvis.readthedocs.io/)