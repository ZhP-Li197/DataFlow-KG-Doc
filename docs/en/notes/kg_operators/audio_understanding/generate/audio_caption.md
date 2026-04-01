---
title: PromptedAQAGenerator
createTime: 2025/10/14 18:02:53
permalink: /en/mm_operators/934raucw/
---

## 📘 Overview
```PromptedAQAGenerator``` is a general-purpose prompt-based generation operator. It combines a user-provided system prompt with specific input content and invokes an audio large language model (LALM) to produce corresponding textual output. This operator is highly flexible and can be used for a wide range of text generation tasks that require customized prompts.

## ```__init__```
```python
def __init__(self, 
            vlm_serving: VLMServingABC, 
            system_prompt: str = "You are a helpful assistant.",
            )
```

## `init` parameters
| Parameter | Type | Default | 	Description |
| :--- | :--- | :--- | :--- |
| `vlm_serving` | `VLMServingABC` | **Required** | 	The audio multimodal large model service instance used to perform generation. |
| `system_prompt` | `str` | "You are a helpful assistant." | The system prompt that defines the behavior or role of the audio multimodal large model. |

## Prompt Template Description
This operator does not use a fixed prompt template. Instead, it combines the `system_prompt` parameter and the content corresponding to the `input_key` in the `run` function to form the final prompt.

Note: For the Whisper model, we can configure the corresponding task in the `system_prompt` parameter. The method is as follows:
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
| Parameter | Default | 	Description |
| :--- | :--- | :--- |
| `language` | `None` | The language of the audio file, used to specify the transcription or translation language. If set to None, the language is automatically detected from the audio content. |
| `task` | `"transcribe"` | The type of task, which can be either `"transcribe"` (for speech transcription) or `"translate"` (for speech translation). |
| `with_timestamps` | `False` | Whether to include timestamps in the transcription results. |

## `run`
```python
def run(self, storage: DataFlowStorage, input_audio_key: str = "audio", input_conversation_key: str = "conversation", output_answer_key: str = "answer"):
```
Executes the main logic of the operator. It reads the input DataFrame from storage, combines the system_prompt with the input content, calls the LALM to generate results, and writes the results back to storage.

Parameters
| Parameter Name | Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `storage` | `DataFlowStorage` | **Required** | The data storage instance for input and output, containing the input DataFrame and output results. |
| `input_audio_key` | `str` | `audio` | The column name in the input DataFrame that contains the paths to the audio files. |
| `input_conversation_key` | `str` | `conversation` | The column name in the input DataFrame that contains the conversation. |
| `output_answer_key` | `str` | `answer` | The column name in the output DataFrame that will store the generated results. |

## 🧠 Example Usage

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

### 🧾 Default Output Format
| Field | Type | Description |
| :--- | :--- | :--- |
| `answer` | `str` | The generated caption or transcription of the audio file. |


Example Input:
```jsonl
{"audio": ["/path/to/your/audio/audio.wav"], "conversation": [{"from": "human", "value": "<audio>\nTranscribe the audio in English." }]}
```

Example Output:
```jsonl
{"audio": ["/path/to/your/audio/audio.wav"], "conversation": [{"from": "human", "value": "<audio>\nTranscribe the audio in English." }], "answer": "He began a confused complaint against the wizard who had vanished behind the curtain on the left."}
```