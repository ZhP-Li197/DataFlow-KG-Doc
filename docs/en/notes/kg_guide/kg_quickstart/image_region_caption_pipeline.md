---
title: Image Region Captioning Pipeline
createTime: 2026/01/11 22:04:27
icon: mdi:image-text
permalink: /en/mm_guide/image_region_caption_pipeline/
---
## 1. Overview

The **Image Region Captioning Pipeline** is designed to generate detailed text descriptions for specific regions within an image. Combining the localization capabilities of Computer Vision with the understanding of Multimodal Large Models (VLMs), this pipeline identifies Regions of Interest (ROI) and generates precise natural language annotations for them.

This pipeline supports processing **pre-defined Bounding Box** data, visualizing these boxes, and then feeding them into a VLM for caption generation.

We support the following application scenarios:

* **Dense Captioning**: Generating descriptions for multiple objects within a single image.
* **Fine-grained Image Understanding**: Focusing on local details rather than global descriptions.
* **Dataset Augmentation**: Constructing image-text pair datasets that include localization information.

The main process of the pipeline includes:

1. **Data Loading**: Reading source data containing image paths and bounding box information.
2. **BBox Processing & Visualization**: Processing input bounding boxes and generating a version of the image with visual markers (e.g., drawn boxes).
3. **Region Caption Generation**: Using a VLM to generate text descriptions based on the marked images or specific regions.

---

## 2. Quick Start

### Step 1: Create a Working Directory

```bash
mkdir run_region_caption
cd run_region_caption

```

### Step 2: Prepare the Script

Save the code in the "Pipeline Example" section below as `region_caption_pipeline.py`.

### Step 3: Configure Parameters

Ensure the input file (jsonl) contains `image` and `bbox` fields.

```bash
# Install dependencies
pip install open-dataflow vllm

```

### Step 4: Run

```bash
python region_caption_pipeline.py \
  --model_path "/path/to/Qwen2.5-VL-3B-Instruct" \
  --first_entry_file "data/region_captions.jsonl" \
  --output_jsonl_path "data/results.jsonl"

```

---

## 3. Data Flow & Logic

### 1. **Input Data**

The input data typically contains the image path and a list of corresponding bounding boxes:

* **image**: Path to the image file.
* **bbox**: List of bounding box coordinates, typically in `[[x, y, w, h], ...]` or `[[x1, y1, x2, y2], ...]` format (depending on configuration).

**Input Data Example**:

```json
{
    "image": "./images/kitchen.jpg",
    "bbox": [[196, 104, 310, 495], [50, 60, 100, 200]]
}

```

### 2. **Core Operator Logic**

This pipeline chains two core operators to complete the task:

#### A. **ImageBboxGenerator**

This operator handles the vision-level tasks.

* **Input**: Raw image + `bbox` data.
* **Functionality**: Reads bounding boxes and draws them onto the image (visualization) or preprocesses them according to configuration.
* **Configuration (`ExistingBBoxDataGenConfig`)**: Controls parameters like `max_boxes` and visualization options (`draw_visualization`).
* **Output**: Generates a new image path containing visual markers (`image_with_bbox`).

#### B. **PromptedVQAGenerator**

This operator is responsible for generating text using the VLM.

* **Input**: The `image_with_bbox` generated in the previous step.
* **Functionality**: The VLM receives the marked image and generates descriptions for the corresponding regions based on prompts.
* **Output**: Region description text.

### 3. **Output Data**

The final output data will contain the processed image path and the generated descriptions:

* **image_with_bbox**: Path to the image with drawn boxes.
* **mdvp_record**: List of generated region descriptions.

**Output Data Example**:

```json
{
    "image": "./images/kitchen.jpg",
    "image_with_bbox": "./images/kitchen_visualized.jpg",
    "mdvp_record": [
        "A wooden chair located near the table.",
        "A white refrigerator in the background."
    ]
}

```

---

## 4. Pipeline Example

Below is the complete `ImageRegionCaptioningPipeline` code implementation.

```python
import argparse
from dataflow.serving.local_model_vlm_serving import LocalModelVLMServing_vllm
from dataflow.operators.core_vision.generate.image_bbox_generator import (
    ImageBboxGenerator, 
    ExistingBBoxDataGenConfig
)
from dataflow.operators.core_vision.generate.prompted_vqa_generator import (
    PromptedVQAGenerator
)
from dataflow.utils.storage import FileStorage


class ImageRegionCaptioningPipeline:
    def __init__(
        self,
        model_path: str,
        *,
        hf_cache_dir: str | None = None,
        download_dir: str = "./ckpt/models",
        device: str = "cuda",
        # Storage & Paths
        first_entry_file: str = "./dataflow/example/image_to_text_pipeline/region_captions.jsonl",
        cache_path: str = "./dataflow/example/cache",
        file_name_prefix: str = "region_caption",
        cache_type: str = "jsonl",
        # Keys
        input_image_key: str = "image",
        input_bbox_key: str = "bbox",
        image_with_bbox_path: str = 'image_with_bbox', # Key for intermediate image
        output_key: str = "mdvp_record",
        # BBox Config
        max_boxes: int = 10,
        input_jsonl_path: str = "./dataflow/example/image_to_text_pipeline/region_captions.jsonl",
        output_jsonl_path: str = "./dataflow/example/image_to_text_pipeline/region_captions_results_v1.jsonl",
        output_image_with_bbox_path: str = "./dataflow/example/image_to_text_pipeline/image_with_bbox_results_v1.jsonl",
        draw_visualization: bool = True
    ):
        # 1. 初始化存储 (Storage)
        # 用于 BBox 生成阶段的存储
        self.bbox_storage = FileStorage(
            first_entry_file_name=first_entry_file,
            cache_path=cache_path,
            file_name_prefix=file_name_prefix,
            cache_type=cache_type
        )
        
        # 2. 配置 BBox 生成器
        self.cfg = ExistingBBoxDataGenConfig(
            max_boxes=max_boxes,
            input_jsonl_path=input_jsonl_path,
            output_jsonl_path=output_image_with_bbox_path,
        )

        # 3. 初始化 Caption 阶段的存储
        # 注意：这里接续了上一步的输出路径
        self.caption_storage = FileStorage(
            first_entry_file_name=output_image_with_bbox_path,
            cache_path=cache_path,
            file_name_prefix=file_name_prefix,
            cache_type=cache_type
        )

        # 4. 初始化 VLM 服务
        self.serving = LocalModelVLMServing_vllm(
            hf_model_name_or_path=model_path,
            hf_cache_dir=hf_cache_dir,
            hf_local_dir=download_dir,
            vllm_tensor_parallel_size=1,
            vllm_temperature=0.7,
            vllm_top_p=0.9,
            vllm_max_tokens=512,
        )

        # 5. 初始化核心算子
        self.bbox_generator = ImageBboxGenerator(config=self.cfg)
        self.caption_generator = PromptedVQAGenerator(serving=self.serving)
        
        self.input_image_key = input_image_key
        self.input_bbox_key = input_bbox_key
        self.output_key = output_key
        self.image_with_bbox_path = image_with_bbox_path

    def forward(self):
        # 步骤 1: 生成带 BBox 可视化的图像
        print(">>> [Pipeline] Step 1: Processing BBoxes and Visualizing...")
        self.bbox_generator.run(
            storage=self.bbox_storage.step(),
            input_image_key=self.input_image_key,
            input_bbox_key=self.input_bbox_key,
            output_key=self.image_with_bbox_path,
        )

        # 步骤 2: 基于可视化图像生成描述
        print(">>> [Pipeline] Step 2: Generating Region Captions...")
        self.caption_generator.run(
            storage=self.caption_storage.step(),
            input_image_key='image_with_bbox' # 使用上一步生成的带框图像
        )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Image region captioning with DataFlow")
 
    parser.add_argument("--model_path", default="/data0/happykeyan/Models/Qwen2.5-VL-3B-Instruct")
    parser.add_argument("--hf_cache_dir", default="~/.cache/huggingface")
    parser.add_argument("--download_dir", default="./ckpt/models")
    parser.add_argument("--device", choices=["cuda", "cpu", "mps"], default="cuda")

    parser.add_argument("--first_entry_file", default="./dataflow/example/image_to_text_pipeline/region_captions.jsonl")
    parser.add_argument("--cache_path", default="./dataflow/example/cache")
    parser.add_argument("--file_name_prefix", default="region_caption")
    parser.add_argument("--cache_type", default="jsonl")
    
    parser.add_argument("--input_image_key", default="image")
    parser.add_argument("--input_bbox_key", default="bbox")
    parser.add_argument("--output_key", default="mdvp_record")

    parser.add_argument("--max_boxes", type=int, default=10)
    parser.add_argument("--input_jsonl_path", default="./dataflow/example/image_to_text_pipeline/region_captions.jsonl")
    parser.add_argument("--output_jsonl_path", default="./dataflow/example/image_to_text_pipeline/region_captions_results_v1.jsonl")
    parser.add_argument("--output_image_with_bbox_path", default="./dataflow/example/image_to_text_pipeline/image_with_bbox_results_v1.jsonl")
    parser.add_argument("--draw_visualization", type=bool, default=True)

    args = parser.parse_args()

    pipe = ImageRegionCaptioningPipeline(
        model_path=args.model_path,
        hf_cache_dir=args.hf_cache_dir,
        download_dir=args.download_dir,
        device=args.device,
        first_entry_file=args.first_entry_file,
        cache_path=args.cache_path,
        file_name_prefix=args.file_name_prefix,
        cache_type=args.cache_type,
        input_image_key=args.input_image_key,
        input_bbox_key=args.input_bbox_key,
        output_key=args.output_key,
        max_boxes=args.max_boxes,
        input_jsonl_path=args.input_jsonl_path,
        output_image_with_bbox_path=args.output_image_with_bbox_path,
        draw_visualization=args.draw_visualization
    )
    pipe.forward()

```

