---
title: AIGC 图像编辑
createTime: 2025/07/15 22:38:45
permalink: /zh/mm_guide/image_editing/
icon: basil:lightning-alt-outline
---

# 图片编辑数据合成流水线

## 1. 概述
**图片编辑数据合成流水线**的核心目标是根据已有的图片以及指令生成对应的图片编辑数据，为每一个样本生成包含输入图片、编辑指令、以及生成图片的高质量数据。目前提供本地模型编辑、在线编辑模型nano-banana编辑，以及多张图片作为输入的图片编辑任务：

### 支持应用场景

- **图片局部细节修改**
  - 对输入图片进行替换、消除、添加等操作
  - 特点：图片整体内容变化不大，主要对图中某一特征或者物体进行改变

- **subject-driven 图片生成**
  - 根据输入图片的主体特征进行图片生成
  - 特点：图片整体内容变化比较大，需要保证生成结果中的主体特征与输入特片主体特征保持一致

- **multi-subject-driven 图片生成**
  - 根据多张输入图片的主体特征进行图片生成
  - 特点：需要在保证生成图片中多个主体的特征与输入多张图片主体特征保持一致的同时，同时需要多个主体之间交互自然

### 处理流程
1. **提示词生成**
   - 根据设定类别，利用LLM生成图片描述以及编辑指令
   - 确保编辑指令的泛化性，以及图片描述的准确性
2. **图片条件生成**
   - 利用text-to-image生成模型（例如FLUX， Qwen-Image），根据图片描述生成对应的图片
3. **编辑图片生成**
   - 利用本地编辑模型，或者在线编辑模型，根据编辑指令以及输入图片，生成目标图片

## 2. 快速开始
### 第一步 安装Dataflow-MM环境
```bash
cd ./Dataflow-MM
conda create -n Dataflow-MM python=3.12
pip install -e .
```
接着进行初始化（**非常重要的一步，务必执行**）
```bash
dataflowmm init
cd gpu_pipelines/
```

### 第二步 编辑数据数据准备
我们使用`jsonl`文件来记录数据，下面是一个简单的输入数据样例：
```jsonl
{"conversations": [{"content": "Change the woman's clothes to a white dress.", "role": "user"}], "images": ["./dataflow/example/test_image_editing/images/image1.png"]}
{"conversations": [{"content": "Change the vase to red.", "role": "user"}], "images": ["./dataflow/example/test_image_editing/images/image2.png"]}
{"conversations": [{"content": "The woman is dancing with the prince in a sacred ballroom.", "role": "user"}], "images": ["./dataflow/example/test_image_editing/images/image3.png"]}
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

### 第三步 运行流水线
可以参考下述指令运行图片编辑流水线。
```bash
python image_editing_pipeline.py --serving_type 'local'
```
或
```bash
export DF_API_KEY=<api_key>
python image_editing_pipeline.py --api_url \<your_url\>
```

## 3. 流水线逻辑
### 3.1 提示词设计
利用本地/在线LLM模型（例如gpt-4o）以及设定的数据配比，构建图片生成样例

### 3.2 图片条件获取
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

### 3.3 编辑结果获取
本地模型调用方式如下：
```python
from dataflow.serving.local_image_gen_serving import LocalImageGenServing

self.serving = LocalImageGenServing(
    image_io=ImageIO(save_path=os.path.join(self.storage.cache_path, "images")),
    hf_model_name_or_path="black-forest-labs/FLUX.1-Kontext-dev",
    hf_cache_dir="./cache_local",
    hf_local_dir="./ckpt/models/",
    Image_gen_task="imageedit",
    batch_size=4,
    diffuser_model_name="FLUX-Kontext",
    diffuser_num_inference_steps=28,
    diffuser_guidance_scale=3.5,
)
```

目前我们接入了使用nano-banana对图片进行编辑，参考前文的图片编辑，只要修改对应的serving即可运行nano-banana进行测试。模型调用方式如下所示：
```python
import os
from dataflow.serving.api_vlm_serving_openai import APIVLMServing_openai

os.environ['DF_API_KEY'] = args.api_key

self.serving = APIVLMServing_openai(
    api_url=api_url,
    model_name="gemini-2.5-flash-image-preview",               # try nano-banana
    image_io=ImageIO(save_path=os.path.join(self.storage.cache_path, "images")),
    send_request_stream=True,
)
```
需要注意的是我们所使用的api来自于[huiyun](http://123.129.219.111:3000)

生成脚本调整如下：
```python
from dataflow.operators.core_vision import PromptedImageEditGenerator

self.generator = PromptedImageEditGenerator(pipe=self.serving)

self.generator.run(
    storage=self.storage.step(),
    input_image_key="images",
    input_conversation_key="conversations",
    output_image_key="edited_images",
)
```


## 4. 输出数据
- **格式**：`jsonl` 
- **字段说明**：
  - `conversations`: 包含图片编辑指令
  - `images`: 包含被编辑图片以及输入的图片条件
  - `edited_images`: 包含生成的图片编辑结果
- **示例**：
  ```jsonl
  {
    "conversations": [{"content": "The woman is dancing with the prince in a sacred ballroom.", "role": "user"}],
    "images": ["../example_data/image_gen/image_edit/image3.png"], 
    "edited_images": [""]
  }
  ```

## 5. 运行方式
这里支持本地编辑模型以及在线编辑模型两种生成方式，同时支持多张图片作为输入的
- 本地编辑模型图片编辑流水线
  ```bash
  python /path/to/DataFlow-MM/test/image_editing_pipeline.py --serving_type 'local'
  ```
- 在线编辑模型图片编辑流水线
  ```bash
  export DF_API_KEY=<api_key>
  python /path/to/DataFlow-MM/test/image_editing_pipeline.py --api_url <your_url>
  ```
- 多张图片输入的图片编辑流水线
  ```bash
  export DF_API_KEY=<api_key>
  python /path/to/DataFlow-MM/test/multi_images_to_image_generation_pipeline.py --api_url <your_url>
  ```

## 6. 流水线示例
以下给出示例流水线，演示如何使用多个算子实现图片编辑数据生成。这些示例展示了如何从图片条件获取到编辑图片结果生成的全部过程。
- **本地模型图片编辑数据合成流水线**：
  ```python
  from dataflow.utils.storage import FileStorage
  from dataflow.io import ImageIO
  from dataflow.operators.core_vision import PromptedImageEditGenerator
  from dataflow.serving.local_image_gen_serving import LocalImageGenServing

  class ImageGenerationPipeline():
    def __init__(self, serving_type="local", api_key="", api_url="http://123.129.219.111:3000/v1/"):
        self.storage = FileStorage(
            first_entry_file_name="../example_data/image_gen/image_edit/prompts.jsonl",
            cache_path="./cache_local/image_editing",
            file_name_prefix="dataflow_cache_step",
            cache_type="jsonl"
        )

        self.serving = LocalImageGenServing(
            image_io=ImageIO(save_path=os.path.join(self.storage.cache_path, "target_images")),
            hf_model_name_or_path="black-forest-labs/FLUX.1-Kontext-dev",
            hf_cache_dir="./cache_local",
            hf_local_dir="./ckpt/models/",
            Image_gen_task="imageedit",
            batch_size=4,
            diffuser_model_name="FLUX-Kontext",
            diffuser_num_inference_steps=28,
            diffuser_guidance_scale=3.5,
        )

        self.text_to_image_generator = PromptedImageEditGenerator(
            image_edit_serving=self.serving
        )
    
    def forward(self):
        self.text_to_image_generator.run(
            storage=self.storage.step(),
            input_image_key="images",
            input_conversation_key="conversations",
            output_image_key="edited_images",
        )
  ```

- **在线模型图片编辑数据合成流水线**：
  ```python
  import os
  from dataflow.utils.storage import FileStorage
  from dataflow.io import ImageIO
  from dataflow.operators.core_vision import PromptedImageEditGenerator
  from dataflow.serving.api_vlm_serving_openai import APIVLMServing_openai

  class ImageGenerationPipeline():
    def __init__(self, serving_type="local", api_key="", api_url="http://123.129.219.111:3000/v1/"):
        os.environ['DF_API_KEY'] = api_key
        self.storage = FileStorage(
            first_entry_file_name="../example_data/image_gen/image_edit/prompts.jsonl",
            cache_path="./cache_local/image_editing",
            file_name_prefix="dataflow_cache_step",
            cache_type="jsonl"
        )

        self.serving = APIVLMServing_openai(
            api_url=api_url,
            model_name="gemini-2.5-flash-image-preview",
            image_io=ImageIO(save_path=os.path.join(self.storage.cache_path, "target_images")),
            # send_request_stream=True,    # if use ip http://123.129.219.111:3000/ add this line
        )

        self.text_to_image_generator = PromptedImageEditGenerator(
            image_edit_serving=self.serving,
            save_interval=10
        )
    
    def forward(self):
        self.text_to_image_generator.run(
            storage=self.storage.step(),
            input_image_key="images",
            input_conversation_key="conversations",
            output_image_key="edited_images",
        )
  ```

- **多图输入图片编辑数据合成流水线**：
  ```python
  import os
  import argparse
  from dataflow.operators.core_vision import PromptedImageGenerator
  from dataflow.operators.core_vision import PromptedImageEditGenerator
  from dataflow.serving.api_vlm_serving_openai import APIVLMServing_openai
  from dataflow.serving.local_image_gen_serving import LocalImageGenServing
  from dataflow.utils.storage import FileStorage
  from dataflow.io import ImageIO


  class MultiImages2ImagePipeline():
      def __init__(
          self, 
          serving_type="api", 
          api_url="https://api.openai.com/v1/",
          ip_condition_num=1, 
          repeat_times=1
      ):
          self.storage = FileStorage(
              first_entry_file_name="../example_data/image_gen/multi_image_input_gen/prompts.jsonl",
              cache_path="./cache_local/multi_subjects_driven_image_generation",
              file_name_prefix="dataflow_cache_step",
              cache_type="jsonl"
          )
          
          self.t2i_serving = LocalImageGenServing(
              image_io=ImageIO(save_path=os.path.join(self.storage.cache_path, "condition_images")),
              batch_size=4,
              hf_model_name_or_path="/ytech_m2v5_hdd/CheckPoints/FLUX.1-dev",   # "black-forest-labs/FLUX.1-dev"
              hf_cache_dir="./cache_local",
              hf_local_dir="./ckpt/models/"
          )

          self.vlm_serving = APIVLMServing_openai(
              api_url=api_url,
              model_name="gemini-2.5-flash-image-preview",               # try nano-banana
              image_io=ImageIO(save_path=os.path.join(self.storage.cache_path, "target_images")),
              # send_request_stream=True,    # if use ip http://123.129.219.111:3000/ add this line
          )

          self.text_to_image_generator = PromptedImageGenerator(
              t2i_serving=self.t2i_serving,
          )

          self.image_editing_generator = PromptedImageEditGenerator(
              image_edit_serving=self.vlm_serving,
          )

      def forward(self):
          self.text_to_image_generator.run(
              storage=self.storage.step(),
              input_conversation_key="input_text",
              output_image_key="input_image",
          )

          self.image_editing_generator.run(
              storage=self.storage.step(),
              input_image_key="input_image",
              input_conversation_key="output_img_discript",
              output_image_key="output_image",
          )
  ```