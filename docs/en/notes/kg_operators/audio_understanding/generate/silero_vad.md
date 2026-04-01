---
title: SileroVADGenerator
createTime: 2025/10/14 18:15:42
permalink: /en/mm_operators/x8vlrtba/
---


## 📘 Overview
```SileroVADGenerator``` is a Voice Activity Detection (VAD) operator used to identify segments of speech activity within an audio signal.


## ```__init__```
```python
def __init__(self, 
    repo_or_dir: str = "snakers4/silero-vad", 
    source: str = "github",
    device: Union[str, List[str]] = "cuda",
    num_workers: int = 1,
    threshold: float = 0.5,
    use_min_cut: bool = False,
    sampling_rate: int = 16000,
    min_speech_duration_s: float = 0.25,
    max_speech_duration_s: float = float('inf'),
    min_silence_duration_s: float = 0.1,
    speech_pad_s: float = 0.03,
    return_seconds: bool = False,
    time_resolution: int = 1,
    neg_threshold: float = None,
    min_silence_at_max_speech: float = 0.098,
    use_max_poss_sil_at_max_speech: bool = True 
)
```


## `init` Parameters
| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `repo_or_dir` | `str` | `snakers4/silero-vad` | The repository or local directory of the model. |
| `source` | `str` | `github` | The source of the model, either `github` or `local`. |
| `device` | `Union[str, List[str]]` | `cuda` | The device(s) to run the model on. Can be a single device string (e.g., "cuda" or "cpu") or a list of device strings (e.g., `["cuda:0", "cuda:1"]`). |
| `num_workers` | `int` | `1` | The number of parallel workers (models) to initialize. These are distributed across the devices specified in the device parameter. If `num_workers` exceeds the number of available devices, multiple models will be initialized per device. For example, with `device=["cuda:0", "cuda:1"]` and `num_workers=4`, two models will run on `cuda:0` and two on `cuda:1`. |
| `threshold` | `float` | `0.5` | The VAD threshold used to determine whether a segment is speech. |
| `use_min_cut` | `bool` | `False` | Whether to use the min-cut algorithm to split overly long speech regions. It searches for the lowest VAD probability point in the latter half of a long segment to cut, avoiding hard cuts at the window boundary. |
| `sampling_rate` | `int` | `16000` | The audio sampling rate, must be 16000. |
| `min_speech_duration_s` | `float` | `0.25` | Minimum duration (in seconds) for a speech segment. Segments shorter than this are discarded. |
| `max_speech_duration_s` | `float` | `float('inf')` | Maximum duration (in seconds) for a speech segment. Longer segments are truncated. If exceeded, the model first attempts to cut at a sufficiently long silent period. If none exists: `use_min_cut=True`: cut at the frame with the lowest probability in the latter half. `use_min_cut=False`: hard cut at the boundary. | 
| `min_silence_duration_s` | `float` | `0.1` | Minimum silence duration (in seconds). Silences shorter than this are merged. |
| `speech_pad_s` | `float` | `0.03` | Padding (in seconds) added to both sides of detected speech segments. Helps avoid overly tight segmentation between short silences. |
| `return_seconds` | `bool` | `False` | If True, the output start and end are expressed in seconds; otherwise, in sample indices. |
| `time_resolution` | `int` | `1` | The time resolution (in seconds) for timestamp rounding when `return_seconds=True`. |
| `neg_threshold` | `Optional[float]` |` None` | Negative threshold for VAD. If `None`, set to `max(threshold - 0.15, 0.01)`. Lower values reduce jitter but increase sensitivity. |
| `min_silence_at_max_speech` | `float`| `0.098` | Maximum silence duration allowed (in seconds) when a speech region exceeds `max_speech_duration_s`. The algorithm will attempt normal silent cuts first, then fall back to min-cut if needed. |
| `use_max_poss_sil_at_max_speech` | `bool` | `True` | When the `max_speech_duration_s` limit is reached and multiple candidate silences exist, whether to select the longest one as the cut point. |

Note: The Silero VAD model loads weights from the GitHub repository, not from the Hugging Face hub.

## `run`
```python
def run(
    self,
    storage: DataFlowStorage,
    input_audio_key: str = "audio",
    output_answer_key: str = "timestamps",           
    )
```
Executes the main logic of the operator. It reads the input DataFrame from storage, calls the Silero VAD model to generate speech segment timestamps, and writes the results back to storage.


Parameters
| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `storage` | `DataFlowStorage` | **Required** | The data storage instance used for reading input and writing output. |
| `input_audio_key` | `str` | `audio` | The key name for the column containing paths to audio files. |
| `output_answer_key` | `str` | `timestamps` | The key name for the column where the list of detected speech segment timestamps will be stored. |

## 🧠 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_audio import SileroVADGenerator

class SileroVADGeneratorEval:
    def __init__(self):
        self.storage = FileStorage(
            first_entry_file_name="./dataflow/example/silero_vad/sample_data_local.jsonl",
            cache_path="./cache",
            file_name_prefix="silero_vad",
            cache_type="jsonl",
        )

        self.silero_vad_generator = SileroVADGenerator(
            repo_or_dir="/path/to/your/silero-vad",
            source="local",
            device=['cuda:0'],
            num_workers=1,
            threshold=0.5,
            use_min_cut=False,
            sampling_rate=16000,
            min_speech_duration_s=0.25,
            max_speech_duration_s=float('inf'),
            min_silence_duration_s=0.1,
            speech_pad_s=0.03,
            return_seconds=True,
            time_resolution=1,
            neg_threshold=None,
            window_size_samples=512,
            min_silence_at_max_speech=98,
            use_max_poss_sil_at_max_speech=True,
        )
    
    def forward(self):
        self.silero_vad_generator.run(
            storage=self.storage.step(),
            input_audio_key='audio',
            output_answer_key='timestamps',
        )

    
if __name__ == "__main__":
    pipline = SileroVADGeneratorEval()
    pipline.forward()
```

### 🧾 Default Output Format
| Field | Type | Description |
| :--- | :--- | :--- |
| `timestamps` | `list[dict]` | A list of speech segment timestamps. Each element is a dictionary containing `start` and `end` keys, representing the start and end times (in seconds) of the detected speech segment. |


Example Input:
```jsonl
{"audio": ["./dataflow/example/silero_vad/test.wav"], "conversation": [{"from": "human", "value": "<audio>" }]}
```

Example Output:
```jsonl
{"audio":[".\/dataflow\/example\/silero_vad\/test.wav"],"conversation":[{"from":"human","value":"<audio>"}],"timestamps":[{"start":0.0,"end":2.0},{"start":2.7,"end":4.9},{"start":5.0,"end":6.8},{"start":9.3,"end":10.3},{"start":10.4,"end":13.4},{"start":13.5,"end":15.1},{"start":15.3,"end":15.8},{"start":16.3,"end":17.9},{"start":18.4,"end":19.6},{"start":20.4,"end":32.6},{"start":32.7,"end":35.7},{"start":35.8,"end":37.6},{"start":38.0,"end":38.9},{"start":39.9,"end":43.3},{"start":43.6,"end":44.6},{"start":45.1,"end":46.8},{"start":48.9,"end":50.0},{"start":51.1,"end":53.4},{"start":53.5,"end":54.2},{"start":54.5,"end":56.5},{"start":56.6,"end":57.4},{"start":57.5,"end":59.5}]}

```