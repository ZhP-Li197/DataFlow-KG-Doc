---
title: MergeChunksRowGenerator
createTime: 2025/10/14 18:26:49
permalink: /en/mm_operators/qlblfsr2/
---


## 📘 Overview
```MergeChunksRowGenerator``` is an operator that merges audio segments based on detected speech activity regions.

## ```__init__```
```python
def __init__(
    self, 
    num_workers=1,
    dst_folder: str,
    timestamp_type: Literal["frame", "time"] = "time",
    max_audio_duration: float = float('inf'),
    hop_size_samples: int = 512, 
    sampling_rate: int = 16000,
    ):
```

## init Parameters
| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `num_workers` | `int` | `1` | Number of worker threads for parallel processing |
| `dst_folder` | `str` | **Required** | The path to the output audio folder where merged audio files will be saved. |
| `timestamp_type` | `Literal["frame", "time"]` | `"time"` | The type of speech activity timestamps: `frame` indicates frame indices, and `time` indicates timestamps in seconds. |
| `max_audio_duration` | `float` | `float('inf')` | Maximum audio duration in seconds. |
| `hop_size_samples` | `int` | `512` | Only applicable when `timestamp_type="frame"`. The hop size in samples used to convert frame indices to seconds. |
| `sampling_rate` | `int` | `16000` | Audio sampling rate in Hz. |

## `run`
```python
def run(self,
    storage: DataFlowStorage,
    input_audio_key: str = "audio",
    input_timestamps_key: str = "timestamps",
)
```
Executes the main logic of the operator. It reads the input DataFrame from storage, merges audio segments according to speech timestamps, and saves the resulting audio files into the specified output directory.

Parameters
| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `storage` | `DataFlowStorage` | **Required** | The storage instance used for reading input data and writing output data. |
| `input_audio_key` | `str` | `"audio"` | The key name for the input audio data in the DataFrame. |
| `input_timestamps_key` | `str` | `"timestamps"` | The key name for accessing speech activity timestamps in the input DataFrame. |


## 🧠 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_audio import MergeChunksByTimestamps

class TestMergeChunksByTimestamps:
    def __init__(self):
        self.storage = FileStorage(
            first_entry_file_name="./dataflow/example/merge_chunks/sample_data_local.jsonl",
            cache_path="./cache",
            file_name_prefix="merge_chunks_by_timestamps",
            cache_type="jsonl",
        )

        self.merger = MergeChunksByTimestamps(
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

### 🧾 Output Format
| Field | Type | Description |
| :--- | :--- | :--- |
| `audio` | `list[str]` | A list of audio file paths, each representing a merged speech segment. |
| `original_audio_path` | `str` | The file path of the original input audio. |
| `sequence_num` | `int` | The sequence number of the merged audio segment, starting from 1. |


Example Input:
```jsonl
{"audio": ["./dataflow/example/silero_vad/test.wav"], "conversation": [{"from": "human", "value": "<audio>" }]}
```

Example Output:
```jsonl
{"audio": ["cache\/test_1.wav"],"original_audio_path":".\/dataflow\/example\/silero_vad\/test.wav","conversation":[{"from":"human","value":"<audio>"}],"sequence_num":1}
{"audio":["cache\/test_2.wav"],"original_audio_path":".\/dataflow\/example\/silero_vad\/test.wav","conversation":[{"from":"human","value":"<audio>"}],"sequence_num":2}
```
After execution, the merged audio files will appear in the specified `dst_folder`.