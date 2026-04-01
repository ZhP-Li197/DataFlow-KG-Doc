---
title: 图像依赖 MCQ 合成与有/无图双重过滤算子（CapRLMCQGenerate）
createTime: 2025/10/28 15:00:00
icon: material-symbols-light:image
permalink: /zh/mm_operators/generate/image_caprl/
---

## 📘 概述

`CapRLMCQGenerate` 从形如 `{"image": "..."} ` 的输入构建用于 CapRL 的多选题（MCQ）数据，并执行**双重过滤**以确保问题**必须依赖图像**才能作答：

1. 由 VLM 对每张图生成 **5 道 MCQ**（格式固定：Markdown 小标题 + 选项 + `**Answer:**`）。
2. 对每题进行 **N 次“旋转”**（随机重排选项标签），做稳健评估。
3. **可视条件**：带图像（可选自动追加 `E) None of the above`），要求模型**仅返回正确字母**；
   **文本条件**：不带图（仅题面），同样只回字母。
4. **通过规则**：`可视答对率 ≥ pass_visual_min` 且 `无图答对率 ≤ pass_textual_max`。

通过题目将写入 `kept_qas`，连同中间统计一起落在 `cap_rl_qa` 字段，**可直接用于后续 RL 的可验证奖励**。

背景论文:

> 🌐 **CapRL: Stimulating Dense Image Caption Capabilities via Reinforcement Learning**
> arXiv: [2509.22647](https://arxiv.org/abs/2509.22647)


---

## `__init__`

```python
@OPERATOR_REGISTRY.register()
class CapRLMCQGenerate(OperatorABC):
    def __init__(self, vlm_serving: VLMServingABC, config: Optional[CapRLMCQConfig] = None):
        ...
```

### `init` 参数说明

| 参数名         | 类型               | 默认值    | 说明                                                                                              |
| ----------- | ---------------- | ------ | ----------------------------------------------------------------------------------------------- |
| vlm_serving | `VLMServingABC`  | 必填     | 可调用 `generate_from_input_messages` 的多模态服务（支持 `conversations` + `image_list` + `system_prompt`）。 |
| config      | `CapRLMCQConfig` | `None` | 算子配置（见下表）。未传则使用类内默认值。                                                                           |

#### `CapRLMCQConfig` 字段

```python
@dataclass
class CapRLMCQConfig:
    expected_mcq_num: int = 5
    max_mcq_tokens: int = 2048
    rotate_num: int = 4
    add_none_above_for_visual: bool = True
    pass_visual_min: float = 1.0
    pass_textual_max: float = 0.0
    input_jsonl_path: Optional[str] = None
    output_jsonl_path: Optional[str] = None
    dedup_questions: bool = True
```

| 字段                        | 类型    |  默认值 | 说明                                                         |
| ------------------------- | ----- | ---: | ---------------------------------------------------------- |
| expected_mcq_num          | int   |    5 | 解析阶段最多保留的 MCQ 数（通常 5）。                                     |
| max_mcq_tokens            | int   | 2048 | 生成 MCQ 时的最大 tokens 期望（实际由 serving 采样控制，此处仅记录）。             |
| rotate_num                | int   |    4 | 每题随机重排（旋转）次数，用于稳健统计准确率。                                    |
| add_none_above_for_visual | bool  | True | **带图**评测时，如题干中没有以 `E)` 开头的选项，则自动追加 `E) None of the above`。 |
| pass_visual_min           | float |  1.0 | **带图**的最低通过准确率阈值（`1.0`=所有旋转都答对，最严格）。                       |
| pass_textual_max          | float |  0.0 | **不带图**的最高允许准确率（`0.0`=所有旋转都答错，最严格）。                        |
| input_jsonl_path          | str?  | None | 非 DataFrame 模式的输入路径（每行至少 `{ "image": "..." }`）。            |
| output_jsonl_path         | str?  | None | 非 DataFrame 模式的输出路径（默认 `*.caprl_mcq.jsonl`）。               |
| dedup_questions           | bool  | True | 解析后按 `(question, answer)` 去重。                              |

---

## `run`

```python
def run(
    self,
    storage: DataFlowStorage,
    input_image_key: str = "image",
    output_key: str = "cap_rl_qa",
):
    ...
```

### 功能

* 读取数据（DataFrame 或 `input_jsonl_path`），逐条生成 MCQ、解析、旋转、评测并过滤；
* 将结果**写回 DataFrame 的 `output_key` 列**（直接写 Python dict），或落盘 JSONL（每行含 `{"image": ..., "<output_key>": {...}}`）。

### 参数

| 参数名        | 类型                | 默认值           | 说明               |
| ---------- | ----------------- | ------------- | ---------------- |
| storage    | `DataFlowStorage` | 必填            | 读写与缓存。           |
| input_image_key  | str               | `"image"`     | 输入字段名（图像路径）。     |
| output_key | str               | `"cap_rl_qa"` | 输出字段名（写入整个统计结构）。 |

---

## 🧠 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.serving.local_model_vlm_serving import LocalModelVLMServing_vllm
from dataflow.operators.core_vision import CapRLMCQGenerate, CapRLMCQConfig

# 1) Storage（images.jsonl 每行: {"image": "/abs/path/to/img.png"}）
storage = FileStorage(
    first_entry_file_name="./images.jsonl",
    cache_path="./cache_local",
    file_name_prefix="caprl_mcq",
    cache_type="jsonl",
)

# 2) Serving
serving = LocalModelVLMServing_vllm(
    hf_model_name_or_path="/data0/Models/Qwen2.5-VL-3B-Instruct",
    vllm_tensor_parallel_size=1,
    vllm_temperature=0.1,
    vllm_top_p=0.9,
    vllm_max_tokens=512,
)

# 3) Config（严格过滤的推荐阈值）
cfg = CapRLMCQConfig(
    rotate_num=4,
    pass_visual_min=1.0,
    pass_textual_max=0.0,
    add_none_above_for_visual=True,
    dedup_questions=True,
)

# 4) Operator
op = CapRLMCQGenerate(vlm_serving=serving, config=cfg)

# 5) Run（DataFrame 驱动：storage.step()）
op.run(storage=storage.step(), input_image_key="image", output_key="cap_rl_qa")
```

---

## 🧾 默认输出结构（写入 `output_key`）

```jsonc
{
  "image": "/path/to/img.png",
  "raw_mcq_text": "#### 1. **...**\n   - A) ...\n   ...\n**Answer:** B) ...\n------\n#### 2. **...** ...",
  "parsed_qa_list": [
    {
      "question": "Question line\n   - A) ...\n   - B) ...\n   - C) ...\n   - D) ...",
      "options": {"A": "...", "B": "...", "C": "...", "D": "..."},
      "answer": "B",
      "answer_text": "..."
    }
    // ... up to expected_mcq_num
  ],
  "filter_stats": [
    {
      "qa": { /* 同 parsed_qa_list 的单项 */ },
      "trials": [
        {
          "rotated_answer": "A",
          "visual_output": "A",
          "visual_pred": "A",
          "visual_correct": true,
          "text_output": "D",
          "text_pred": "D",
          "text_correct": false
        }
        // 共 rotate_num 次
      ],
      "visual_acc": 1.0,
      "text_acc": 0.0,
      "keep": true
    }
    // one per QA
  ],
  "kept_qas": [ /* 通过 keep==true 的题（用于 RL） */ ],
  "num_kept": 2,
  "num_all": 5,
  "config": {
    "rotate_num": 4,
    "pass_visual_min": 1.0,
    "pass_textual_max": 0.0,
    "add_none_above_for_visual": true
  }
}
```

### ✅ 输入示例（jsonl）

```jsonl
{"image": "./dataflow/example/image_to_text_pipeline/capsbench_images/2.png"}
```

### ✅ 输出示例（节选）

```jsonl
{
  "image": "./dataflow/example/image_to_text_pipeline/capsbench_images/2.png",
  "cap_rl_qa": {
    "image": "./dataflow/example/image_to_text_pipeline/capsbench_images/2.png",
    "raw_mcq_text": "#### 1. **What is the main theme of the playlist?** ...",
    "parsed_qa_list": [
      {
        "question": "What is the main theme of the playlist?\n   - A) Relaxation\n   - B) Fitness\n   - C) Romance\n   - D) Jazz",
        "options": {"A":"Relaxation","B":"Fitness","C":"Romance","D":"Jazz"},
        "answer": "B",
        "answer_text": "Fitness"
      },
      ...
    ],
    "filter_stats": [
      {
        "qa": {...},
        "trials": [
          {"rotated_answer":"A","visual_output":"A","visual_pred":"A","visual_correct":true,"text_output":"D","text_pred":"D","text_correct":false},
          ...
        ],
        "visual_acc": 1.0,
        "text_acc": 0.0,
        "keep": true
      },
      ...
    ],
    "kept_qas": [
      { "question": "... main theme ...", "answer": "B", ... },
      { "question": "... woman holding ...", "answer": "B", ... }
    ],
    "num_kept": 2,
    "num_all": 5,
    "config": {
      "rotate_num": 4,
      "pass_visual_min": 1.0,
      "pass_textual_max": 0.0,
      "add_none_above_for_visual": true
    }
  }
}
```
