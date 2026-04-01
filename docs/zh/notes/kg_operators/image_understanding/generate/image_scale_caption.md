---
title: 图像的高信息密度描述生成（ScaleCap）
createTime: 2025/10/15 17:59:06
icon: material-symbols-light:image
permalink: /zh/mm_operators/image_scale_caption/
---

## 📘 概述

`ImageScaleCaptionGenerate` 是一个用于**生成图像的高信息密度长描述**的算子。
它支持从包含图像路径的 JSONL 或 DataFrame 列批量生成 ScaleCap 风格的描述，流程包括：

* 初步生成描述（初稿）
* 句级自检筛选（保留“golden sentences”）
* 对象和位置的追问（QAs）
* 可选二次自检过滤回答
* 最终融合并输出完整的长描述。

背景论文：

> 🌐 **ScaleCap: Inference-Time Scalable Image Captioning via Dual-Modality Debiasing**
> arXiv: [2506.19848](https://arxiv.org/abs/2506.19848)

---

## `__init__` 函数

```python
def __init__(
    self, 
    vlm_serving: VLMServingABC, 
    config: Optional[ImageScaleCaptionGenerateConfig] = None
)
```

### `init` 参数说明

| 参数名           | 类型                                          | 默认值 | 说明                                                  |
| :------------ | :------------------------------------------ | :-- | :-------------------------------------------------- |
| `vlm_serving` | `VLMServingABC`                             | 无   | 图像描述生成的多模态模型接口。                                     |
| `config`      | `Optional[ImageScaleCaptionGenerateConfig]` | 无   | 配置对象，包含参数如 `max_questions` 和 `max_answer_tokens` 等。 |

---

## `get_desc` 函数

```python
@staticmethod
def get_desc(lang: str = "zh") -> str
```

返回该算子的描述信息，支持中文和英文两种语言模式。

### `get_desc` 参数说明

| 参数名    | 类型    | 默认值    | 说明                             |
| :----- | :---- | :----- | :----------------------------- |
| `lang` | `str` | `"zh"` | 语言，支持中文 (`"zh"`) 和英文 (`"en"`)。 |

---

## `run` 函数

```python
def run(
    self, 
    storage: DataFlowStorage,
    input_image_key: str = "image", 
    output_key: str = "scalecap_record"
)
```

执行算子主逻辑，读取输入数据并生成 ScaleCap 风格的长描述。生成的描述将以 JSON 格式写入输出字段。

### 参数

| 参数名          | 类型                | 默认值                 | 说明                |
| :----------- | :---------------- | :------------------ | :---------------- |
| `storage`    | `DataFlowStorage` | 无                   | 数据存储接口，用于读取和写入数据。 |
| `input_image_key`  | `str`             | `"image"`           | 图像路径字段名。          |
| `output_key` | `str`             | `"scalecap_record"` | 输出字段名，用于保存生成的描述。  |

---

## 🧠 示例用法

```python
from dataflow.serving.local_model_vlm_serving import LocalModelVLMServing_vllm
from dataflow.operators.core_vision import ImageScaleCaptionGenerate, ImageScaleCaptionGenerateConfig

# 加载 VLM 模型
model = LocalModelVLMServing_vllm(
    hf_model_name_or_path="/data0/happykeyan/Models/Qwen2.5-VL-3B-Instruct"
)

# 配置算子
cfg = ImageScaleCaptionGenerateConfig(
    tau_sentence=0.15,
    max_questions=20,
    max_init_tokens=1024,
    max_answer_tokens=256,
    second_filter=False
)

# 实例化算子
operator = ImageScaleCaptionGenerate(vlm_serving=model, config=cfg)

# 执行算子
operator.run(
    storage=storage,
    input_image_key="image",
    output_key="scalecap_record"
)
```

---

### 🧾 默认输出格式（Output Format）

| 字段                    | 类型          | 说明              |
| :-------------------- | :---------- | :-------------- |
| `image`               | `str`       | 输入的图像路径。        |
| `init_caption`        | `str`       | 生成的初步描述。        |
| `golden_sentences`    | `list[str]` | 句级自检后的保留句子。     |
| `object_questions`    | `list[str]` | 针对图像中的对象生成的问题。  |
| `position_questions`  | `list[str]` | 针对图像中对象位置生成的问题。 |
| `qa_answers_filtered` | `list[str]` | 经过二次过滤后的回答。     |
| `final_caption`       | `str`       | 最终融合后的长描述。      |

示例输入：

```jsonl
{"image": "/path/to/image.jpg"}
```

示例输出：

```jsonl
{
  "image": "/path/to/image.jpg",
  "scalecap_record": {
    "init_caption": "A man in a suit jumping above a bed in a bedroom.",
    "golden_sentences": [
        "A man is jumping above a bed.",
        "The room is a bedroom."
    ],
    "object_questions": [
        "Describe more details about the man.",
        "Describe more details about the suit."
    ],
    "position_questions": [
        "Describe more details about the position of the man.",
        "Describe more details about the position of the bed."
    ],
    "qa_answers_filtered": [
        "The man is wearing a black suit.",
        "The bed is located in the middle of the room."
    ],
    "final_caption": "A man in a black suit is jumping above a bed in a spacious bedroom."
  }
}
```
