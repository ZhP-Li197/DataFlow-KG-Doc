---
title: MultimodalMathGenerator
createTime: 2025/10/15 19:00:00
# icon: material-symbols-light:functions
permalink: /en/mm_operators/generate/multimodal_math/
---

## 📘 Overview

`MultimodalMathGenerator` is a data generation operator for **automatically creating function plots (images) and corresponding math Question-Answer (QA) pairs**.  
It supports various function types (linear, quadratic, sine, exponential, etc.) and generates simple calculation problems or advanced conceptual problems based on the `mode` field (`simple` or `complex`) in the input data. This operator is suitable for educational applications, visual QA model training, and math reasoning evaluation.

-----

## 🏗️ `__init__` Function

```python
def __init__(
    self,
    image_dir: str = "~/cache",
    seed: int | None = None
):
    ...
```

## 🧾 `__init__` Parameters

| Parameter   | Type          | Default | Description                                                     |
| :---------- | :------------ | :------ | :-------------------------------------------------------------- |
| `image_dir` | `str`         | `"~/cache"` | Directory used to save the generated function plots             |
| `seed`      | `int \| None` | `None`  | Random seed to ensure reproducibility of generated results      |

-----

## ⚡ `run` Function

```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "mode",
):
    ...
```

The `run` function executes the main operator logic: it reads the data from `storage`, generates the corresponding function image and math QA pair based on the value in the `input_key` field for each row, and then horizontally concatenates the newly generated columns back to the original data.

-----

## 🧾 `run` Parameters

| Parameter   | Type              | Default | Description                                                              |
| :---------- | :---------------- | :------ | :----------------------------------------------------------------------- |
| `storage`   | `DataFlowStorage` | -       | Dataflow storage object (contains the rows to be processed)              |
| `input_key` | `str`             | `"mode"` | **Field name for the mode column**. Its value determines whether to generate a `"simple"` or `"complex"` problem. |

-----

## 🧠 Mode Description and Example Usage

### 📐 Mode Description

| Mode | `mode` Column Value | Characteristics | Problem Type |
| :--- | :--- | :--- | :--- |
| **Simple** | `"simple"` | Basic function recognition and numerical substitution. | Given the function expression $f(x)$, find the function value $f(a)$ at $x=a$. |
| **Complex** | Other values (e.g., `"complex"`) | Emphasizes mathematical analysis skills (derivatives, extrema, monotonicity). | Randomly generates questions on derivative sign, extreme points within an interval, or monotonicity judgment. |

### 🧩 Example Usage (Requires an input file pre-populated with a `mode` column)

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_math import MultimodalMathGenerator
import pandas as pd

# Step 1: Prepare an input file containing the 'mode' column (e.g., data/math_tasks.jsonl)
# Assuming data/math_tasks.jsonl contains:
# {"id": 1, "mode": "simple"}
# {"id": 2, "mode": "complex"}
# {"id": 3, "mode": "complex"}

storage = FileStorage(
    first_entry_file_name="data/math_tasks.jsonl",
    cache_path="./cache_local",
    file_name_prefix="math_out",
    cache_type="jsonl"
)
storage.step() # Load data

# Step 2: Initialize the operator
math_generator = MultimodalMathGenerator(
    image_dir="./math_plots",
    seed=42
)

# Step 3: Run the operator, generating problems based on the 'mode' column of each row
math_generator.run(
    storage=storage,
    input_key="mode" # Specify 'mode' column to control generation
)
```

-----

## 🧾 Default Output Format

The operator will **horizontally concatenate** the following four fields onto the original input DataFrame:

| Field        | Type | Description                                   |
| :----------- | :--- | :-------------------------------------------- |
| `image_path` | `str` | Local path where the function plot image is saved |
| `question`   | `str` | Automatically generated mathematical question |
| `answer`     | `str` | Answer                                        |
| `solution`   | `str` | Detailed solution steps and explanation       |

-----

### 📥 Example Input

> **Note:** The operator relies on the number of rows in the input `storage` and the value of the `input_key` column (defaults to `mode`) to generate data.

```jsonl
{"id": 1, "mode": "simple"}
{"id": 2, "mode": "complex"}
```

-----

### 📤 Example Output (Simple Mode Row)

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

### 📤 Example Output (Complex Mode Row)

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