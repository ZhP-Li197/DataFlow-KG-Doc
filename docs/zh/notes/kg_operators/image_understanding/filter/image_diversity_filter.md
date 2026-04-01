---
title: ImageDiversityFilter
createTime: 2025/10/15 19:34:47
# icon: material-symbols-light:image
permalink: /zh/mm_operators/filter/image_diversity_filter/
---
## 📘 概述
`ImageDiversityFilter` 是一个同时作用于**文本**与**图像**的去重过滤算子，目标是在清洗过程中尽量保留 **内容更加多样** 的图文样本。  
它通过两条独立但互补的信号进行判定：

1. 文本侧：基于 **TF-IDF + 余弦相似度** 估计当前文本与历史已保留文本的相似度；  
2. 图像侧：基于 **感知哈希（pHash）汉明距离** 衡量图像视觉近似度。

只有当“文本不太相似”**且**“图像也不太相似”时，样本才会被保留，否则视为近重复样本并过滤。

这一策略可以避免只看图像或只看文本导致的误判，有助于构建**去重后、语义多样性高**的多模态数据集。

## ```__init__```函数
```python
def __init__(
    self,
    text_thresh: float = 0.8,
    hash_size: int = 8,
    img_dist_thresh: int = 5
):
    ...
```

## `init`参数说明
| 参数名         | 类型   | 默认值  | 说明 |
| :------------ | :----- | :------ | :--- |
| `text_thresh` | `float` | `0.8`  | 文本侧去重阈值：若当前 caption 与历史保留文本的 TF-IDF 余弦相似度 **小于**该值，则认为“文本足够不同”；否则判为文本近重复。 |
| `hash_size`   | `int`   | `8`    | 感知哈希大小，传入 `imagehash.phash` 的 `hash_size`，数值越大哈希维度越高、计算稍重但区分力更强。 |
| `img_dist_thresh` | `int` | `5` | 图像侧去重阈值：若当前图像哈希与历史保留图像哈希的**最小汉明距离** **大于**该值，则认为“图像足够不同”；否则判为图像近重复。 |


## `run`函数
```python
def run(
    self,
    storage: DataFlowStorage,
    input_image_key: str = "image_path",
    input_text_key: str = "text"
):
    ...
```
执行算子主逻辑：
1. 从 `storage` 读取 DataFrame，逐行读取 `input_image_key` 与 `input_text_key` 指定的列。  
2. **文本侧**：用 `TextDuplicateFilter` 计算当前文本与最近语料的 TF-IDF 余弦相似度最大值 `max_sim`；若 `max_sim < text_thresh` → 记为“文本唯一”，并把当前文本加入语料缓存；否则记为“文本近重复”。  
3. **图像侧**：用 `ImageDuplicateFilter` 计算当前图像 pHash 与最近图像哈希的最小汉明距离 `min_dist`；若历史为空或 `min_dist > img_dist_thresh` → 记为“图像唯一”，并把当前图像哈希入库；否则记为“图像近重复”。  
4. 仅当“文本唯一 **且** 图像唯一”同时为真时保留该行样本；否则将其视为近重复样本并过滤掉。  
5. 将保留下来的样本重置索引后写回 `storage`，并返回 `[input_image_key, input_text_key]` 作为后续算子的输入列名列表。  


参数
| 参数名            | 类型              | 默认值         | 说明 |
| :---------------- | :---------------- | :------------- | :--- |
| `storage`         | `DataFlowStorage` | 无             | Dataflow 的读写存储对象，内部包含待去重的图文数据表。 |
| `input_image_key` | `str`             | `"image_path"` | 输入图像列名。列中元素应为图像路径（或其他可被 PIL 打开且存在于磁盘的路径）。 |
| `input_text_key`  | `str`             | `"text"`       | 输入文本列名，通常为 caption 或描述字段，用于计算 TF-IDF 文本相似度。 |

## 🧠 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import ImageDiversityFilter

# 1) 准备 FileStorage（至少包含 image_path 与 text 两列）
storage = FileStorage(
    first_entry_file_name="./dataflow/example/test_image_filter/test_image_filter.jsonl",
    cache_path="./cache_local",
    file_name_prefix="image_diversity_filter",
    cache_type="jsonl"
)

# 2) 初始化算子
filt = ImageDiversityFilter(
    text_thresh=0.8,   # 文本相似度阈值（越大越严格）
    hash_size=8,       # 感知哈希尺寸
    img_dist_thresh=5  # 图像最小汉明距离阈值（越大要求差异越明显）
)

# 3) 执行过滤
cols = filt.run(
    storage=storage.step(),
    input_image_key="image_path",
    input_text_key="text"
)
print(cols)  # ["image_path", "text"]
```

### 🧾 默认输出格式（Output Format）

| 字段名                                | 类型     | 默认值 | 说明 |
| :------------------------------------ | :------- | :----- | :--- |
| `image_path`（或 `input_image_key` 指定列） | `string` | 无     | 过滤后保留的图像路径；仅保留文本与图像均与历史样本不太相似的行。 |
| `text`（或 `input_text_key` 指定列）       | `string` | 无     | 与图像配对的文本描述；保证与历史已保留文本在 TF-IDF 空间中不过度相似。 |


示例输入：
```jsonl
{
  "image_path": "a.jpg",
  "text": "A cat sitting on a wooden chair."
}
{
  "image_path": "a_dup.jpg",
  "text": "A cat sits on a wooden chair."  
}
{
  "image_path": "b.jpg",
  "text": "A bus driving through a snowy mountain pass at night."
}
```

示例输出：
```jsonl
{
  "image_path": "a.jpg",
  "text": "A cat sitting on a wooden chair."
}
{
  "image_path": "b.jpg",
  "text": "A bus driving through a snowy mountain pass at night."
}

```