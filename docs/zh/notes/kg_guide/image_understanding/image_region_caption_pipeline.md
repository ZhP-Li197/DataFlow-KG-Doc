---
title: 图像区域描述生成流水线
createTime: 2026/01/11 22:04:27
icon: mdi:image-text
permalink: /zh/mm_guide/image_region_caption_pipeline/
---
## 1. 概述

**图像区域描述生成流水线 (Image Region Captioning Pipeline)** 旨在为图像中的特定区域生成详细的文本描述。该流水线结合了计算机视觉的定位能力与多模态大模型的理解能力，能够识别图像中的感兴趣区域（ROI），并为其生成精确的自然语言标注。

该流水线支持处理**预定义边界框 (Bounding Box)** 数据，并将其可视化后输入 VLM 进行描述生成。

我们支持以下应用场景：

* **密集描述生成 (Dense Captioning)**：为图像中的多个物体分别生成描述。
* **细粒度图像理解**：关注图像的局部细节而非全局描述。
* **数据集增强**：构建带定位信息的图文对数据集。

流水线的主要流程包括：

1. **数据加载**：读取包含图像和边界框信息的源数据。
2. **边界框处理与可视化**：处理输入的边界框，生成带有可视化标记（如画框）的图像版本。
3. **区域描述生成**：利用 VLM 针对标记后的图像或特定区域生成文本描述。

---

## 2. 快速开始

### 第一步：准备工作目录

```bash
mkdir run_region_caption
cd run_region_caption

```

### 第二步：准备脚本

将下文“流水线示例”中的代码保存为 `region_caption_pipeline.py`。

### 第三步：配置运行参数

确保输入文件（jsonl）包含 `image` 和 `bbox` 字段。

```bash
# 安装依赖
pip install open-dataflow vllm

```

### 第四步：一键运行

```bash
python region_caption_pipeline.py \
  --model_path "/path/to/Qwen2.5-VL-3B-Instruct" \
  --first_entry_file "data/region_captions.jsonl" \
  --output_jsonl_path "data/results.jsonl"

```

---

## 3. 数据流与流水线逻辑

### 1. **输入数据**

输入数据通常包含图像路径和对应的边界框列表：

* **image**：图像文件路径。
* **bbox**：边界框坐标列表，通常格式为 `[[x, y, w, h], ...]` 或 `[[x1, y1, x2, y2], ...]`（取决于具体配置）。

**输入数据示例**：

```json
{
    "image": "./images/kitchen.jpg",
    "bbox": [[196, 104, 310, 495], [50, 60, 100, 200]]
}

```

### 2. **核心算子逻辑**

该流水线通过串联两个核心算子来完成任务：

#### A. **ImageBboxGenerator（边界框处理器）**

该算子负责处理视觉层面的任务。

* **输入**：原始图像 + `bbox` 数据。
* **功能**：读取边界框，将其绘制在图像上（可视化），或者根据配置进行预处理。
* **配置 (`ExistingBBoxDataGenConfig`)**：控制最大框数量 (`max_boxes`) 和可视化选项 (`draw_visualization`)。
* **输出**：生成带有视觉标记的新图像路径（`image_with_bbox`）。

#### B. **PromptedVQAGenerator（VQA 生成器）**

该算子负责利用 VLM 生成文本。

* **输入**：上一步生成的 `image_with_bbox`。
* **功能**：VLM 接收带有标记的图像，根据提示生成对应区域的描述。
* **输出**：区域描述文本。

### 3. **输出数据**

最终生成的输出数据将包含处理后的图像路径和生成的描述：

* **image_with_bbox**：画了框的图像路径。
* **mdvp_record**：生成的区域描述列表。

**输出数据示例**：

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

## 4. 流水线示例

以下是完整的 `ImageRegionCaptioningPipeline` 代码实现。

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

