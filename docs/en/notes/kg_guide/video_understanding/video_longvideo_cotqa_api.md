---
title: Long Video Reasoning QA Pipeline (API)
createTime: 2025/07/16 17:00:00
permalink: /en/mm_guide/video_longvideo_cotqa_api_pipeline/
icon: carbon:flow-stream
---

# Long Video Reasoning QA Pipeline (API Version)

## 1. Overview

The **Long Video Reasoning QA Pipeline** (API Version) is a complete end-to-end solution that segments long videos through scene detection, generates captions for each segment, merges captions, creates reasoning QA, and optimizes/reformats the reasoning data. The entire process uses API models, suitable for long video understanding, complex reasoning QA dataset construction, and large-scale data processing.

We support the following use cases:

- Long video understanding and analysis
- Complex reasoning QA dataset construction
- Multi-step reasoning capability training data generation
- Large-scale video data processing (API-based)

The pipeline contains three main stages:

**Stage 1: Video Caption Generation**
1. Video info extraction
2. Scene detection and segmentation
3. Clip metadata generation
4. Video clip cutting and saving
5. Generate captions for each clip (using VLM API)
6. Merge captions to original video

**Stage 2: Reasoning QA Generation**
1. Data preparation
2. Generate reasoning QA based on merged captions (using LLM API)
3. Parse reasoning results into structured data

**Stage 3: Reasoning Data Reformatting**
1. Load parsed reasoning data
2. Construct reformatting prompts
3. Generate optimized reasoning data (using LLM API)

---

## 2. Quick Start

### Step 1: Configure API Key

Set API Key environment variables in the script:

```python
import os
os.environ["DF_API_KEY"] = "your_api_key"  # Main API Key
# os.environ["OPENROUTER_API_KEY"] = "your_openrouter_key"  # Optional: if using OpenRouter
```

### Step 2: Create a new DataFlow workspace
```bash
mkdir run_dataflow_mm
cd run_dataflow_mm
```

### Step 3: Initialize DataFlow-MM
```bash
dataflow init
```
You will see:
```bash
run_dataflow_mm/pipelines/gpu_pipelines/video_longvideo_cotqa_api_pipeline.py  
```

### Step 4: Configure parameters

In `video_longvideo_cotqa_api_pipeline.py`, configure video processing and API service parameters:

```python
pipeline = LongVideoPipelineAPI(
    # Video processing parameters
    backend="opencv",
    ext=False,
    frame_skip=0,
    start_remove_sec=0.0,
    end_remove_sec=0.0,
    min_seconds=0.0,
    max_seconds=10.0,
    use_adaptive_detector=False,
    overlap=False,
    use_fixed_interval=True,
    
    # VLM API parameters (for caption generation)
    vlm_api_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
    vlm_api_key_name="DF_API_KEY",
    vlm_model_name="qwen3-vl-8b-instruct",
    vlm_max_workers=10,
    vlm_timeout=1800,
    
    # LLM API parameters (for reasoning generation)
    llm_api_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
    llm_api_key_name="DF_API_KEY",
    llm_model_name="qwen2.5-72b-instruct",
    llm_max_workers=10,
    llm_timeout=1800,
    
    # LLM API parameters (for reasoning reformatting)
    reformat_api_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
    reformat_api_key_name="DF_API_KEY",
    reformat_model_name="qwen2.5-72b-instruct",
    reformat_max_workers=10,
    reformat_timeout=1800,
    
    video_save_dir="./cache/video_clips",
)
```

### Step 5: One-click run
```bash
python pipelines/gpu_pipelines/video_longvideo_cotqa_api_pipeline.py
```

---

## 3. Data Flow and Pipeline Logic

### 1. **Input Data**

The pipeline input includes the following fields:

* **video**: Video file path
* **conversation** (optional): Conversation format data

Inputs can be stored in designated files (such as `json` or `jsonl`) and managed via the `FileStorage` object:

```python
storage = FileStorage(
    first_entry_file_name="./dataflow/example/video_split/sample_data.json",
    cache_path="./cache",
    file_name_prefix="video_longvideo_cotqa_api",
    cache_type="json",
)
```

**Input Data Example**:

```json
[
    {"video": ["./videos/long_video1.mp4"]},
    {"video": ["./videos/long_video2.mp4"]}
]
```

---

### **Stage 1: Video Caption Generation**

#### Step 1: Video Info Extraction (VideoInfoFilter)

**Functionality:** Extract basic video information (frame rate, resolution, duration, etc.)

**Operator Initialization**:
```python
self.video_info_filter = VideoInfoFilter(
    backend="opencv",
    ext=False,
)
```

**Operator Run**:
```python
self.video_info_filter.run(
    storage=storage.step(),
    input_video_key="video",
    output_key="video_info",
)
```

#### Step 2: Scene Detection (VideoSceneFilter)

**Functionality:** Segment videos based on scene changes or fixed intervals

**Operator Initialization**:
```python
self.video_scene_filter = VideoSceneFilter(
    frame_skip=0,
    start_remove_sec=0.0,
    end_remove_sec=0.0,
    min_seconds=2.0,
    max_seconds=15.0,
    disable_parallel=True,
    use_adaptive_detector=False,  # Whether to use adaptive detector
    overlap=False,                # Whether to use overlap splitting strategy
    use_fixed_interval=False,     # Whether to use fixed interval splitting
)
```

**Operator Run**:
```python
self.video_scene_filter.run(
    storage=storage.step(),
    input_video_key="video",
    video_info_key="video_info",
    output_key="video_scene",
)
```

#### Step 3: Clip Metadata Generation (VideoClipFilter)

**Functionality:** Generate detailed metadata for each clip based on scene detection results

**Operator Initialization**:
```python
self.video_clip_filter = VideoClipFilter()
```

**Operator Run**:
```python
self.video_clip_filter.run(
    storage=storage.step(),
    input_video_key="video",
    video_info_key="video_info",
    video_scene_key="video_scene",
    output_key="video_clip",
)
```

#### Step 4: Video Cutting and Saving (VideoClipGenerator)

**Functionality:** Cut and save videos as independent files based on clip metadata

**Operator Initialization**:
```python
self.video_clip_generator = VideoClipGenerator(
    video_save_dir="./cache/video_clips",
)
```

**Operator Run**:
```python
self.video_clip_generator.run(
    storage=storage.step(),
    video_clips_key="video_clip",
    output_key="video",
)
```

#### Step 5: Caption Generation (VideoToCaptionGenerator + API)

**Functionality:** Use VLM API to generate detailed captions for each video clip

**Operator Initialization**:
```python
# Initialize VLM API service
self.vlm_serving = APIVLMServing_openai(
    api_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
    key_name_of_api_key="DF_API_KEY",
    model_name="qwen3-vl-8b-instruct",
    max_workers=10,
    timeout=1800
)

# Initialize caption generator
self.video_to_caption_generator = VideoToCaptionGenerator(
    vlm_serving=self.vlm_serving,
    prompt_template="Elaborate on the visual and narrative elements of the video in detail.",
)
```

**Operator Run**:
```python
self.video_to_caption_generator.run(
    storage=storage.step(),
    input_image_key="image",
    input_video_key="video",
    input_conversation_key="conversation",
    output_key="caption",
)
```

#### Step 6: Caption Merging (VideoMergedCaptionGenerator)

**Functionality:** Merge all clip captions to the original video level

**Operator Initialization**:
```python
self.video_merged_caption_generator = VideoMergedCaptionGenerator(
    caption_key="caption",
)
```

**Operator Run**:
```python
self.video_merged_caption_generator.run(
    storage=storage.step(),
    output_key="captions",
)
```

---

### **Stage 2: Reasoning QA Generation**

#### Step 1: Data Preparation

**Functionality:** Prepare merged caption data for reasoning QA generation

```python
df = storage.step().read("dataframe")
if "captions" in df.columns:
    df["caption"] = df["captions"]
if "conversation" not in df.columns:
    df["conversation"] = [[{"from": "human", "value": ""}]] * len(df)
storage.write(df)
```

#### Step 2: Reasoning QA Generation (VideoCaptionToQAGenerator + API)

**Functionality:** Generate multi-step reasoning QA based on merged captions

**Operator Initialization**:
```python
# Initialize LLM API service
self.llm_serving = APIVLMServing_openai(
    api_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
    key_name_of_api_key="DF_API_KEY",
    model_name="qwen2.5-72b-instruct",
    max_workers=10,
    timeout=1800
)

# Custom reasoning QA prompt
REASONING_QA_PROMPT = """
Based on the following captions for a video, generate a challenging multiple-choice question 
that requires **multiple reasoning steps** and deep understanding to answer.
...
"""

# Initialize reasoning QA generator
self.reasoning_qa_generator = VideoCaptionToQAGenerator(
    vlm_serving=self.llm_serving,
    prompt_template=DiyVideoPrompt(REASONING_QA_PROMPT),
    use_video_input=False,  # Use pure text mode
)
```

**Operator Run**:
```python
self.reasoning_qa_generator.run(
    storage=storage.step(),
    input_conversation_key="conversation",
    output_key="reasoning",
)
```

#### Step 3: Reasoning Result Parsing

**Functionality:** Parse generated reasoning text into structured data

```python
parsed_results = []
for idx, row in df.iterrows():
    if "reasoning" in row and row["reasoning"]:
        parsed = parse_reasoning(row["reasoning"])
        parsed_results.append(parsed)
df["parsed_reasoning"] = parsed_results
```

**Parsed Structure**:
- `QUESTION`: Question text
- `OPTIONS`: Options (A, B, C, D)
- `ANSWER`: Correct answer
- `REASONS`: Reasoning steps (with timestamps)

---

### **Stage 3: Reasoning Data Reformatting**

#### Step 1: Load Parsed Data

Load structured reasoning data from the previous stage.

#### Step 2: Construct Reformatting Prompts

**Functionality:** Construct optimization prompts for each reasoning QA

```python
REFORMAT_PROMPT_TEMPLATE = """
You are an advanced AI language model designed to refine logical reasoning 
while maintaining accuracy. Your task is to optimize the provided reasoning 
so that it is more natural, logically coherent, and easy to read.
...
"""

for idx, row in df.iterrows():
    parsed = row.get("parsed_reasoning", {})
    prompt = REFORMAT_PROMPT_TEMPLATE.format(
        question=full_question,
        answer=answer,
        reason=reason_text
    )
    prompts.append(prompt)
```

#### Step 3: Generate Optimized Reasoning (PromptedVQAGenerator + API)

**Functionality:** Use LLM API to optimize and reformat reasoning text

**Operator Initialization**:
```python
# Initialize reformatting API service (can use different model)
self.reformat_serving = APIVLMServing_openai(
    api_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
    key_name_of_api_key="DF_API_KEY",
    model_name="qwen2.5-72b-instruct",
    max_workers=10,
    timeout=1800
)

# Initialize prompted generator
self.prompted_vqa_generator = PromptedVQAGenerator(
    serving=self.reformat_serving,
)
```

**Operator Run**:
```python
self.prompted_vqa_generator.run(
    storage=storage.step(),
    input_conversation_key="conversation",
    output_answer_key="reformatted_reasoning",
)
```

---

### 2. **Output Data**

The final output includes:

* **id**: Video identifier
* **captions**: Merged video captions (with timestamps)
* **num_clips**: Number of video clips
* **reasoning**: Raw reasoning QA text
* **parsed_reasoning**: Structured reasoning data
  - `QUESTION`: Question
  - `OPTIONS`: Options dictionary
  - `ANSWER`: Answer
  - `REASONS`: Reasoning steps dictionary
* **prompt**: Complete prompt for reasoning reformatting
* **full_question**: Complete question (with options)
* **conversation**: Conversation data for reformatting stage
* **reformatted_reasoning**: Optimized reasoning text (for training)

**Output Data Example**:

```json
[
    {
        "id": "video1",
        "captions": "From 0 to 10, video shows a person entering a room...\nFrom 10 to 20, the person picks up a book...",
        "num_clips": 2,
        "reasoning": "QUESTION: Based on the video content, what is the person's main goal?\nOPTIONS:\nA. Looking for keys\nB. Reading a book\nC. Organizing the room\nD. Making a phone call\nANSWER: B\nREASONS:\n##### From 0 to 10:\n- Person enters room\n- Environment shows bookshelf\n##### From 10 to 20:\n- Person walks directly to bookshelf\n- Picks up and opens a book",
        "parsed_reasoning": {
            "QUESTION": "Based on the video content, what is the person's main goal?",
            "OPTIONS": {
                "A": "Looking for keys",
                "B": "Reading a book",
                "C": "Organizing the room",
                "D": "Making a phone call"
            },
            "ANSWER": "B",
            "REASONS": {
                "Step 1": {
                    "timestamp": "0 to 10",
                    "reasons": ["Person enters room", "Environment shows bookshelf"]
                },
                "Step 2": {
                    "timestamp": "10 to 20",
                    "reasons": ["Person walks directly to bookshelf", "Picks up and opens a book"]
                }
            }
        },
        "prompt": "\nYou are an advanced AI language model designed to refine logical reasoning...\n\"question\": \"Based on the video content, what is the person's main goal?...\"\n\"answer\": \"B\"\n\"reason\": \"Start thinking...\"",
        "full_question": "Based on the video content, what is the person's main goal?\nA. Looking for keys\nB. Reading a book\nC. Organizing the room\nD. Making a phone call",
        "conversation": [
            {
                "from": "human",
                "value": "You are an advanced AI language model designed to refine logical reasoning..."
            }
        ],
        "reformatted_reasoning": "The video begins showing a person entering a room, and the scene reveals a bookshelf inside, providing an important environmental clue. Analyzing the person's behavior, we notice that their gaze and body movements are clearly directed toward the bookshelf, indicating a specific interest in its contents. Next, in the second part of the video, the person walks directly to the bookshelf without any hesitation or attention to other items in the room, further confirming their clear objective. The most crucial evidence is that they pick up a book from the shelf and immediately open it to start reading, an action that directly reveals their true intention for entering the room. Combining these sequential behaviors and scene details, we can clearly infer that the person's main goal is to read a book. Therefore, the correct answer is B."
    }
]
```

---

## 4. Pipeline Example

Complete pipeline code example:

```python
import os
os.environ["DF_API_KEY"] = "your_api_key"

from dataflow.core.Operator import OperatorABC
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import (
    VideoInfoFilter, VideoSceneFilter, VideoClipFilter,
    VideoClipGenerator, VideoToCaptionGenerator,
    VideoMergedCaptionGenerator, VideoCaptionToQAGenerator,
    PromptedVQAGenerator
)
from dataflow.serving.api_vlm_serving_openai import APIVLMServing_openai
from dataflow.prompts.video import DiyVideoPrompt

# Caption generation prompt
VIDEO_CAPTION_PROMPT = (
    "Elaborate on the visual and narrative elements of the video in detail."
)

# Reasoning QA generation prompt
REASONING_QA_PROMPT = """
Based on the following captions for a video, generate a challenging 
multiple-choice question that requires **multiple reasoning steps**...
"""

# Reformatting prompt
REFORMAT_PROMPT_TEMPLATE = """
You are an advanced AI language model designed to refine logical reasoning...
"""

class LongVideoPipelineAPI(OperatorABC):
    def __init__(
        self,
        backend="opencv",
        ext=False,
        frame_skip=0,
        min_seconds=2.0,
        max_seconds=15.0,
        use_fixed_interval=False,
        # VLM API parameters
        vlm_api_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        vlm_api_key_name="DF_API_KEY",
        vlm_model_name="qwen3-vl-8b-instruct",
        vlm_max_workers=10,
        # LLM API parameters
        llm_api_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        llm_api_key_name="DF_API_KEY",
        llm_model_name="qwen2.5-72b-instruct",
        llm_max_workers=10,
        # Reformatting API parameters
        reformat_api_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        reformat_api_key_name="DF_API_KEY",
        reformat_model_name="qwen2.5-72b-instruct",
        reformat_max_workers=10,
        video_save_dir="./cache/video_clips",
    ):
        # Initialize video processing operators
        self.video_info_filter = VideoInfoFilter(backend=backend, ext=ext)
        self.video_scene_filter = VideoSceneFilter(...)
        self.video_clip_filter = VideoClipFilter()
        self.video_clip_generator = VideoClipGenerator(video_save_dir=video_save_dir)
        
        # Initialize VLM API service (caption generation)
        self.vlm_serving = APIVLMServing_openai(
            api_url=vlm_api_url,
            key_name_of_api_key=vlm_api_key_name,
            model_name=vlm_model_name,
            max_workers=vlm_max_workers,
        )
        self.video_to_caption_generator = VideoToCaptionGenerator(
            vlm_serving=self.vlm_serving,
            prompt_template=VIDEO_CAPTION_PROMPT,
        )
        self.video_merged_caption_generator = VideoMergedCaptionGenerator()
        
        # Initialize LLM API service (reasoning generation)
        self.llm_serving = APIVLMServing_openai(
            api_url=llm_api_url,
            key_name_of_api_key=llm_api_key_name,
            model_name=llm_model_name,
            max_workers=llm_max_workers,
        )
        self.reasoning_qa_generator = VideoCaptionToQAGenerator(
            vlm_serving=self.llm_serving,
            prompt_template=DiyVideoPrompt(REASONING_QA_PROMPT),
            use_video_input=False,
        )
        
        # Initialize LLM API service (reformatting)
        self.reformat_serving = APIVLMServing_openai(
            api_url=reformat_api_url,
            key_name_of_api_key=reformat_api_key_name,
            model_name=reformat_model_name,
            max_workers=reformat_max_workers,
        )
        self.prompted_vqa_generator = PromptedVQAGenerator(
            serving=self.reformat_serving,
        )
    
    def run(
        self,
        storage,
        input_video_key="video",
        input_conversation_key="conversation",
        output_key="caption",
    ):
        # ========== Stage 1: Video Caption Generation ==========
        # Steps 1-4: Video processing
        self.video_info_filter.run(storage=storage.step(), ...)
        self.video_scene_filter.run(storage=storage.step(), ...)
        self.video_clip_filter.run(storage=storage.step(), ...)
        self.video_clip_generator.run(storage=storage.step(), ...)
        
        # Steps 5-6: Caption generation and merging
        self.video_to_caption_generator.run(storage=storage.step(), ...)
        self.video_merged_caption_generator.run(storage=storage.step(), ...)
        
        # ========== Stage 2: Reasoning QA Generation ==========
        # Data preparation
        df = storage.step().read("dataframe")
        # ... data preparation logic ...
        
        # Generate reasoning QA
        self.reasoning_qa_generator.run(storage=storage.step(), ...)
        
        # Parse reasoning results
        # ... parsing logic ...
        
        # ========== Stage 3: Reasoning Data Reformatting ==========
        # Construct prompts and generate optimized reasoning
        self.prompted_vqa_generator.run(storage=storage.step(), ...)
        
        return "reformatted_reasoning"

if __name__ == "__main__":
    storage = FileStorage(
        first_entry_file_name="./dataflow/example/video_split/sample_data.json",
        cache_path="./cache",
        file_name_prefix="video_longvideo_cotqa_api",
        cache_type="json",
    )
    
    pipeline = LongVideoPipelineAPI(
        use_fixed_interval=True,
        min_seconds=0.0,
        max_seconds=10.0,
        vlm_model_name="qwen3-vl-8b-instruct",
        llm_model_name="qwen2.5-72b-instruct",
        reformat_model_name="qwen2.5-72b-instruct",
    )
    
    pipeline.run(storage=storage)
```
