---
title: ImageDeduplicateFilter
createTime: 2025/10/15 19:24:01
# icon: material-symbols-light:image
permalink: /zh/mm_operators/filter/image_deduplicate_filter/
---
## 📘 概述
`ImageDeduplicateFilter` 是一个基于 **CLIP 特征相似度** 的图像去重算子，用于从大规模图像集合中剔除**近重复样本**，只保留每一簇中一张代表图像，并可记录每张图像与其它图像的最高相似度，方便后续分析。



## ```__init__```函数
```python
def __init__(
    self,
    model_name: str = "openai/clip-vit-base-patch32",
    threshold: float = 0.90,
    batch_size: int = 32,
    device: str = "cuda" if torch.cuda.is_available() else "cpu"
):
  ...
```

## `init`参数说明
| 参数名        | 类型        | 默认值                          | 说明 |
| :----------- | :---------- | :----------------------------- | :--- |
| `model_name` | `str`       | `"openai/clip-vit-base-patch32"` | CLIP 模型名称或本地路径；内部通过 `CLIPProcessor` / `CLIPModel` 加载图像编码器，用于提取图像嵌入。 |
| `threshold`  | `float`     | `0.90`                         | 判定两张图像为“近重复”的余弦相似度阈值，范围 `[0,1]`；数值越高，去重越严格。 |
| `batch_size` | `int`       | `32`                           | 进行 CLIP 前向推理时的批大小；数值过大可能导致显存占用上升。 |
| `device`     | `str`       | `"cuda"`（若可用，否则 `"cpu"`） | 模型推理设备；通常为 `"cuda"` 或 `"cpu"`。 |




## `run`函数
```python
def run(
    self, 
    storage: DataFlowStorage,
    input_image_key: str = "image",
    output_score_key: str = "max_similarity"
):
    ...
```
执行算子主逻辑：
1. **图像特征提取（CLIP Embedding）**  
   - 从 `storage` 读取 DataFrame，取出 `input_image_key` 指定列（默认 `"image"`）作为图像输入列表。  
   - 以 `batch_size` 为批次，将图像逐批送入 CLIP 的 `CLIPProcessor` 与 `CLIPModel.get_image_features`：  
     - 使用 `_load_image` 将路径或原始数据转换为 PIL 图像；  
     - 丢弃加载失败的样本，仅对有效图像计算特征；  
     - 对输出特征做 L2 归一化，得到单位向量嵌入。  
   - 返回：  
     - `embeddings`：形状为 `(N_valid, D)` 的 numpy 数组；  
     - `valid_indices`：有效图像在原始 DataFrame 中的行索引。

2. **余弦相似度矩阵与重复查找**  
   - 对所有嵌入一次性调用 `cosine_similarity(embeddings, embeddings)`，得到 `N_valid × N_valid` 相似度矩阵。  
   - 遍历所有 `(i, j)`（只取 `i < j`）的位置：  
     - 当 `similarities[i, j] >= threshold`（默认 `0.90`）时，认为第 `j` 个样本是第 `i` 个样本的“近重复”。  
     - 将 `j` 加入 `duplicate_indices` 集合，并记录一条 `duplicate_pairs` 信息：  
       `{"kept_idx": i, "removed_idx": j, "similarity": similarities[i, j]}`。

3. **构建输出 DataFrame 与最大相似度列**  
   - 基于 `valid_indices` 构建 `dataframe_valid`，只包含嵌入成功的样本，并重置索引。  
   - 初始化 `max_similarities` 数组，长度等于 `len(embeddings)`，初始为 `0`。  
   - 遍历所有 `duplicate_pairs`：  
     - 对 `kept_idx` 与 `removed_idx` 更新其 `max_similarities[...]`，记录其与其它样本之间的最高相似度。  
   - 将 `max_similarities` 写入新列 `output_score_key`（默认 `"max_similarity"`）。  
   - 构建布尔掩码 `keep_mask`，对所有在 `duplicate_indices` 中的索引标记为 `False`，实现只保留每一簇中的首个样本。  
   - 过滤后得到 `dataframe_filtered`，重置索引并写回 `storage`。  
   - 最终返回 `[input_image_key, output_score_key]`，作为后续算子的输入列名列表。



参数
| 参数名            | 类型              | 默认值           | 说明 |
| :---------------- | :---------------- | :--------------- | :--- |
| `storage`         | `DataFlowStorage` | 无               | Dataflow 的读写存储对象，内部包含待处理的 DataFrame。 |
| `input_image_key` | `str`             | `"image"`        | 输入图像列名；列中的每个元素应为图像路径或可被 `_load_image` 解析的图像对象。 |
| `output_score_key`| `str`             | `"max_similarity"` | 输出分数字段名，用于存储每张保留图像与其它图像之间的最高相似度。 |



## 🧠 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import ImageDeduplicateFilter

# 1) 准备 FileStorage（至少包含 image 列，值为图像路径或可被 _load_image 解析的内容）
storage = FileStorage(
    first_entry_file_name="./dataflow/example/test_image_filter/test_image_filter.jsonl",
    cache_path="./cache_local",
    file_name_prefix="image_dedupe_filter",
    cache_type="jsonl"
)

# 2) 初始化算子（可使用本地或 HF 的 CLIP 权重）
filt = ImageDeduplicateFilter(
    model_name="openai/clip-vit-base-patch32",  # 或本地路径
    threshold=0.90,                             # 去重余弦相似度阈值
    batch_size=32,                              # CLIP 前向 batch 大小
    device="cuda"                               # 或 "cpu"
)

# 3) 执行去重过滤
cols = filt.run(
    storage=storage.step(),
    input_image_key="image",
    output_score_key="max_similarity"
)
print(cols)  # ["image", "max_similarity"]
```

### 🧾 默认输出格式（Output Format）
| 字段名                | 类型     | 默认值            | 说明 |
| :-------------------- | :------- | :---------------- | :--- |
| `image`（或 `input_image_key` 指定列） | `string` | 无                | 保留的图像路径或图像标识；近重复图像已被过滤，仅保留各簇中的代表样本。 |
| `max_similarity`（或 `output_score_key`） | `float`  | 无                | 该图像与集合中其它图像之间的最高余弦相似度，范围 `[0,1]`；可用于分析去重强度或召回质量。 |


示例输入：
```jsonl
{
  "image": "a.jpg"
}
{
  "image": "b.jpg"
}
{
  "image": "a_copy.jpg"
}

```

示例输出：
```jsonl
{
  "image": "a.jpg",
  "max_similarity": 0.96
}
{
  "image": "b.jpg",
  "max_similarity": 0.12
}
```