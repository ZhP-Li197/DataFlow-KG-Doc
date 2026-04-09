---
title: AIGC 图像生成与评估
createTime: 2025/07/15 22:38:45
permalink: /zh/mm_guide/5ub4phag/
icon: basil:lightning-alt-outline
---

# Text-to-Image数据合成流水线

## 1. 概述
**Text-to-Image数据合成流水线**的核心目标是提供最基本的图片获取方式。根据每一个样例提供的图片提示词生成图片，为后续进一步的图片处理提供支持。目前主要支持了使用FLUX获取文本到图片生成的功能。

### 支持应用场景

- **文本到图片生成**
  - 根据输入文本生成目标图片
  - 特点：用户获取需要图片最简单的方式


## 2. 快速开始
### 第一步 安装Dataflow-MM环境
```bash
cd ./Dataflow-MM
conda create -n Dataflow-MM python=3.12
pip install -e .
```
接着进行初始化
```bash
dataflowmm init
cd gpu_pipelines/
```

### 第二步 文生图数据准备
我们使用`jsonl`文件来记录数据，下面是一个简单的输入数据样例：
```jsonl
{"conversations": [{"content": "a fox darting between snow-covered pines at dusk", "role": "user"}]}
{"conversations": [{"content": "a kite surfer riding emerald waves under a cloudy sky", "role": "user"}]}
```

数据加载需要定义`FileStorage`:
```python
storage = FileStorage(
   first_entry_file_name="<Your jsonl file path>",
   cache_path="./cache_local/<Your task name>",
   file_name_prefix="dataflow_cache_step",
   cache_type="jsonl"
  )
```

### 第三步 定义文本到图片生成serving
我们使用文本到图片生成模型，本文到图片生成器初始化方式如下
```python
t2i_serving = LocalImageGenServing(
    image_io=ImageIO(save_path=os.path.join(storage.cache_path, "condition_images")),
    batch_size=8,
    hf_model_name_or_path="black-forest-labs/FLUX.1-dev",
    hf_cache_dir="./cache_local",
    hf_local_dir="./ckpt/models/"
)
```
运行文本到图片生成器
```python
text_to_image_generator.run(
    storage=storage.step(),
    input_conversation_key="input_text",
    output_image_key="input_image",
)
```

### 第四步 运行流水线
可以参考下述指令运行图片编辑流水线。
```bash
python text_to_image_generation_pipeline.py
```

## 3. 输出数据
- **格式**：`jsonl` 
- **字段说明**：
  - `conversations`: 包含图片生成描述
  - `images`: 包含被生成的图片
- **示例**：
  ```jsonl
  {
    "conversations": [{"content": "The woman is dancing with the prince in a sacred ballroom.", "role": "user"}],
    "images": ["./dataflow/example/text_to_image_generation/images/image3.png"], 
  }
  ```


## 5. 流水线示例
下面给出文本到图片生成流水线的示例代码：
```python
import os
from dataflow.operators.core_vision import PromptedImageGenerator
from dataflow.serving.local_image_gen_serving import LocalImageGenServing
from dataflow.utils.storage import FileStorage
from dataflow.io import ImageIO


class ImageGenerationPipeline():
    def __init__(self):
        self.storage = FileStorage(
            first_entry_file_name="../example_data/image_gen/text2image/prompts.jsonl",
            cache_path="./cache_local/text_to_image_generation",
            file_name_prefix="dataflow_cache_step",
            cache_type="jsonl"
        )

        self.serving = LocalImageGenServing(
            image_io=ImageIO(save_path=os.path.join(self.storage.cache_path, "condition_images")),
            batch_size=4,
            hf_model_name_or_path="black-forest-labs/FLUX.1-dev",
            hf_cache_dir="./cache_local",
            hf_local_dir="./ckpt/models/"
        )

        self.text_to_image_generator = PromptedImageGenerator(
            t2i_serving=self.serving,
            save_interval=10
        )
    
    def forward(self):
        self.text_to_image_generator.run(
            storage=self.storage.step(),
            input_conversation_key="conversations",
            output_image_key="images",
        )

if __name__ == "__main__":
    model = ImageGenerationPipeline()
    model.forward()
```