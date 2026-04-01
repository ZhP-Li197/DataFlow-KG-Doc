---
title: CTCForcedAlignmentFilter
createTime: 2025/10/14 18:51:16
permalink: /en/mm_operators/hf4u4lhf/
---

## 📘-概述
```CTCForcedAlignmentFilter``` is a filtering operator that filters data based on CTC forced-alignment scores from speech recognition results.

## ```__init__```
```python
def __init__(
    self,
    model_path: str = "MahmoudAshraf/mms-300m-1130-forced-aligner",
    device: Union[str, List[str]] = "cuda",
    num_workers: int = 1,
    sampling_rate: int = 16000,
    language: str = "en",
    micro_batch_size: int = 16,
    chinese_to_pinyin: bool = False,
    retain_word_level_alignment: bool = True,
    romanize: bool = True,
    threshold: float = 0.8,
    threshold_mode: str = "min",
)
```

## `init` Parameters
| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `model_path` | `str` | `MahmoudAshraf/mms-300m-1130-forced-aligner` | The model identifier or path for the forced aligner used during evaluation. |
| `device` | `Union[str, List[str]]` | `cuda` | The device on which the model runs. Options: `cuda` or `cpu`. You can also specify a list of devices, such as `["cuda:0", "cuda:1"]`, to initialize multiple models on multiple GPUs. |
| `num_workers` | `int` | `1` | Degree of operator parallelism. Initializes `num_workers` model instances and assigns them to the devices specified by device. If num_workers exceeds the number of devices, multiple models will be initialized per device for concurrent execution. For example, with `device=["cuda:0", "cuda:1"]` and `num_workers=4`, two models will run on `cuda:0` and two on `cuda:1`. |
| `sampling_rate` | `int` | `16000` | Audio sampling rate, default `16000`. |
| `language` | `str` | `en` | 	Audio language, default `en`. |
| `micro_batch_size` | `int` | `16` | For long audio, the model splits it into multiple chunks. `micro_batch_size` specifies the chunk batch size per inference, default `16`. |
| `chinese_to_pinyin` | `bool` | `False` | Whether to convert Chinese characters to Pinyin, default `False`. |
| `retain_word_level_alignment` | `bool` | `False` | Whether to keep word-level alignment results, default `False`. |
| `romanize` | `bool` | `True` | Whether to romanize characters, default `True`. |
| `threshold` | `float` | `0.8` | Alignment score threshold, default `0.8`. |
| `threshold_mode` | `str` | `min` | How to apply the threshold: `min` (filter by the minimum alignment score within a span window) or `mean` (filter by the average alignment score within a span window). Samples with scores ≥ `threshold` are kept. Default is `min`. |

## `run`
```python
def run(
    self,
    storage: DataFlowStorage,
    input_audio_key: str = "audio",
    input_conversation_key: str = "conversation",
)
```

Parameters
| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `storage` | `DataFlowStorage` | **Required** | The data storage instance used to hold input and output data. |
| `input_audio_key` | `str` |` audio` | The key name for audio data in the input data, default is `audio`. |
| `input_conversation_key` | `str` | `conversation` | The key name for conversation data in the input data, default is `conversation`. |

## 🧠 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_audio import CTCForcedAlignmentFilter
from dataflow.wrapper import BatchWrapper

class testCTCForcedAlignFilter:
    def __init__(self):
        self.storage = FileStorage(
            first_entry_file_name="./dataflow/example/forced_alignment/sample_data_local.jsonl",
            cache_path="./cache",
            file_name_prefix="forced_alignment_filter",
            cache_type="jsonl",
        )
        
        self.filter = CTCForcedAlignFilter(
            model_path="/path/to/your/mms-300m-1130-forced-aligner",
            device=["cuda:0", "cuda:1", "cuda:2", "cuda:3", "cuda:4", "cuda:5", "cuda:6", "cuda:7"],
            num_workers=16,
            language="en",  
            micro_batch_size=16,
            chinese_to_pinyin=False,
            retain_word_level_alignment=True,
            threshold=0.000,
            threshold_mode="min"
        )
    
    def forward(self):
        self.filter.run(
            storage=self.storage.step(),
            input_audio_key='audio',
            input_conversation_key='conversation',
        )
        self.filter.close()

if __name__ == "__main__":
    pipline = testCTCForcedAlignFilter()
    pipline.forward()
```

### 🧾 Default Output Format

| Field | Type | Description |
| :--- | :--- | :--- |
| `forced_alignment_results` | `dict` | Forced-alignment results where `spans` represent frame-level character alignment quality and `word_timestamps` represent word-level timestamp alignment. |
| `error` | `Optional[str]` | If an error occurs during alignment score computation, the error message is stored here. If no error occurs, `error` is `null`. |

Samples that meet the alignment score threshold are retained.
If all data are filtered out, the message `All data has been filtered out!` is printed.

Example Input：
```jsonl
{"audio":["\/mnt\/public\/data\/guotianyu\/dataflow_project\/test_data\/pipeline\/audio\/Y-JLfg2sa94_16.wav"],"original_audio_path":"\/mnt\/public\/data\/guotianyu\/data\/yodas2\/data\/de000\/cleaned\/audio\/00000000\/Y-JLfg2sa94.wav","conversation":[{"from":"human","value":"<audio>"}],"sequence_num":16,"transcript":" investiv von 49 Millionen €. Letztes Jahr waren wir bei 196,3 Millionen € Zuschuss.","records":{"spans":[{"label":"<star>","start":0,"end":2,"score":1.0},{"label":"i","start":3,"end":3,"score":0.9925918349},{"label":"<blank>","start":4,"end":5,"score":0.9889664197},{"label":"n","start":6,"end":6,"score":0.9973504597},{"label":"<blank>","start":7,"end":8,"score":0.9843996647},{"label":"v","start":9,"end":9,"score":0.8272865643},{"label":"<blank>","start":10,"end":11,"score":0.9995368481},{"label":"e","start":12,"end":12,"score":0.9979236413},{"label":"<blank>","start":13,"end":16,"score":0.9889825096},{"label":"s","start":17,"end":17,"score":0.9984958182},{"label":"<blank>","start":18,"end":20,"score":0.9993385878},{"label":"t","start":21,"end":21,"score":0.9995799638},{"label":"<blank>","start":22,"end":24,"score":0.9995224373},{"label":"i","start":25,"end":25,"score":0.9985789019},{"label":"<blank>","start":26,"end":30,"score":0.9991561149},{"label":"v","start":31,"end":31,"score":0.9708748246},{"label":"<star>","start":32,"end":49,"score":1.0},{"label":"v","start":50,"end":50,"score":0.9987837582},{"label":"<blank>","start":51,"end":51,"score":0.9999271684},{"label":"o","start":52,"end":52,"score":0.9982035305},{"label":"<blank>","start":53,"end":55,"score":0.9888320058},{"label":"n","start":56,"end":56,"score":0.9931998912},{"label":"<star>","start":57,"end":79,"score":1.0},{"label":"<blank>","start":79,"end":80,"score":1.0},{"label":"<star>","start":57,"end":79,"score":1.0},{"label":"<blank>","start":79,"end":80,"score":1.0},{"label":"<blank>","start":80,"end":81,"score":0.9998090632},{"label":"<star>","start":81,"end":105,"score":1.0},{"label":"m","start":106,"end":106,"score":0.9963940939},{"label":"i","start":107,"end":107,"score":0.9928616894},{"label":"<blank>","start":108,"end":108,"score":0.9737983872},{"label":"l","start":109,"end":109,"score":0.9844908165},{"label":"<blank>","start":110,"end":110,"score":0.9991043491},{"label":"l","start":111,"end":111,"score":0.9898919851},{"label":"i","start":112,"end":112,"score":0.9784479436},{"label":"<blank>","start":113,"end":114,"score":0.986829231},{"label":"o","start":115,"end":115,"score":0.9896943798},{"label":"<blank>","start":116,"end":118,"score":0.9953155453},{"label":"n","start":119,"end":120,"score":0.992520313},{"label":"e","start":121,"end":121,"score":0.9877417278},{"label":"<blank>","start":122,"end":122,"score":0.965699213},{"label":"n","start":123,"end":123,"score":0.9807039321},{"label":"<star>","start":124,"end":130,"score":1.0},{"label":"<blank>","start":130,"end":131,"score":1.0},{"label":"<star>","start":124,"end":130,"score":1.0},{"label":"<blank>","start":130,"end":131,"score":1.0},{"label":"<blank>","start":131,"end":132,"score":0.9999870064},{"label":"<star>","start":132,"end":178,"score":1.0},{"label":"l","start":179,"end":179,"score":0.9993295399},{"label":"<blank>","start":180,"end":181,"score":0.9948817351},{"label":"e","start":182,"end":183,"score":0.9990918546},{"label":"<blank>","start":184,"end":184,"score":0.9989779914},{"label":"t","start":185,"end":185,"score":0.9994911162},{"label":"<blank>","start":186,"end":186,"score":0.9991557579},{"label":"z","start":187,"end":187,"score":0.9989952417},{"label":"<blank>","start":188,"end":189,"score":0.999324897},{"label":"t","start":190,"end":190,"score":0.9989099476},{"label":"<blank>","start":191,"end":191,"score":0.9995816313},{"label":"e","start":192,"end":192,"score":0.9992557347},{"label":"<blank>","start":193,"end":194,"score":0.9997553232},{"label":"s","start":195,"end":195,"score":0.9982499761},{"label":"<star>","start":196,"end":198,"score":1.0},{"label":"j","start":199,"end":199,"score":0.9973103816},{"label":"<blank>","start":200,"end":201,"score":0.9999772315},{"label":"a","start":202,"end":202,"score":0.999654889},{"label":"<blank>","start":203,"end":204,"score":0.9999605433},{"label":"h","start":205,"end":206,"score":0.9631482411},{"label":"r","start":207,"end":207,"score":0.9946382591},{"label":"<star>","start":208,"end":223,"score":1.0},{"label":"w","start":224,"end":224,"score":0.9996008083},{"label":"a","start":225,"end":225,"score":0.9991905095},{"label":"<blank>","start":226,"end":228,"score":0.9969672427},{"label":"r","start":229,"end":229,"score":0.9985290975},{"label":"e","start":230,"end":230,"score":0.9972066446},{"label":"<blank>","start":231,"end":231,"score":0.8013957173},{"label":"n","start":232,"end":232,"score":0.9953981005},{"label":"<star>","start":233,"end":233,"score":1.0},{"label":"w","start":234,"end":234,"score":0.9964654648},{"label":"<blank>","start":235,"end":235,"score":0.9998856914},{"label":"i","start":236,"end":236,"score":0.9986885127},{"label":"<blank>","start":237,"end":237,"score":0.9934144287},{"label":"r","start":238,"end":238,"score":0.9967120865},{"label":"<star>","start":239,"end":240,"score":1.0},{"label":"b","start":241,"end":241,"score":0.9948738297},{"label":"<blank>","start":242,"end":243,"score":0.9999034498},{"label":"e","start":244,"end":244,"score":0.9967014281},{"label":"<blank>","start":245,"end":246,"score":0.9964378857},{"label":"i","start":247,"end":247,"score":0.9959250527},{"label":"<star>","start":248,"end":311,"score":1.0},{"label":"<blank>","start":311,"end":312,"score":1.0},{"label":"<star>","start":248,"end":311,"score":1.0},{"label":"<blank>","start":311,"end":312,"score":1.0},{"label":"<blank>","start":312,"end":313,"score":0.9998833077},{"label":"<star>","start":313,"end":378,"score":1.0},{"label":"m","start":379,"end":379,"score":0.9962221595},{"label":"<blank>","start":380,"end":380,"score":0.9993571602},{"label":"i","start":381,"end":381,"score":0.9857599262},{"label":"l","start":382,"end":383,"score":0.9441230641},{"label":"<blank>","start":384,"end":384,"score":0.9984223737},{"label":"l","start":385,"end":385,"score":0.9840950191},{"label":"<blank>","start":386,"end":386,"score":0.5950818498},{"label":"i","start":387,"end":387,"score":0.9707769628},{"label":"<blank>","start":388,"end":390,"score":0.998086307},{"label":"o","start":391,"end":391,"score":0.9834127363},{"label":"<blank>","start":392,"end":395,"score":0.9996619176},{"label":"n","start":396,"end":396,"score":0.9867493682},{"label":"<blank>","start":397,"end":397,"score":0.9988193164},{"label":"e","start":398,"end":398,"score":0.9917604021},{"label":"<blank>","start":399,"end":399,"score":0.9995466143},{"label":"n","start":400,"end":400,"score":0.9514811559},{"label":"<star>","start":401,"end":411,"score":1.0},{"label":"<blank>","start":411,"end":412,"score":1.0},{"label":"<star>","start":401,"end":411,"score":1.0},{"label":"<blank>","start":411,"end":412,"score":1.0},{"label":"<blank>","start":412,"end":413,"score":0.9999785428},{"label":"<star>","start":413,"end":440,"score":1.0},{"label":"z","start":441,"end":441,"score":0.9908037207},{"label":"<blank>","start":442,"end":444,"score":0.999720294},{"label":"u","start":445,"end":445,"score":0.9947576228},{"label":"<blank>","start":446,"end":451,"score":0.9990153481},{"label":"s","start":452,"end":453,"score":0.9353851599},{"label":"c","start":454,"end":454,"score":0.8858152079},{"label":"h","start":455,"end":456,"score":0.9722042517},{"label":"<blank>","start":457,"end":457,"score":0.9967161131},{"label":"u","start":458,"end":458,"score":0.9897818443},{"label":"<blank>","start":459,"end":461,"score":0.9973225945},{"label":"s","start":462,"end":462,"score":0.568458874},{"label":"<blank>","start":463,"end":464,"score":0.9947019476},{"label":"s","start":465,"end":465,"score":0.9875671855},{"label":"<blank>","start":465,"end":473,"score":0.9875671855}],"word_timestamps":[{"start":0.063,"end":0.651,"text":"investiv","score":0.6961234218},{"start":1.05,"end":1.176,"text":"von","score":0.9838068868},{"start":1.197,"end":1.68,"text":"49","score":1.0},{"start":2.226,"end":2.583,"text":"Millionen","score":0.4438389667},{"start":2.604,"end":2.751,"text":"€.","score":1.0},{"start":3.759,"end":4.095,"text":"Letztes","score":0.4900010267},{"start":4.179,"end":4.347,"text":"Jahr","score":0.9342902419},{"start":4.704,"end":4.872,"text":"waren","score":0.7909908513},{"start":4.914,"end":4.998,"text":"wir","score":0.9884919191},{"start":5.061,"end":5.187,"text":"bei","score":0.9873956471},{"start":5.208,"end":6.552,"text":"196,3","score":1.0},{"start":7.959,"end":8.4,"text":"Millionen","score":0.3219400823},{"start":8.421,"end":8.652,"text":"€","score":1.0},{"start":9.261,"end":9.933,"text":"Zuschuss.","score":0.1340372737}],"error":null}}
```

Example Output：
```jsonl
All data has been filtered out!
```