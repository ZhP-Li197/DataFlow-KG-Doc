---
title: Using Whisper for Speech Transcription or Translation
createTime: 2025/07/15 21:32:36
icon: material-symbols-light:interpreter-mode
permalink: /en/mm_guide/dl0jhc6u/
---

## Using Whisper for Speech Transcription or Translation

## Step 1: Install Environment
See [ Audio Environment Installation](./install_audio_understanding.md)

## Step 2: Import Relevant Packages
```python
from dataflow.operators.core_audio import PromptedAQAGenerator
from dataflow.serving import LocalModelVLMServing_vllm
from dataflow.utils.storage import FileStorage
from dataflow.prompts.audio import WhisperTranscriptionPrompt
```

## Step 3: Start the Local Model Service
The method for launching the local model serving service is as follows:
```python
vlm_serving = LocalModelLLMServing_vllm(
    hf_model_name_or_path="openai/whisper-large-v3", # set to your own model path
    hf_cache_dir='./dataflow_cache',
    vllm_tensor_parallel_size=2,
    vllm_temperature=0.3,
    vllm_top_p=0.9,
    vllm_max_tokens=512,
    vllm_max_model_len=448,
    vllm_gpu_memory_utilization=0.9
)
```

## Step 4: Prepare the Audio Data for Transcription or Translation
Fill in the audio paths in the following format:
```jsonl
{"conversation": [{"from": "human", "value": "<audio>"}], "audio": ["https://raw.githubusercontent.com/gty1829/DataFlow-MM/df-audio-dev-1/dataflow/example/whisper_transcription/BAC009S0022W0165.wav"]}

```

## Step 5: Add the Data Path to FileStorage
```python
storage = FileStorage(
    first_entry_file_name="./dataflow/example/whisper_transcription/sample_data.jsonl",
    cache_path="./cache",
    file_name_prefix="whisper_transcription",
    cache_type="jsonl",
)
```

## Step 6: Initialize the PromptedAQAGenerator Operator
```python
prompt_generator = PromptedAQAGenerator(
    vlm_serving=vlm_serving,
    system_prompt=WhisperTranscriptionPrompt().generate_prompt(
        language="mandarin", 
        task="transcribe",        # If task == 'translate', the model will translate input speech into English text.
        with_timestamps=False
    )
)
```

## Step 7: Execute the Operator
Speech Transcription
```python
prompt_generator.run(
    storage = self.storage.step(),
    input_audio_key="audio",
    input_conversation_key="conversation",
    output_answer_key="answer",
    storage=storage.step(), 
)
```