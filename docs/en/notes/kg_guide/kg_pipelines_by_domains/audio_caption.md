---
title: Audio Caption Generation
createTime: 2025/07/15 21:33:01
icon: material-symbols-light:autoplay
permalink: /en/mm_guide/2gjc47qb/
---

## Audio Caption Generation

## Step 1: Install Environment
See[ Audio Environment Installation](./install_audio_understanding.md)

## Step 2: Import Relevant Packages
```python
from dataflow.operators.core_audio import PromptedAQAGenerator
from dataflow.serving import LocalModelVLMServing_vllm
from dataflow.utils.storage import FileStorage
from dataflow.prompts.audio import AudioCaptionGeneratorPrompt
```

## Step 3: Start the Local Model Service
The local model serving method is as follows:
```python
vlm_serving = LocalModelVLMServing_vllm(
    hf_model_name_or_path="Qwen/Qwen2-Audio-7B-Instruct", # set to your own model path
    vllm_tensor_parallel_size=2,
    vllm_max_tokens=8192,
    vllm_gpu_memory_utilization=0.7
)
```

## Step 4: Prepare the Audio Data for Caption Generation
Fill in the audio paths in the following format:
```jsonl
{"audio": ["https://raw.githubusercontent.com/gty1829/DataFlow-MM/df-audio-dev-1/dataflow/example/whisper_transcription/BAC009S0022W0165.wav"], "conversation": [{"from": "human", "value": "<audio>\nTranscribe the audio into Chinese." }]}
{"audio": ["https://raw.githubusercontent.com/gty1829/DataFlow-MM/df-audio-dev-1/dataflow/example/audio_vqa/Santa%20Motor.wav"], "conversation": [{"from": "human", "value": "<audio>\nDescribe the sound in this audio clip." }]}

```

## Step 5: Add the Data Path to FileStorage in the Following Format
```python
storage = FileStorage(
    first_entry_file_name="./dataflow/example/audio_aqa/sample_data.jsonl",
    cache_path="./cache",
    file_name_prefix="audio_caption",
    cache_type="jsonl",
)
```

## Step 6: Initialize the PromptedAQAGenerator Operator
```python
prompt_generator = PromptedAQAGenerator(
    vlm_serving=vlm_serving,
    system_prompt=AudioCaptionGeneratorPrompt().generate_prompt()
)
```

## Step 7: Execute the Operator
```python
prompt_generator.run(storage=storage.step(), output_key="caption")
```