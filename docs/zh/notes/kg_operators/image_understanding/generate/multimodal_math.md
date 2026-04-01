---
title: MultimodalMathGenerator
createTime: 2025/10/15 19:00:00
# icon: material-symbols-light:functions
permalink: /zh/mm_operators/generate/multimodal_math/
---

## 📘 概述

`MultimodalMathGenerator` 是一个用于 **自动生成数学函数图像 + 数学问答对** 的多模态数据生成算子。  
它支持一次、二次、正弦、指数等多种函数类型，并根据输入数据中的 `mode` 字段（`simple` 或 `complex`）生成对应的简单计算题或高阶概念题，适用于教育场景、视觉问答模型训练和数学推理评测。

-----

## 🏗️ `__init__` 函数

```python
def __init__(
    self,
    image_dir: str = "~/cache",
    seed: int | None = None
):
    ...
```

## 🧾 `__init__` 参数说明

| 参数名         | 类型            | 默认值          | 说明               |
| :---------- | :------------ | :------------- | :--------------- |
| `image_dir` | `str`         | `"~/cache"`    | 用于保存生成的函数图像的目录   |
| `seed`      | `int \| None` | `None`         | 随机种子，用于保证生成结果可复现 |

-----

## ⚡ `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "mode",
):
    ...
```

执行算子主逻辑，读取 `storage` 中的数据，并根据每行数据中 `input_key` 字段的值，生成对应的函数图像及数学问答对，然后将新生成的列横向拼接回原数据。

-----

## 🧾 `run` 参数说明

| 参数名          | 类型                | 默认值    | 说明                                        |
| :----------- | :---------------- | :----- | :---------------------------------------- |
| `storage`    | `DataFlowStorage` | -      | Dataflow 数据存储对象（包含待处理的行数据）           |
| `input_key`  | `str`             | `"mode"` | **模式列的字段名**。该列的值决定是生成 `"simple"` 还是 `"complex"` 题目。 |

-----

## 🧠 模式说明与示例用法

### 📐 模式说明

| 模式 | `mode` 列值 | 特点 | 题目类型 |
| :--- | :--- | :--- | :--- |
| **简单模式** | `"simple"` | 基础函数认知和数值代入。 | 给定函数表达式 $f(x)$，求 $x=a$ 时的函数值 $f(a)$。 |
| **复杂模式** | 其他值（如 `"complex"`） | 强调数学分析能力（导数、极值、单调性）。 | 随机生成导数符号判断、区间极值点或单调性判断题。 |

### 🧩 示例用法 (需预先准备含 `mode` 列的输入文件)

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_math import MultimodalMathGenerator
import pandas as pd

# Step 1: 准备一个包含 'mode' 列的输入文件 (例如 data/math_tasks.jsonl)
# 假设 data/math_tasks.jsonl 内容如下：
# {"id": 1, "mode": "simple"}
# {"id": 2, "mode": "complex"}
# {"id": 3, "mode": "complex"}

storage = FileStorage(
    first_entry_file_name="data/math_tasks.jsonl",
    cache_path="./cache_local",
    file_name_prefix="math_out",
    cache_type="jsonl"
)
storage.step() # 读取数据

# Step 2: 初始化算子
math_generator = MultimodalMathGenerator(
    image_dir="./math_plots",
    seed=42
)

# Step 3: 运行算子，根据每行的 'mode' 列生成题目
math_generator.run(
    storage=storage,
    input_key="mode" # 指定以 'mode' 列来控制生成模式
)
```

-----

## 🧾 默认输出格式（Output Format）

算子会在原输入数据框的基础上，**横向拼接**以下四个字段：

| 字段           | 类型    | 说明         |
| :----------- | :---- | :--------- |
| `image_path` | `str` | 函数图像保存的本地路径   |
| `question`   | `str` | 自动生成的数学题目  |
| `answer`     | `str` | 答案         |
| `solution`   | `str` | 详细的解题步骤与解释 |

-----

### 📥 示例输入

> **注意：** 算子依赖输入 `storage` 的行数和 `input_key`（默认为 `mode`）列的值来生成数据。

```jsonl
{"id": 1, "mode": "simple"}
{"id": 2, "mode": "complex"}
```

-----

### 📤 示例输出（Simple 模式行）

```jsonl
{
  "id": 1,
  "mode": "simple",
  "image_path": "./math_plots/plot_0.png",
  "question": "The function plot represents f(x) = x². What is the function value at x=3.5?",
  "answer": "12.25",
  "solution": "According to the function expression f(x) = x², substitute x=3.5 to get y=12.25."
}
```

-----

### 📤 示例输出（Complex 模式行）

```jsonl
{
  "id": 2,
  "mode": "complex",
  "image_path": "./math_plots/plot_1.png",
  "question": "The function plot represents f(x) = sin(x). Is the rate of change (derivative) at x=2.5 positive or negative?",
  "answer": "negative",
  "solution": "By observing the slope of the plot near x=2.5, the rate of change is negative."
}
```