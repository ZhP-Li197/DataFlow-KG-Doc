---
title: MergeChunksRowGenerator
createTime: 2025/10/14 15:41:18
# icon: material-symbols:segment
permalink: /zh/mm_operators/84xjbt9g/
---

## 📘-概述
```MergeChunksRowGenerator``` 是一个按照语音活动区域合并音频片段的算子。

## ```__init__```函数
```python
def __init__(
    self, 
    num_workers=1,
    dst_folder: str,
    timestamp_type: Literal["frame", "time"] = "time",  # 手动指定类型
    max_audio_duration: float = float('inf'),
    hop_size_samples: int = 512,  # hop_size, 是样本点数量
    sampling_rate: int = 16000,
    ):
```

## `init`参数说明
| 参数 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `num_workers` | `int` | `1` | 并行处理的工作线程数 |
| `dst_folder` | `str` | **必填** | 输出音频文件夹路径 |
| `timestamp_type` | `Literal["frame", "time"]` | `"time"` | 语音活动时间戳的类型，`frame` 表示帧索引，`time` 表示时间戳 |
| `max_audio_duration` | `float` | `float('inf')` | 最大音频时长，单位秒 |
| `hop_size_samples` | `int` | `512` | 仅当 `timestamp_type="frame"` 时有效，用于把帧索引换算为秒。 |
| `sampling_rate` | `int` | `16000` | 音频采样率，单位赫兹 |

## `run`函数
```python
def run(self,
    storage: DataFlowStorage,
    input_audio_key: str = "audio",
    input_timestamps_key: str = "timestamps",
)
```
执行算子主逻辑，从存储中读取输入 DataFrame，按照语音时间戳进行拼接得到语音片段，保存到指定目录下。

参数
| 参数名 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `storage` | `DataFlowStorage` | **必填** | 输入输出数据存储 |
| `input_audio_key` | `str` | `"audio"` | 输入音频数据的键名 |
| `input_timestamps_key` | `str` | `"timestamps"` | 输入语音活动时间戳的键名 |


## 🧠 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_audio import MergeChunksRowGenerator

class TestMergeChunksByTimestamps:
    def __init__(self):
        self.storage = FileStorage(
            first_entry_file_name="./dataflow/example/merge_chunks/sample_data_local.jsonl",
            cache_path="./cache",
            file_name_prefix="merge_chunks_by_timestamps",
            cache_type="jsonl",
        )

        self.merger = MergeChunksRowGenerator(
            num_workers=16,
            dst_folder="./cache",
            timestamp_type="time", 
            max_audio_duration=30,
            hop_size_samples=512,
            sampling_rate=16000,
        )

    def forward(self):
        self.merger.run(
            storage=self.storage.step(),
            input_audio_key="audio",
            input_timestamps_key="timestamps",
        )

if __name__ == "__main__":
    pipeline = TestMergeChunksByTimestamps()
    pipeline.forward()
```

### 🧾 默认输出格式（Output Format）
| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `audio` | `list[str]` | 每个语音片段音频文件路径列表，每个元素为一个字符串，指向拼接后的音频文件 |
| `original_audio_path` | `str` | 原始音频文件路径 |
| `sequence_num` | `int` | 语音片段序号，从 1 开始 |

示例输入:
```jsonl
{"audio": ["./dataflow/example/silero_vad/test.wav"], "conversation": [{"from": "human", "value": "<audio>" }]}
```

```jsonl
{"audio": ["cache\/test_1.wav"],"original_audio_path":".\/dataflow\/example\/silero_vad\/test.wav","conversation":[{"from":"human","value":"<audio>"}],"sequence_num":1}
{"audio":["cache\/test_2.wav"],"original_audio_path":".\/dataflow\/example\/silero_vad\/test.wav","conversation":[{"from":"human","value":"<audio>"}],"sequence_num":2}
```
在`dst_folder`内会出现音频文件。