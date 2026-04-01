---
title: ImageCLIPEvaluator
createTime: 2025/10/15 13:47:08
# icon: material-symbols-light:image
permalink: /zh/mm_operators/eval/image_clip_evaluator/
---
## 📘 概述
`ImageCLIPEvaluator` 基于 **CLIP** 计算图像与文本的**对齐分数**，范围 `[0,1]`。  
内部做法：对图像与文本编码 → 向量归一化 → 余弦相似度线性映射到 `[0,1]`（`(cos + 1)/2`）。



## ```__init__```函数
```python
def __init__(
    self,
    model_name: str = "openai/clip-vit-base-patch32",
    device: str = None
):
```

## `init`参数说明
| 参数名       | 类型          | 默认值                               | 说明 |
| :----------- | :------------ | :----------------------------------- | :--- |
| `model_name` | `str`         | `"openai/clip-vit-base-patch32"`    | CLIP 模型本地路径或 HF Model ID；通过 `CLIPProcessor` / `CLIPModel` 加载（`use_safetensors=True`）。 |
| `device`     | `str \| None` | `None`                              | 推理设备；`None` 时自动选择可用的 `"cuda"`，否则使用 `"cpu"`。 |


## `run`函数
```python
def run(
    self,
    storage: DataFlowStorage,
    input_image_key: str = "image_path",
    input_text_key: str = "text",
    output_key: str = "clip_score"
):
    ...
```
执行算子主逻辑
1. 从 `storage` 读取当前 DataFrame，逐行读取 `input_image_key` 与 `input_text_key` 对应的值。  
2. 使用 `CLIPProcessor` 组装输入（`padding="max_length"`, `truncation=True`, `max_length=77`），前向得到 `image_embeds` 与 `text_embeds`。  
3. 对嵌入向量做 L2 归一化，计算点积得到余弦相似度 `cos`，并映射为对齐分数`score = (cos + 1) / 2`，再裁剪到 `[0,1]` 区间。  
4. 将分数写入新列 `output_key`，写回 `storage`，并返回 `[output_key]`。  
5. 若图片无法读取或文本为空，则该样本分数记为 `0.0`。

参数
| 参数名            | 类型              | 默认值           | 说明 |
| :---------------- | :---------------- | :--------------- | :--- |
| `storage`         | `DataFlowStorage` | 无               | Dataflow 的读写存储对象。 |
| `input_image_key` | `str`             | `"image_path"`   | 输入图片列名。 |
| `input_text_key`  | `str`             | `"text"`         | 输入文本列名。 |
| `output_key`      | `str`             | `"clip_score"`   | 输出分数字段名（范围 `[0,1]`）。 |

## 🧠 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import ImageCLIPEvaluator

# 1) 准备 FileStorage（至少包含 image_path 与 text 两列）
storage = FileStorage(
    first_entry_file_name="./dataflow/example/test_image_eval/test_image_eval.jsonl",
    cache_path="./cache_local",
    file_name_prefix="clip_eval",
    cache_type="jsonl"
)

# 2) 初始化算子（可改为 HF 模型ID，如 "openai/clip-vit-base-patch32"）
evaluator = ImageCLIPEvaluator(
    model_name="openai/clip-vit-base-patch32",
    device=None  # 自动选择 cuda/cpu
)

# 3) 执行评估
cols = evaluator.run(
    storage=storage.step(),
    input_image_key="image_path",
    input_text_key="text",
    output_key="clip_score"
)
print(cols)  # ["clip_score"]
```

### 🧾 默认输出格式（Output Format）
| 字段名                                      | 类型     | 默认值 | 说明 |
| :------------------------------------------ | :------- | :----- | :--- |
| `image_path`（或 `input_image_key` 指定列） | `string` | 无     | 输入图片路径。 |
| `text`（或 `input_text_key` 指定列）        | `string` | 无     | 输入文本。 |
| `clip_score`（或 `output_key`）             | `float`  | 无     | 图文对齐分数，范围 `[0,1]`。 |



示例输入：
```jsonl
{
  "image_path": "1.png",
  "text": "The image shows a man and a woman in what appears to be a car."
}
```

示例输出：
```jsonl
{
  "image_path": "1.png",
  "text": "The image shows a man and a woman in what appears to be a car.",
  "clip_score": 0.642
}
```