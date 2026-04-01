---
title: 图像定位思维链生成（GCoT）
createTime: 2025/10/22 17:00:00
icon: material-symbols-light:quiz
permalink: /zh/mm_operators/generate/image_gcot/
---

## 📘 概述

`ImageGCoTGenerate` 是一个**带视觉定位的思维链（Grounded Chain-of-Thought, GCoT）生成算子**，它会基于图像和问答对，智能生成包含空间定位信息的推理过程，可以显著提升多模态推理任务的可解释性和准确性，适用于视觉问答、图像理解、场景描述等场景。

背景论文:

> 🌐 **Bootstrapping Grounded Chain-of-Thought in Multimodal LLMs for Data-Efficient Model Adaptation**
> arXiv: [2507.02859](https://arxiv.org/abs/2507.02859)

---

## 🏗️ `__init__` 函数

```python
def __init__(
    self,
    llm_serving: Optional[LLMServingABC] = None,
    model_path: str = "AIDC-AI/Ovis2.5-9B",
    model_base: str = None,
    conv_mode: str = "vicuna_v1",
    temperature: float = 0.0,
    top_p: float = None,
    num_beams: int = 1,
    max_new_tokens: int = 512,
    device: str = "cuda"
):
    ...
```

## 🧾 `__init__` 参数说明

| 参数名           | 类型                       | 默认值                    | 说明                                                      |
| :--------------- | :------------------------- | :------------------------ | :------------------------------------------------------ |
| `llm_serving`    | `Optional[LLMServingABC]`  | `None`                    | Qwen 模型服务对象，用于生成初始 CoT 和提取关键词            |
| `model_path`     | `str`                      | `"AIDC-AI/Ovis2.5-9B"`    | Ovis2.5 模型路径，用于视觉定位                            |
| `model_base`     | `str`                      | `None`                    | 基础模型路径（用于 LoRA）                                 |
| `conv_mode`      | `str`                      | `"vicuna_v1"`             | 对话模式                                                 |
| `temperature`    | `float`                    | `0.0`                     | 采样温度（0 表示贪心解码）                                |
| `top_p`          | `float`                    | `None`                    | Nucleus 采样参数                                         |
| `num_beams`      | `int`                      | `1`                       | Beam search 数量                                         |
| `max_new_tokens` | `int`                      | `512`                     | 最大生成 token 数                                        |
| `device`         | `str`                      | `"cuda"`                  | 运行设备                                                 |

---

## ⚡ `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage,
    input_question_key: str = "question",
    input_answer_key: str = "answer",
    input_image_key: str = "image",
    output_key: str = "gcot",
    save_intermediate: bool = True,
    qwen_unload_callback = None
):
    ...
```

执行完整的 GCoT 生成流程：
1. 使用 Qwen 生成思维链并提取关键词
2. 使用 Ovis 对关键词进行视觉定位
3. 将定位信息注入到思维链中生成 GCoT


## 🧾 `run` 参数说明

| 参数名                  | 类型              | 默认值        | 说明                                       |
| :---------------------- | :---------------- | :------------ | :-----------------------------------------|
| `storage`               | `DataFlowStorage` | -             | 数据流存储对象                             |
| `input_question_key`          | `str`             | `"question"`  | 输入问题字段名                             |
| `input_answer_key`            | `str`             | `"answer"`    | 输入答案字段名                             |
| `input_image_key`             | `str`             | `"image"`     | 输入图像字段名                             |
| `output_key`            | `str`             | `"gcot"`      | 输出 GCoT 字段名                          |
| `save_intermediate`     | `bool`            | `True`        | 是否保存中间结果和可视化                   |
| `qwen_unload_callback`  | `Callable`        | `None`        | Qwen 模型卸载回调函数（用于释放显存）       |

---

## 🧠 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.serving.local_model_vlm_serving import LocalModelVLMServing_vllm
from dataflow.operators.core_vision.generate import ImageGCoTGenerate

# Step 1: 启动 Qwen 模型服务
qwen_serving = LocalModelVLMServing_vllm(
    hf_model_name_or_path="/models/Qwen2.5-VL-7B-Instruct",
    hf_cache_dir="/cache",
    vllm_tensor_parallel_size=1,
    vllm_temperature=0.7,
    vllm_top_p=0.9,
    vllm_max_tokens=512
)

# Step 2: 准备输入数据
storage = FileStorage(
    first_entry_file_name="data/gqa_test.json",
    cache_path="./cache_gcot",
    file_name_prefix="gcot_result",
    cache_type="json"
)
storage.step()

# Step 3: 初始化并运行算子
gcot_generator = ImageGCoTGenerate(
    llm_serving=qwen_serving,
    model_path="AIDC-AI/Ovis2.5-9B",
    temperature=0.0,
    device="cuda"
)
```

---

## 🧾 默认输出格式

| 字段       | 类型                | 说明                                                 |
| :--------- | :------------------ | :---------------------------------------------------|
| `question` | `str`               | 输入问题                                             |
| `answer`   | `str`               | 输入答案                                             |
| `image`    | `str`               | 图像路径                                             |
| `cot`      | `str`               | 原始思维链（不含定位信息）                            |
| `keywords` | `List[str]`         | Qwen 提取的关键词                                    |
| `bboxes`   | `Dict[str, List]`   | 关键词到边界框的映射                                  |
| `gcot`     | `str`               | 带定位信息的思维链（关键词后附带坐标）                 |

---

### 📥 示例输入
```json
{
  "question": "Is the cat on the table?",
  "answer": "yes",
  "image": "/images/2404565.jpg",
  "imageId": "2404565"
}
```

### 📤 示例输出
```json
{
  "question": "Is the cat on the table?",
  "answer": "yes",
  "image": "/images/2404565.jpg",
  "cot": "Step 1: Locate the cat in the image. The cat is visible on the right side.\nStep 2: Locate the table. The wooden table is in the center.\nStep 3: Check if cat is on the table. Yes, the cat is sitting on top of the table.\nAnswer: yes",
  "keywords": ["cat", "table"],
  "bboxes": {
    "cat": ["[0.650, 0.234, 0.823, 0.567]"],
    "table": ["[0.123, 0.456, 0.890, 0.912]"]
  },
  "gcot": "Step 1: Locate the cat [0.650, 0.234, 0.823, 0.567] in the image. The cat is visible on the right side.\nStep 2: Locate the table [0.123, 0.456, 0.890, 0.912]. The wooden table is in the center.\nStep 3: Check if cat is on the table. Yes, the cat is sitting on top of the table.\nAnswer: yes"
}
```