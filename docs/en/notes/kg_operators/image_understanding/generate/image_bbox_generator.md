---
title: ImageBboxGenerator
createTime: 2026/01/11 21:49:37
permalink: /en/mm_operators/generate/image_bbox_generator/
---
## 📘 Overview

`ImageBboxGenerator` is an **Image Region Annotation & Prompt Preparation Operator**.

It is primarily used for data preprocessing in multimodal tasks (such as Grounding Caption). It handles raw data containing image paths, normalizes Regions of Interest (RoI), visualizes them, and generates structured Prompts for subsequent VLM inference.

Key Capabilities:

1. **Dual BBox Acquisition**:
* **Existing Mode**: Reads existing BBox coordinates directly from the input data.
* **Auto-Extraction Mode**: If no BBox is provided, automatically extracts salient object regions using OpenCV (Edge Detection + Contour Fitting).


2. **Coordinate Normalization**: Converts pixel coordinates into normalized coordinates (0-1 range) compliant with VLM input standards.
3. **Visualization Enhancement**: Generates images with numbered, colored bounding boxes to help the model understand "Region N" references.
4. **Prompt Construction**: Automatically generates prompts containing region count information (e.g., "Describe the content of each marked region...").

## 🏗️ `__init__` Function

```python
def __init__(self, config: Optional[ExistingBBoxDataGenConfig] = None):
    ...

```

### 🧾 Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `config` | `ExistingBBoxDataGenConfig` | `None` | Configuration object defining input/output paths and max box limits. |

#### `ExistingBBoxDataGenConfig` Details

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `max_boxes` | `int` | `10` | Max BBoxes per image (sorted by area). Zero-padded if fewer. |
| `input_jsonl_path` | `str` | `None` | **Required**. Path to the input JSONL file. |
| `output_jsonl_path` | `str` | `None` | **Required**. Path to save the processed results. |

## ⚡ `run` Function

```python
def run(
    self, 
    storage: DataFlowStorage, 
    input_image_key: str = "image", 
    input_bbox_key: str = "bbox", 
    output_key: str = "mdvp_record"
):
    ...

```

Executes the main logic:

1. **Data Loading**
Reads raw data from `config.input_jsonl_path`.
2. **BBox Acquisition (Extract/Get)**
* Checks each row for `input_bbox_key`.
* **Type A (With BBox)**: Uses the coordinates provided in the data.
* **Type B (Without BBox)**: Calls `extract_boxes_from_image` to extract object contours via adaptive thresholding and morphology, applying NMS (Non-Maximum Suppression) to remove duplicates.


3. **Normalization & Visualization**
* **Normalization**: Converts `[x, y, w, h]` to normalized `[x1, y1, x2, y2]` format, truncating or padding with `0.0` to match `max_boxes`.
* **Visualization**: Draws green rectangles and numeric labels on the original image, saving the result to `storage.cache_path`.


4. **Prompt Generation**
* Generates a fixed template prompt based on the valid box count:
> "Describe the content of each marked region in the image. There are {N} regions: \<region1\> to \<regionN\>."




5. **Result Export**
* Writes the complete record containing raw info, normalized BBoxes, visualization paths, and the Prompt to `config.output_jsonl_path`.



### 🧾 `run` Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `storage` | `DataFlowStorage` | N/A | Storage object, mainly used to provide the `cache_path`. |
| `input_image_key` | `str` | `"image"` | Field name for image paths in the input JSONL. |
| `input_bbox_key` | `str` | `"bbox"` | Field name for BBox data in the input JSONL. |
| `output_key` | `str` | `"mdvp_record"` | (Reserved) Key name for the output record. |

## 🧩 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.cv import ImageBboxGenerator, ExistingBBoxDataGenConfig

# 1) Configure Parameters
config = ExistingBBoxDataGenConfig(
    max_boxes=5,
    input_jsonl_path="./data/raw_images.jsonl",
    output_jsonl_path="./data/processed_with_prompts.jsonl"
)

# 2) Initialize Operator
# Note: This operator is for data prep and does not require a Serving instance
generator = ImageBboxGenerator(config=config)

# 3) Prepare Storage (Only for providing cache path)
storage = FileStorage(
    cache_path="./cache_vis_images",
    file_name_prefix="bbox_gen"
)

# 4) Execute Processing
# Automatically reads from config input, writes to config output
generator.run(
    storage=storage,
    input_image_key="image_path",
    input_bbox_key="ground_truth_bbox" # Will auto-extract if this column is missing
)

```

### 🧾 Output Data Format (Output JSONL)

Each line in the `output_jsonl_path` file contains:

```json
{
  "image": "/data/raw/cat.jpg",
  "type": "without_bbox", // or "with_bbox"
  "bbox": [[100, 200, 50, 60], ...], // Raw pixel coords [x, y, w, h]
  "normalized_bbox": [
      [0.1, 0.2, 0.15, 0.26], 
      [0.0, 0.0, 0.0, 0.0] // Zero-padded
  ],
  "result_file": "./cache_vis_images",
  "image_with_bbox": "./cache_vis_images/1_bbox_vis.jpg", // Path to visualized image
  "valid_bboxes_num": 1,
  "prompt": "Describe the content of each marked region in the image. There are 1 regions: \<region1\> to \<region1\>."
}

```
