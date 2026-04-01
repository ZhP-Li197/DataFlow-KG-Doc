---
title: VisualGroundingRefiner
createTime: 2026/01/11 20:33:54
permalink: /zh/mm_operators/refine/visual_grounding_refiner/
---
## 📘 概述

`VisualGroundingRefiner` 是一个 **视觉一致性精炼算子**，用于消除多模态文本生成中的“幻觉” (Hallucination)。

该算子接收一个文本列表（如生成的标签、句子或属性）和一张图像，通过 VLM 对列表中的每一项进行 **逐项视觉验证 (Visual Verification)**。它利用“Yes/No”判别机制，仅保留模型判定为“Yes”（即与图像内容一致）的文本项，从而过滤掉图像中不存在的物体或错误的描述。

## `__init__`函数

```python
def __init__(
    self, 
    serving: LLMServingABC, 
    prompt_template: str, 
    system_prompt: str = "You are a helpful assistant."
):

```

### 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `serving` | `LLMServingABC` | 无 | 负责执行推理的模型服务实例（需支持 VLM 多模态推理）。 |
| `prompt_template` | `str` | 无 | 验证用的 Prompt 模板。**必须包含 `{text}` 占位符**，且设计为引导模型回答 "Yes" 或 "No" 的问题。 |
| `system_prompt` | `str` | `"You are..."` | 发送给模型的系统提示词。 |

## `run`函数

```python
def run(
    self, 
    storage: DataFlowStorage, 
    input_list_key: str, 
    input_image_key: str, 
    output_key: str
):
    ...

```

执行算子主逻辑：

1. **读取数据**
从 DataFrame 中获取待验证的文本列表（`input_list_key`）和对应图像路径（`input_image_key`）。
2. **构造批量请求 (Batch Construction)**
对列表中的每一个文本项 `item`：
* 使用 `prompt_template.format(text=item)` 生成询问语句。
* 构造包含 `[Image, Text]` 的多模态消息。


3. **批量推理 (Batch Inference)**
* 将单张图片对应的多个文本验证请求打包成 Batch。
* 调用 `serving.generate_from_input` 进行并行推理，获取回答。


4. **过滤逻辑 (Filtering)**
* 检查模型的回答是否包含 `"yes"` (大小写不敏感)。
* **保留** 回答为 Yes 的项，**丢弃** 回答为 No 或其他的项。


5. **结果保存**
将过滤后的新列表写入 `output_key`。

### 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `storage` | `DataFlowStorage` | 无 | Dataflow 的读写存储对象。 |
| `input_list_key` | `str` | 无 | 待验证的文本列表所在的列名（List[str]）。 |
| `input_image_key` | `str` | 无 | 图像路径所在的列名。 |
| `output_key` | `str` | 无 | 验证后保留的文本列表输出列名。 |

## 🧠 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.core import LLMServing
from dataflow.operators.refine import VisualGroundingRefiner

# 1) 初始化模型服务
serving = LLMServing(model_path="Qwen/Qwen-VL-Chat", device="cuda")

# 2) 初始化精炼算子
# 模板设计要点：明确要求回答 Yes 或 No
refiner = VisualGroundingRefiner(
    serving=serving,
    prompt_template="Look at the image. Is the object '{text}' visible in the scene? Answer only Yes or No."
)

# 3) 执行过滤
refiner.run(
    storage=storage,
    input_list_key="candidate_tags",  # 例如 ["Cat", "Dog", "UFO"]
    input_image_key="image_path",
    output_key="verified_tags"
)

```

### 🧾 默认输出格式

`output_key` 列为过滤后的字符串列表：

示例输入 (`candidate_tags`):

```json
["Cat", "Grass", "Flying Saucer"]

```

*(假设图片是一只猫在草地上)*

示例输出 (`verified_tags`):

```json
["Cat", "Grass"]

```
