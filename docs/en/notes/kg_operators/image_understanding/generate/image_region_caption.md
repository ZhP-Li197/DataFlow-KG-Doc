---
title: Bounding Box Regional Caption Generation (RegionCap)
createTime: 2025/10/21 16:00:00
icon: material-symbols-light:image
permalink: /en/mm_operators/generate/image_region_caption/
---



## 📘 Overview
`ImageRegionCaptionGenerate`  is a sophisticated multi-modal data processing operator designed to generate detailed region-specific captions for images by analyzing bounding boxes. The operator supports two distinct workflows for bounding box acquisition:

* **Input-Provided Bounding Boxes**: Uses pre-defined bounding boxes from the input JSONL data
* **Auto-Extracted Bounding Boxes**: Automatically detects regions of interest in images using computer vision techniques (edge detection + contour analysis)


## ```__init__```
```python
def __init__(
    self, 
    llm_serving: LLMServingABC, 
    config: Optional[ExistingBBoxDataGenConfig] = None
):
```


## `init` Parameters
| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| llm_serving | LLMServingABC | No default (required) | Vision-Language Model serving instance for generating region captions |
| config | Optional[ExistingBBoxDataGenConfig] | None | Configuration object for bounding box processing parameters. If None, uses default configuration |


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


### Parameters
| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| storage | DataFlowStorage | No default (required) | Storage instance for file operations and cache path management |
| input_image_key | str | "image" | Field name for image path in input JSONL data |
| input_bbox_key | str | "bbox" | Field name for bounding boxes in input data. If missing, automatically extracts from image |
| output_key | str | "mdvp_record" | Field name for output region caption records in result data |


## 🧠 Example Usage

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

### 🧾 Default Output Format
| Field | Type | Description |
| :--- | :--- | :--- |
| `image` | `str` | Original image file path |
| `mdvp_record` | `list` | VLM-generated region captions |
| `meta_info` | `dict` | Processing metadata and bounding box information |
| `meta_info.type` | `str` | Bounding box source type: "with_bbox" (input provided) or "without_bbox" (auto-extracted) |
| `meta_info.bbox` | `list` | Original bounding box coordinates in format [[x,y,width,height], ...] |
| `meta_info.normalized_bbox` | `list` | Normalized bounding box coordinates [[x0,y0,x1,y1], ...] padded to max_boxes with zeros |
| `meta_info.image_with_bbox` | `str` | Path to visualization image with numbered bounding boxes |


Example Input:
```jsonl
{"image": "/path/to/image1.png","bbox":[[196,104,310,495]]}
{"image": "/path/to/image2.png"}
```

Example Output:
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