---
title: PromptedAQAGenerator
createTime: 2025/07/15 21:33:01
# icon: material-symbols-light:autoplay
permalink: /zh/mm_operators/2gjc47qb/
---

## 📘-概述
```PromptedAQAGenerator``` 是一个通用的提示词生成算子，它结合用户提供的系统提示词（system prompt）和具体输入内容，调用音频大模型（LALM）生成相应的文本输出。该算子灵活性高，可用于各种需要定制化提示词的文本生成任务。

## ```__init__```函数
```python
def __init__(self, 
            vlm_serving: VLMServingABC, 
            system_prompt: str = "You are a helpful assistant.",
            )
```

## `init`参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `vlm_serving` | `VLMServingABC` | **必填** | 执行生成所用的音频多模态大模型服务实例。 |
| `system_prompt` | `str` | `You are a helpful assistant.` | 系统提示词，用于定义音频多模态大模型的行为或角色。 |

## Prompt模板说明
该算子不使用固定的 Prompt 模板，而是通过 `system_prompt` 参数和 `run` 函数中 `input_key` 对应的内容直接组合成最终的提示词。

注：对于Whisper模型，我们可以在`system_prompt`中配置相应任务，方法如下：
```python
from dataflow.prompts.whisper_prompt_generator import WhisperTranscriptionPrompt

system_prompt = WhisperTranscriptionPrompt.generate_prompt(
    language=None,
    task="transcribe",
    with_timestamps=False,
)

def __init__(self, 
            vlm_serving: VLMServingABC, 
            system_prompt: str = system_prompt,
            )
```
| 参数 | 默认值 | 说明 |
| :--- | :--- | :--- |
| `language` | `None` | 音频文件的语言，用于指定转录或翻译的语言。如果为 None，则根据音频内容自动检测语言。 |
| `task` | `"transcribe"` | 任务类型，可选 `"transcribe"`（语音转录）或 `"translate"`（语音翻译）。 |
| `with_timestamps` | `False` | 是否在转录结果中包含时间戳。 |

## `run`函数
```python
def run(self, storage: DataFlowStorage, input_audio_key: str = "audio", input_conversation_key: str = "conversation", output_answer_key: str = "answer"):
```
执行算子主逻辑，从存储中读取输入 DataFrame，将 system_prompt 与输入内容结合后调用 LALM 生成结果，并将结果写回存储。

参数
| 参数名 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `storage` | `DataFlowStorage` | **必填** | 输入输出数据存储实例，包含输入 DataFrame 和输出结果。 |
| `input_audio_key` | `str` | "audio" | 输入数据中包含音频数据路径的列名。 |
| `input_conversation_key` | `str` | "conversation" | 输入数据中包含对话内容的列名。 |
| `output_answer_key` | `str` | "answer" | 输出数据中存储生成结果的列名。 |

## 🧠 示例用法

```python
from dataflow.operators.core_audio import PromptedAQAGenerator
from dataflow.operators.conversations import Conversation2Message
from dataflow.serving import LocalModelVLMServing_vllm
from dataflow.utils.storage import FileStorage

class AQAGenerator():
    def __init__(self):
        self.storage = FileStorage(
            first_entry_file_name="./dataflow/example/audio_vqa/sample_data_local.jsonl",
            cache_path="./cache",
            file_name_prefix="audio_aqa",
            cache_type="jsonl",
        )
        self.model_cache_dir = './dataflow_cache'

        self.vlm_serving = LocalModelVLMServing_vllm(
            hf_model_name_or_path="/path/to/your/Qwen2-Audio-7B-Instruct",
            hf_cache_dir=self.model_cache_dir,
            vllm_tensor_parallel_size=8,
            vllm_temperature=0.7,
            vllm_top_p=0.9,
            vllm_max_tokens=512,
            vllm_gpu_memory_utilization=0.6
        )

        self.prompt_generator = PromptedAQAGenerator(
            vlm_serving = self.vlm_serving,
            system_prompt="You are a helpful agent."
        )

    def forward(self):
        self.prompt_generator.run(
            storage = self.storage.step(),
            input_audio_key="audio",
            input_conversation_key="conversation",
            output_answer_key="answer",
        )

if __name__ == "__main__":
    # This is the entry point for the pipeline
    model = AQAGenerator()
    model.forward()
```

### 🧾 默认输出格式（Output Format）
| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `answer` | `str` | 音频字幕 |

示例输入:
```jsonl
{"audio": ["/path/to/your/audio/audio.wav"], "conversation": [{"from": "human", "value": "<audio>\nTranscribe the audio in English." }]}
```

示例输出:
```jsonl
{"audio": ["/path/to/your/audio/audio.wav"], "conversation": [{"from": "human", "value": "<audio>\nTranscribe the audio in English." }], "answer": "He began a confused complaint against the wizard who had vanished behind the curtain on the left."}
```