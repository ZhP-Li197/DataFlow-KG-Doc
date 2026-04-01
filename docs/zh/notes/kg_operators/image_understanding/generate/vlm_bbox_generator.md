---
title: VLMBBoxGenerator
createTime: 2026/01/11 21:44:23
permalink: /zh/mm_operators/generate/vlm_bbox_generator/
---
## 📘 概述

`VLMBBoxGenerator` 是一个 **视觉定位生成算子**。

它接收一张图像和一个关键词列表（Keywords List），利用 VLM 的定位能力检测每个关键词对应的物体，并输出归一化的边界框（Bounding Box）。该算子能够自动解析模型输出的坐标文本，将其转换为标准化的 `[x1, y1, x2, y2]` 格式。

核心特性：

* **批量并行**：针对单张图片中的多个关键词，自动组装 Batch 请求并行推理，提高检测效率。
* **坐标归一化**：兼容 0-1000 整数坐标与 0-1 小数坐标输出，统一归一化处理。
* **异常过滤**：自动过滤模型输出的 "not found" 或无法解析的无效结果。

## 🏗️ `__init__` 函数

```python
def __init__(
    self, 
    serving: LLMServingABC, 
    prompt_template: str = 'Detect "{keyword}".'
):

```

### 🧾 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `serving` | `LLMServingABC` | 无 | 负责执行推理的模型服务实例（需支持 Grounding/BBox 输出，如 Qwen-VL）。 |
| `prompt_template` | `str` | `'Detect "{keyword}".'` | 用于触发模型检测行为的 Prompt 模板。必须包含 `{keyword}` 占位符。 |

## ⚡ `run` 函数

```python
def run(
    self, 
    storage: DataFlowStorage, 
    input_image_key: str, 
    input_kws_key: str, 
    output_key: str
):
    ...

```

执行算子主逻辑：

1. **读取数据**
从 DataFrame 中读取图像路径 (`input_image_key`) 和待检测的关键词列表 (`input_kws_key`)。
2. **批量推理构建**
对于每一行数据：
* 获取去重后的关键词列表。
* 为每个关键词构造 Prompt（例如 `"Detect "cat"."`）和对应的图像输入。
* 将该图片的所有关键词请求打包为一个 Batch，调用 `serving.generate_from_input` 并行生成。


3. **结果解析 (Parsing)**
* **坐标提取**：使用正则提取 `(x1, y1), (x2, y2)` 格式的坐标。
* **归一化**：若坐标值大于 1（例如 0-1000 尺度），自动除以 1000 归一化到 0-1 范围。
* **格式化**：将坐标转换为 `[x1, y1, x2, y2]` 字符串格式。
* **过滤**：剔除包含 "not found" 的失败响应。


4. **结果保存**
构造 `{keyword: [bbox1, bbox2, ...]}` 的字典，写入 `output_key` 列。

### 🧾 `run` 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `storage` | `DataFlowStorage` | 无 | DataFlow 数据存储对象。 |
| `input_image_key` | `str` | 无 | 图像路径所在的列名。 |
| `input_kws_key` | `str` | 无 | 关键词列表所在的列名（`List[str]`）。 |
| `output_key` | `str` | 无 | 输出结果的列名（存储为字典）。 |

## 🧩 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.core import LLMServing
from dataflow.operators.generate import VLMBBoxGenerator

# 1) 初始化模型 (需支持 Grounding)
serving = LLMServing(model_path="Qwen/Qwen2.5-VL-7B-Instruct")

# 2) 初始化算子
generator = VLMBBoxGenerator(
    serving=serving,
    prompt_template='Find the bounding box of "{keyword}".'
)

# 3) 准备数据 (jsonl)
# 数据格式: {"image": "park.jpg", "objects": ["dog", "frisbee", "tree"]}
storage = FileStorage(file_name_prefix="bbox_task")
storage.step()

# 4) 执行检测
generator.run(
    storage=storage,
    input_image_key="image",
    input_kws_key="objects",
    output_key="bbox_result"
)

```

### 🧾 默认输出格式

`output_key` 列为字典格式（`Dict[str, List[str]]`）：

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| Keyword | `str` | 输入的关键词。 |
| BBoxes | `List[str]` | 检测到的 BBox 列表，格式为 `"[x1, y1, x2, y2]"` (保留前 3 个结果)。 |

**JSONL 示例输出：**

```json
{
  "image": "park.jpg",
  "objects": ["dog", "frisbee", "ufo"],
  "bbox_result": {
    "dog": ["[0.125, 0.450, 0.230, 0.600]"],
    "frisbee": ["[0.240, 0.500, 0.280, 0.540]"]
    // "ufo" 未检测到，因此不出现在结果中
  }
}

```
