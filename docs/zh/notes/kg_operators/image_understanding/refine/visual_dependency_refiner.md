---
title: VisualDependencyRefiner
createTime: 2026/01/11 20:27:11
permalink: /zh/mm_operators/refine/visual_dependency_refiner/
---
## 📘 概述

`VisualDependencyRefiner` 是一个 **视觉依赖性校验算子**，用于对多项选择题（MCQ）进行严格的质量控制。

在多模态数据集中，许多问题其实无需看图即可通过常识或文本偏差（Textual Bias）回答。本算子通过 **“旋转 + 双盲测试”** 机制，筛选出那些 **必须依赖视觉信息（High Visual Acc）** 且 **不能仅凭文本猜测（Low Text Acc）** 的高质量问题。

核心机制：

1. **选项旋转（Rotation）**：对同一道题多次打乱选项顺序，消除模型对选项位置（如总是选 A）的偏好。
2. **双盲对比（Visual vs Text-only）**：
* **有图模式**：输入图片 + 问题，要求高准确率。
* **纯文本模式**：仅输入问题（盲测），要求低准确率（接近随机猜测）。



## `__init__`函数

```python
def __init__(
    self, 
    serving: LLMServingABC, 
    instruction_template: str,
    rotate_num: int = 4,
    pass_visual_min: float = 1.0,
    pass_textual_max: float = 0.25, 
    add_none_above_visual: bool = True
):

```

### 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `serving` | `LLMServingABC` | 无 | 负责执行推理的模型服务实例（需支持多模态和纯文本）。 |
| `instruction_template` | `str` | 无 | 提示词模板，需包含 `{}` 占位符以填入问题和选项。 |
| `rotate_num` | `int` | `4` | 校验轮次。每道题会生成 N 个不同选项顺序的变体进行测试。 |
| `pass_visual_min` | `float` | `1.0` | **视觉通过阈值**。有图模式下的准确率需  此值才算合格（默认要求 100% 正确）。 |
| `pass_textual_max` | `float` | `0.25` | **文本过滤阈值**。无图模式下的准确率需  此值才算合格（默认 25%，即 4 选项的随机概率）。 |
| `add_none_above_visual` | `bool` | `True` | 是否在**有图模式**的选项中动态增加 "None of the above" 干扰项，以增加难度并减少幻觉。 |

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
遍历 DataFrame，获取图像路径（`input_image_key`）和对应的 MCQ 列表（`input_list_key`）。
2. **双盲测试构建**
对列表中的每一道题，循环 `rotate_num` 次：
* **Visual Case**：打乱选项顺序（可选加入 "None of the above"），构建 `[Image, Instruction]` 的 Prompt。
* **Text-Only Case**：打乱选项顺序（不加干扰项），仅构建 `[Instruction]` 的 Prompt。


3. **批量推理**
* 将 Visual Prompts 和 Text Prompts 分别组成 Batch。
* 调用 `serving.generate_from_input` 分别获取有图和无图的推理结果。


4. **准确率计算与过滤**
* 解析模型输出的选项字母（A/B/C...）。
* 计算 **Visual Accuracy (`v_acc`)** 和 **Text-Only Accuracy (`l_acc`)**。
* 仅保留满足条件 `v_acc >= pass_visual_min` **且** `l_acc <= pass_textual_max` 的题目。


5. **结果保存**
将筛选后的题目列表写入 `output_key` 列。

### 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `storage` | `DataFlowStorage` | 无 | Dataflow 的读写存储对象。 |
| `input_list_key` | `str` | 无 | 包含 MCQ 题目列表（List[Dict]）的列名。 |
| `input_image_key` | `str` | 无 | 图像路径所在的列名。 |
| `output_key` | `str` | 无 | 输出筛选后题目列表的列名。 |

## 🧠 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.core import LLMServing
from dataflow.operators.refine import VisualDependencyRefiner

# 1) 初始化模型服务 (例如 Qwen-VL)
serving = LLMServing(model_path="Qwen/Qwen-VL-Chat", device="cuda")

# 2) 初始化校验算子
# 要求：看图必须全对 (1.0)，不看图准确率不超过 25% (0.25)
refiner = VisualDependencyRefiner(
    serving=serving,
    instruction_template="Answer the question based on the image.\n{}",
    rotate_num=4,
    pass_visual_min=1.0,
    pass_textual_max=0.25
)

# 3) 执行过滤
refiner.run(
    storage=storage,
    input_list_key="generated_qas",  # 之前生成的题目列表
    input_image_key="image_path",
    output_key="refined_qas"
)

```

### 🧾 默认输出格式

`output_key` 列包含过滤后的题目列表，每道题会新增一个 `stats` 字段记录测试结果：

```json
[
  {
    "question": "What color is the car?",
    "options": {"A": "Red", "B": "Blue", ...},
    "answer": "A",
    "stats": {
      "v_acc": 1.0,  // 有图准确率
      "t_acc": 0.0   // 无图准确率
    }
  }
]

```
