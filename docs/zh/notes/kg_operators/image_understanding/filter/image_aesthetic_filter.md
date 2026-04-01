---
title: ImageAestheticFilter
createTime: 2025/10/15 15:45:04
# icon: material-symbols-light:image
permalink: /zh/mm_operators/filter/image_aesthetic_filter/
---
## 📘 概述
`ImageAestheticFilter` 对输入图像做**基础质量 / 美学过滤**，综合评估：

- 清晰度（是否模糊）
- 整体亮度（是否过暗 / 过亮）
- 对比度（是否灰蒙蒙一片）
- 极端黑/白像素比例（是否几乎全黑或全白）

用于剔除模糊、曝光异常或几乎纯色背景的**低质量图片**，为后续检测、识别、检索或生成任务提供更干净的输入数据。


## ```__init__```函数
```python
def __init__(
    self,
    blur_thresh: float = 150.0,
    brightness_range: tuple[float, float] = (30, 230),
    contrast_thresh: float = 40.0,
    max_black_ratio: float = 0.90,
    max_white_ratio: float = 0.90
):
```


## `init`参数说明
| 参数名              | 类型                    | 默认值                 | 说明 |
| :------------------ | :---------------------- | :--------------------- | :--- |
| `blur_thresh`       | `float`                 | `150.0`                | 清晰度阈值，基于拉普拉斯方差（Variance of Laplacian）。数值越高代表图像越清晰；低于该阈值则认为图像模糊。 |
| `brightness_range`  | `tuple[float, float]`   | `(30, 230)`            | 允许的整体亮度范围（灰度均值），过低视为过暗，过高视为过亮；落在区间内才视为亮度正常。 |
| `contrast_thresh`   | `float`                 | `40.0`                 | 对比度阈值，基于灰度图标准差；低于该值说明图像整体灰蒙，对比度不足。 |
| `max_black_ratio`   | `float`                 | `0.90`                 | 允许的**近纯黑像素**最大比例（`gray < 10`），超过则认为图像几乎全黑。 |
| `max_white_ratio`   | `float`                 | `0.90`                 | 允许的**近纯白像素**最大比例（`gray > 245`），超过则认为图像几乎全白。 |






## `run`函数
```python
def run(
    self,
    storage: DataFlowStorage,
    input_image_key: str = "image_path",
):
    ...
```
执行算子主逻辑：
1. **读取数据**  
   从 `storage` 中读取当前 DataFrame，`input_image_key` 列给出图像路径（默认 `"image_path"`）。

2. **逐图像质量评估**  
   对每一行样本执行以下步骤：
   1. 使用 OpenCV 以灰度方式读取图像：`cv2.imread(path, cv2.IMREAD_GRAYSCALE)`；若读取失败，直接判定为不合格。  
   2. 计算清晰度：  
      - 使用 `cv2.Laplacian(gray, cv2.CV_64F).var()` 得到拉普拉斯方差；  
      - 与 `blur_thresh` 比较，低于阈值认为模糊。  
   3. 计算亮度：  
      - 灰度图均值 `gray.mean()`，要求在 `brightness_range = (bright_min, bright_max)` 区间内。  
   4. 计算对比度：  
      - 灰度图标准差 `gray.std()`，要求 ≥ `contrast_thresh`。  
   5. 计算极端像素比例：  
      - 近黑像素比例 `black_ratio = (gray < 10).sum() / total_pixels`；  
      - 近白像素比例 `white_ratio = (gray > 245).sum() / total_pixels`；  
      - 若 `black_ratio > max_black_ratio` 或 `white_ratio > max_white_ratio`，则认为图像过于极端（几乎纯黑/纯白）。  

3. **综合判定**  
   仅当 **清晰度达标** 且 **亮度正常** 且 **对比度达标** 且 **极端像素比例不过高** 时，  
   将该样本的 `quality` 记为 `True`，否则记为 `False`。


参数
| 参数名            | 类型              | 默认值          | 说明 |
| :---------------- | :---------------- | :-------------- | :--- |
| `storage`         | `DataFlowStorage` | 无              | Dataflow 的读写存储对象。 |
| `input_image_key` | `str`             | `"image_path"`  | 图像路径所在列名。 |




## 🧠 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import ImageAestheticFilter

# 1) 准备 FileStorage（至少包含 image_path 列）
storage = FileStorage(
    first_entry_file_name="./dataflow/example/test_image_filter/test_image_filter.jsonl",
    cache_path="./cache_local",
    file_name_prefix="aes_filter",
    cache_type="jsonl"
)

# 2) 初始化美学过滤算子（可按需要调整阈值）
aes_filter = ImageAestheticFilter(
    blur_thresh=150.0,
    brightness_range=(30, 230),
    contrast_thresh=40.0,
    max_black_ratio=0.90,
    max_white_ratio=0.90,
)

# 3) 执行过滤：仅保留通过质量检查的图片
cols = aes_filter.run(
    storage=storage.step(),
    input_image_key="image_path",
)
print(cols)  # ["image_path"]
```

### 🧾 默认输出格式（Output Format）
| 字段名                                          | 类型      | 默认值 | 说明 |
| :---------------------------------------------- | :-------- | :----- | :--- |
| `image_path`（或 `input_image_key` 指定列）     | `string`  | 无     | 输入图像路径。 |
| `quality`                                      | `boolean` | 无     | 该图像是否通过美学/质量过滤；仅 `quality == true` 的行会保留在最终输出中。 |




示例输入：
```jsonl
{
  "image_path": "1.png"
}
{
  "image_path": "2.jpg"
}
```

示例输出：
```jsonl
{
  "image_path": "1.png",
  "quality": true
}
```