---
title: 从 MCTS 搜索树生成多模态推理链（Grounded-RL）
createTime: 2025/10/15 17:58:08
icon: material-symbols-light:image
permalink: /zh/mm_operators/vision_mct_reasoning/
---

## 📘 概述

`VisionMCTSReasoningSFTGenerate` 是一个用于**从视觉 MCTS 搜索树或直接通过多模态模型 (VLM)** 生成**显式坐标落点的推理链（Reasoning Chain）**的算子。
它将树状推理过程线性化为 `<think>…</think>` 与 `<answer>…</answer>` 格式的思维链，并自动构造可直接用于 **SFT（Supervised Fine-Tuning）或 RL（Reinforcement Learning）** 训练的数据条目。

生成结果同时支持：

* **从 MCTS 树提取多样式推理链**
* **直接调用 VLM 构造带坐标的 Chain-of-Thought**
* **图像坐标点可视化（可选）**
* **自动生成 SFT train/val JSON 文件**

论文背景：

> 🌐 **Grounded Reinforcement Learning for Visual Reasoning**
> arXiv: [2505.23678](https://arxiv.org/abs/2505.23678)

---

## `__init__` 函数

```python
def __init__(
    self,
    llm_serving: LLMServingABC,
    prompt_type: str = "web_grounding",
    val_size: float = 0.05,
    log_to_wandb: bool = False,
    max_samples_per_file: int = 10000,
    draw_points: bool = True,
    seed: int = 42,
)
```

### `init` 参数说明

| 参数名                    | 类型              | 默认值               | 说明                                                          |
| :--------------------- | :-------------- | :---------------- | :---------------------------------------------------------- |
| `llm_serving`          | `LLMServingABC` | 无                 | 多模态推理模型封装（通常为 `LocalModelVLMServing_vllm`）。                 |
| `prompt_type`          | `str`           | `"web_grounding"` | 系统提示模板类型，支持：`web_grounding`、`spatial`、`web_action`、`vstar`。 |
| `val_size`             | `float`         | `0.05`            | 验证集比例。                                                      |
| `log_to_wandb`         | `bool`          | `False`           | 是否将样例推理链可视化上传至 Weights & Biases。                            |
| `max_samples_per_file` | `int`           | `10000`           | 每个样本最多保留的推理链数量（超过则随机采样）。                                    |
| `draw_points`          | `bool`          | `True`            | 是否在图像上绘制坐标点（绿色=推理步骤，红色=预测，蓝色=真值）。                           |
| `seed`                 | `int`           | `42`              | 随机数种子。                                                      |

---

## `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage,
    input_question_key: str = "question",
    input_image_key: str = "image",
    input_tree_key: Optional[str] = "tree",
    input_true_answer_key: str = "true_answer",
    output_key: str = "sft_entry",
)
```

执行算子主逻辑：
读取输入表（或 JSONL），为每个样本生成一条或多条 `<think>/<answer>` 推理链，并输出成 SFT 可直接使用的格式。

### 参数

| 参数名               | 类型                | 默认值             | 说明                             |
| :---------------- | :---------------- | :-------------- | :----------------------------- |
| `storage`         | `DataFlowStorage` | 无               | DataFlow 的数据存取接口。              |
| `input_question_key`    | `str`             | `"question"`    | 样本中问题字段名。                      |
| `input_image_key`       | `str`             | `"image"`       | 图像路径字段名。                       |
| `input_tree_key`        | `Optional[str]`   | `"tree"`        | 可选，MCTS 树字段；存在时解析其中的 rollouts。 |
| `input_true_answer_key` | `str`             | `"true_answer"` | 样本中真实坐标或答案字段名。                 |
| `output_key`      | `str`             | `"sft_entry"`   | 输出 SFT 条目的字段名。                 |

---

## 🧠 示例用法

```python
from dataflow.serving.local_model_vlm_serving import LocalModelVLMServing_vllm
from dataflow.operators.core_vision import VisionMCTSReasoningSFTGenerate

# 加载模型
model = LocalModelVLMServing_vllm(
    hf_model_name_or_path="/data0/happykeyan/Models/Qwen2.5-VL-3B-Instruct"
)

# 构造算子
op = VisionMCTSReasoningSFTGenerate(
    llm_serving=model,
    prompt_type="web_grounding",
    val_size=0.0,
    log_to_wandb=False,
    draw_points=True
)

# 执行
op.run(
    storage=storage,
    input_question_key="question",
    input_image_key="image",
    input_tree_key="tree",
    input_true_answer_key="true_answer",
    output_key="sft_entry",
)
```

---

### 🧾 默认输出格式（Output Format）

| 字段          | 类型           | 说明                                  |
| :---------- | :----------- | :---------------------------------- |
| `id`        | `str`        | 样本唯一标识符。                            |
| `metadata`  | `dict`       | 保留元信息。                              |
| `messages`  | `list[dict]` | 训练对话格式，包括 system、user、assistant 三轮。 |
| `images`    | `list[str]`  | 对应输入图像路径。                           |
| `gt_answer` | `str`        | 样本真值坐标或答案文本。                        |

示例输入：

```jsonl
{"question": "请指出图片中项链吊坠的中心坐标。", "image": "./image3.png", "true_answer": "[420, 560]"}
```

示例输出：

```json
{
  "id": "0_0",
  "metadata": {},
  "messages": [
    {"role": "system", "content": "<系统提示模板>"},
    {"role": "user", "content": "请指出图片中项链吊坠的中心坐标。"},
    {"role": "assistant", "content": "<think> ... (420,560) ... </think><answer> (420,560) </answer>"}
  ],
  "images": ["./image3.png"],
  "gt_answer": "[420, 560]"
}
```
