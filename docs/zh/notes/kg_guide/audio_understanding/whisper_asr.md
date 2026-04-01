---
title: 使用Whisper进行语音转录或翻译
createTime: 2025/07/15 21:32:36
icon: material-symbols-light:interpreter-mode
permalink: /zh/mm_guide/dl0jhc6u/
---

## 使用Whisper进行语音转录或翻译

## 第一步: 安装环境
见[Audio环境安装](./install_audio_understanding.md)

## 第二步: 导入包
```python
from dataflow.operators.core_audio import PromptedAQAGenerator
from dataflow.serving import LocalModelVLMServing_vllm
from dataflow.utils.storage import FileStorage
from dataflow.prompts.audio import WhisperTranscriptionPrompt
```

## 第二步: 启动本地模型服务
本地模型调用服务方法如下:
```python
vlm_serving = LocalModelVLMServing_vllm(
    hf_model_name_or_path="opennai/whisper-large-v3", 
    hf_cache_dir='./dataflow_cache',
    vllm_tensor_parallel_size=2,
    vllm_temperature=0.3,
    vllm_top_p=0.9,
    vllm_max_tokens=512,
    vllm_max_model_len=448,
    vllm_gpu_memory_utilization=0.9
)
```

## 第三步: 按如下格式填写音频路径, 准备需要进行音频转录或翻译的数据
```jsonl
{"conversation": [{"from": "human", "value": "<audio>"}], "audio": ["https://raw.githubusercontent.com/gty1829/DataFlow-MM/df-audio-dev-1/dataflow/example/whisper_transcription/BAC009S0022W0165.wav"]}

```

## 第四步: 按下述格式将数据路径填入FileStorage中
```python
storage = FileStorage(
    first_entry_file_name="./dataflow/example/whisper_transcription/sample_data.jsonl",
    cache_path="./cache",
    file_name_prefix="whisper_transcription",
    cache_type="jsonl",
)
```

## 第五步: 初始化PromptedAQAGenerator算子
```python
prompt_generator = PromptedAQAGenerator(
    vlm_serving=vlm_serving,
    system_prompt=WhisperTranscriptionPrompt().generate_prompt(
        language="mandarin", 
        task="transcribe",          # task选择translate, 模型会把输入语音自动翻译为英文文本
        with_timestamps=False
    )
)
```

## 第六步: 执行算子
语音转录文字
```python
prompt_generator.run(
    storage = self.storage.step(),
    input_audio_key="audio",
    input_conversation_key="conversation",
    output_answer_key="answer",
    storage=storage.step(), 
)
```
