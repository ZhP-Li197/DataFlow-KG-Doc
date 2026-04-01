---
title: ImageClipFilter
createTime: 2025/10/15 15:48:32
# icon: material-symbols-light:image
permalink: /zh/mm_operators/filter/image_clip_filter/
---
## 📘 概述
`ImageClipFilter` 基于预训练 **CLIP** 模型，计算图像与文本描述的**语义相似度**，并按照给定阈值过滤不一致的图文对。  


## ```__init__```函数
```python
def __init__(
    self,
    model_name: str = "openai/clip-vit-base-patch32",
    device: str = None
):
    ...
```

## `init`参数说明
| 参数名        | 类型          | 默认值                             | 说明 |
| :----------- | :------------ | :--------------------------------- | :--- |
| `model_name` | `str`         | `"openai/clip-vit-base-patch32"`  | CLIP 模型本地路径或 Hugging Face Model ID；通过 `CLIPProcessor` / `CLIPModel` 加载（`use_safetensors=True`, `weights_only=False`）。 |
| `device`     | `str \| None` | `None`                            | 推理设备；`None` 时自动选择可用的 `"cuda"`，否则使用 `"cpu"`。 |



## `run`函数
```python
def run(
    self,
    storage: DataFlowStorage,
    input_image_key: str = "image",
    input_caption_key: str = "caption",
    threshold: float = 0.25
):
    ...
```
执行算子主逻辑：
1. 从 `storage` 读取 DataFrame，逐行读取 `input_image_key` 与 `input_caption_key` 指定的列。  
2. 对于每一行样本：  
   - 使用 `PIL.Image.open` 读取图像并转为 RGB；若图像无法读取则记为相似度 `0.0`。  
   - 若文本为空或仅包含空白字符，也记为相似度 `0.0`。  
   - 使用 `CLIPProcessor` 以 `text=[caption]`、`images=[image]` 组装输入张量，移动到指定 `device`。  
   - 前向通过 `CLIPModel` 得到 `image_embeds` 与 `text_embeds`，分别做 L2 归一化后计算点积，得到相似度 `sim`。  
   - 将 `sim` 裁剪到 `[0, 1]` 区间，得到该图文对的最终相似度分数。  
3. 若 `sim ≥ threshold`，则认为图像与 caption 语义一致，将该行标记为保留；否则视为不一致图文对并过滤。  
4. 将所有保留样本的行组成新的 DataFrame，重置索引后写回 `storage`。  
5. 返回 `[input_image_key, input_caption_key]` 作为后续算子的输入列名列表。  


参数
| 参数名             | 类型              | 默认值        | 说明 |
| :---------------- | :---------------- | :------------ | :--- |
| `storage`         | `DataFlowStorage` | 无            | Dataflow 的读写存储对象。 |
| `input_image_key` | `str`             | `"image"`     | 输入图片路径列名。 |
| `input_caption_key` | `str`           | `"caption"`   | 输入文本描述列名（caption）。 |
| `threshold`       | `float`           | `0.25`        | 图文对最小相似度阈值；仅当 CLIP 相似度 `≥ threshold` 时保留样本。 |



## 🧠 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import ImageClipFilter

# 1) 准备 FileStorage（至少包含 image 与 caption 两列）
storage = FileStorage(
    first_entry_file_name="./dataflow/example/test_image_filter/test_image_filter.jsonl",
    cache_path="./cache_local",
    file_name_prefix="image_clip_filter",
    cache_type="jsonl"
)

# 2) 初始化算子（可改为 HF 模型ID，如 "openai/clip-vit-base-patch32"）
filt = ImageClipFilter(
    model_name="openai/clip-vit-base-patch32",
    device=None  # 自动选择 cuda/cpu
)

# 3) 执行过滤：仅保留 CLIP 相似度 ≥ 0.25 的图文对
cols = filt.run(
    storage=storage.step(),
    input_image_key="image",
    input_caption_key="caption",
    threshold=0.25
)
print(cols)  # ["image", "caption"]
```

### 🧾 默认输出格式（Output Format）
| 字段 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `image` | `string` | 无 | 过滤后保留样本的图片路径。 |
| `caption` | `string` | 无 | 过滤后保留样本的文本描述（图文相似度 ≥ `threshold`）。 |


示例输入：
```jsonl
{
  "image": "1.png",
  "caption": "A bride and groom smiling in a car."
}
{
  "image": "2.jpg",
  "caption": "A red bus driving across a snowy mountain road at night."
}
```

示例输出：
```jsonl
{
  "image": "1.png",
  "caption": "A bride and groom smiling in a car."
}
```