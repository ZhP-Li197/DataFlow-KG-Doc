---
title: 边界框区域描述生成 (RegionCap)
createTime: 2025/10/21 16:00:00
icon: material-symbols-light:image
permalink: /zh/mm_operators/generate/image_region_caption/
---

## 📘 概述
`ImageRegionCaptionGenerate` 是一个先进的多模态数据处理算子，专门用于通过**分析边界框**来生成图像中特定区域的详细描述。该算子支持两种不同的边界框获取工作流程：

* **输入提供的边界框**：使用输入 JSONL 数据中预定义的边界框
* **自动提取的边界框**：使用计算机视觉技术（边缘检测 + 轮廓分析）自动检测图像中的感兴趣区域

## ```__init__```
```python
def __init__(
    self, 
    llm_serving: LLMServingABC, 
    config: Optional[ExistingBBoxDataGenConfig] = None
):
```

## `init` 参数
| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| llm_serving | LLMServingABC | 无默认值（必需） | 用于生成区域描述的视觉语言模型服务实例 |
| config | Optional[ExistingBBoxDataGenConfig] | None | 边界框处理参数的配置对象。如果为 None，则使用默认配置 |

## `run`
```python
def run(
    self, 
    storage: DataFlowStorage, 
    input_image_key: str = "image", 
    input_bbox_key: str = "bbox", 
    output_key: str = "mdvp_record"
):
```

### 参数
| 参数名 | 类型 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| storage | DataFlowStorage | 无默认值（必需） | 用于文件操作和缓存路径管理的存储实例 |
| input_image_key | str | "image" | 输入 JSONL 数据中图像路径的字段名 |
| input_bbox_key | str | "bbox" | 输入数据中边界框的字段名。如果缺失，则自动从图像中提取 |
| output_key | str | "mdvp_record" | 结果数据中输出区域描述记录的字段名 |

## 🧠 使用示例

```python
from dataflow.serving.local_model_vlm_serving import LocalModelVLMServing_vllm
from dataflow.operators.core_vision.generate.image_region_caption_generator import (
    ImageRegionCaptionGenerate, 
    ExistingBBoxDataGenConfig
)
from dataflow.utils.storage import FileStorage

storage = FileStorage(
    first_entry_file_name="example/input.jsonl",
    cache_path="example/cache",
    file_name_prefix="region_caption",
    cache_type="jsonl"
)

model = LocalModelVLMServing_vllm(
    hf_model_name_or_path="./Models/Qwen2.5-VL-7B-Instruct",
    vllm_tensor_parallel_size=1,
    vllm_temperature=0.0,
    vllm_top_p=0.9,
    vllm_max_tokens=1024
)

cfg = ExistingBBoxDataGenConfig(
    max_boxes=10,
    input_jsonl_path="example/input.jsonl",
    output_jsonl_path="example/output.jsonl",
    draw_visualization=True
)

operator = ImageRegionCaptionGenerate(llm_serving=model, config=cfg)

operator.run(
    storage=storage.step(),
    input_image_key="image",
    input_bbox_key="bbox",
    output_key="mdvp_record"
)
```

### 🧾 默认输出格式
| 字段名 | 类型 | 描述 |
| :--- | :--- | :--- |
| `image` | `str` | 原始图像文件路径 |
| `mdvp_record` | `list` | VLM 生成的区域描述 |
| `meta_info` | `dict` | 处理元数据和边界框信息 |
| `meta_info.type` | `str` | 边界框来源类型："with_bbox"（输入提供）或 "without_bbox"（自动提取） |
| `meta_info.bbox` | `list` | 原始边界框坐标，格式为 [[x,y,width,height], ...] |
| `meta_info.normalized_bbox` | `list` | 归一化边界框坐标 [[x0,y0,x1,y1], ...]，用零填充到 max_boxes |
| `meta_info.image_with_bbox` | `str` | 带编号边界框的可视化图像路径 |

示例输入：
```jsonl
{"image": "/path/to/image1.png","bbox":[[196,104,310,495]]}
{"image": "/path/to/image2.png"}
```

示例输出：
```jsonl
{
    "image": "/path/to/image1.png", 
    "mdvp_record": ["<region1> is a green rectangular box highlighting a section of the kitchen table with a floral tablecloth."], 
    "meta_info": 
    {
        "type": "with_bbox", 
        "bbox": [[196, 104, 310, 495]], 
        "normalized_bbox": [[0.128, 0.125, 0.329, 0.72]], 
        "image_with_bbox": "/path/to/image_with_bbox1.jpg"
    }
}
{
    "image": "/path/to/image2.png", 
    "mdvp_record": ["<region1> is a yellow and blue fire hydrant located on a sidewalk."], 
    "meta_info": 
    {
        "type": "without_bbox", 
        "bbox": [[19.1299991607666, 359.2300109863281, 148.08999633789062, 271.32000732421875]], 
        "normalized_bbox": [[0.045, 0.561, 0.392, 0.985]], 
        "image_with_bbox": "/path/to/image_with_bbox2.jpg"
    }
}
```