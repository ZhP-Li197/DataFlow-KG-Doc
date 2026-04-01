---
title: CTCForcedAlignmentSampleEvaluator
createTime: 2025/10/14 17:01:41
# icon: material-symbols:add-notes-outline
permalink: /zh/mm_operators/ggd0pjat/
---

## 📘-概述
```CTCForcedAlignmentSampleEvaluator``` 是一个评估算子，用于评估基于 CTC 强制对齐的语音识别结果。

## ```__init__```函数
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
    retain_word_level_alignment: bool = False,
    romanize=True,
)
```

## `init`参数说明
| 参数名 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `model_path` | `str` | `MahmoudAshraf/mms-300m-1130-forced-aligner` | 执行生成所用的音频多模态大模型服务实例。 |
| `device` | `Union[str, List[str]]` | `cuda` | 模型运行的设备，可选值为 `cuda` 或 `cpu`，也可以选择传入列表，如`["cuda:0", "cuda:1"]`，表示在多个GPU上初始化多个模型并行运行。 |
| `num_workers` | `int` | `1` | 算子并行数，初始化num_workers个模型，依次分配在device参数指定的设备上。当`num_workers`初始化数量大于设备数量时，会自动在每个设备上初始化多个模型并发运行。如：指定设备为`["cuda:0", "cuda:1"]`，`num_workers`为`4`，则会在`cuda:0`上初始化两个模型，在`cuda:1`上初始化两个模型。 |
| `sampling_rate` | `int` | `16000` | 音频采样率，默认值为 `16000`。 |
| `language` | `str` | `en` | 音频语言，默认值为 `en`。 |
| `micro_batch_size` | `int` | `16` | 当音频过长时，模型会将音频数据拆分成多个片段，`micro_batch_size`表示一次推理的为片段批次大小，默认值为 16。 |
| `chinese_to_pinyin` | `bool` | `False` | 是否将中文字符转换为拼音，默认值为 `False`。 |
| `retain_word_level_alignment` | `bool` | `False` | 是否保留单词级别的对齐结果，默认值为 `False`。 |
| `romanize` | `bool` | `True` | 是否对字符进行罗马化处理，默认值为 `True`。 |

## `run`函数
```python
def run(
    self, 
    storage: DataFlowStorage,
    input_audio_key: str = "audio",
    input_conversation_key: str = "conversation",
    output_answer_key='forced_alignment_results',
)
```
执行算子主逻辑，对输入的音频和对话进行强制对齐，返回对齐结果。

参数
| 参数名 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `storage` | `DataFlowStorage` | **必填** | 数据存储实例，用于存储输入和输出数据。 |
| `input_audio_key` | `str` | `audio` | 输入数据中音频数据的键名，默认值为 `audio`。 |
| `input_conversation_key` | `str` | `conversation` | 输入数据中对话数据的键名，默认值为 `conversation`。 |
| `output_answer_key` | `str` | `forced_alignment_results` | 输出数据中对齐结果的键名，默认值为 `forced_alignment_results`。 |

## 🧠 示例用法

```python
from dataflow.operators.core_audio import CTCForcedAlignmentSampleEvaluator
from dataflow.operators.conversations import Conversation2Message
from dataflow.serving import LocalModelVLMServing_vllm
from dataflow.utils.storage import FileStorage

class ForcedAlignEval():
    def __init__(self):
        self.storage = FileStorage(
            first_entry_file_name="./dataflow/example/forced_alignment/sample_data_local.jsonl",
            cache_path="./cache",
            file_name_prefix="forced_alignment",
            cache_type="jsonl",
        )

        self.aligner = CTCForcedAlignmentSampleEvaluator(
            model_path="/path/to/your/mms-300m-1130-forced-aligner",
            device="cpu",
            language="en",      
            micro_batch_size=16,
            chinese_to_pinyin=False,
            retain_word_level_alignment=True,
        )
    
    def forward(self):
        self.aligner.run(
            storage=self.storage.step(),
            input_audio_key='audio',
            input_conversation_key='conversation',
            output_answer_key="forced_alignment_results",
        )

if __name__ == "__main__":
    eval = ForcedAlignEval()
    eval.forward()
```

### 🧾 默认输出格式（Output Format）

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `forced_alignment_results` | `dict` | 强制对齐结果，其中`spans`表示帧级字符对齐程度，`word_timestamps`表示单词级别的时间戳对齐结果。 |
| `error` | `Optional[str]` | 当对齐分数计算过程中出现错误时，会将错误信息存储在该字段中。 没有错误时，`error`字段为`null`|

示例输入：
```jsonl
{"audio": ["./dataflow/example/forced_alignment/61-70968-0000.flac"], "conversation": [{"from": "human", "value": "He began a confused complaint against the wizard, who had vanished behind the curtain on the left." }]}
```

示例输出：
```jsonl
{"audio":[".\/dataflow\/example\/forced_alignment\/61-70968-0000.flac"],"conversation":[{"from":"human","value":"He began a confused complaint against the wizard, who had vanished behind the curtain on the left."}],"forced_alignment_results":{"spans":[{"label":"<star>","start":0,"end":13,"score":1.0},{"label":"h","start":14,"end":14,"score":0.9944099905},{"label":"e","start":15,"end":15,"score":0.9996913432},{"label":"<star>","start":16,"end":17,"score":1.0},{"label":"b","start":18,"end":18,"score":0.9999502922},{"label":"<blank>","start":19,"end":19,"score":0.9999653113},{"label":"e","start":20,"end":20,"score":0.9999462395},{"label":"<blank>","start":21,"end":22,"score":0.9999861719},{"label":"g","start":23,"end":23,"score":0.9999729402},{"label":"<blank>","start":24,"end":25,"score":0.9999859335},{"label":"a","start":26,"end":26,"score":0.9998712705},{"label":"<blank>","start":27,"end":29,"score":0.9990218917},{"label":"n","start":30,"end":30,"score":0.9998544666},{"label":"<star>","start":31,"end":32,"score":1.0},{"label":"a","start":33,"end":33,"score":0.9973852044},{"label":"<star>","start":34,"end":35,"score":1.0},{"label":"c","start":36,"end":36,"score":0.9999755627},{"label":"<blank>","start":37,"end":38,"score":0.986058881},{"label":"o","start":39,"end":39,"score":0.9998589953},{"label":"<blank>","start":40,"end":41,"score":0.9999235927},{"label":"n","start":42,"end":42,"score":0.9998243164},{"label":"<blank>","start":43,"end":44,"score":0.9989274336},{"label":"f","start":45,"end":45,"score":0.9998222905},{"label":"<blank>","start":46,"end":49,"score":0.9999843838},{"label":"u","start":50,"end":50,"score":0.9999684105},{"label":"<blank>","start":51,"end":55,"score":0.9996856248},{"label":"s","start":56,"end":56,"score":0.9999433788},{"label":"<blank>","start":57,"end":57,"score":0.9999479083},{"label":"e","start":58,"end":58,"score":0.9998414768},{"label":"d","start":59,"end":59,"score":0.9976356037},{"label":"<star>","start":60,"end":61,"score":1.0},{"label":"c","start":62,"end":62,"score":0.9999769931},{"label":"o","start":63,"end":63,"score":0.9999562521},{"label":"<blank>","start":64,"end":65,"score":0.9999173948},{"label":"m","start":66,"end":66,"score":0.9999008277},{"label":"<blank>","start":67,"end":67,"score":0.9999220432},{"label":"p","start":68,"end":68,"score":0.9999656689},{"label":"<blank>","start":69,"end":70,"score":0.9997907123},{"label":"l","start":71,"end":71,"score":0.9999415909},{"label":"<blank>","start":72,"end":73,"score":0.9980937885},{"label":"a","start":74,"end":74,"score":0.9996745454},{"label":"<blank>","start":75,"end":75,"score":0.9993725187},{"label":"i","start":76,"end":76,"score":0.9660214922},{"label":"<blank>","start":77,"end":77,"score":0.9805288893},{"label":"n","start":78,"end":78,"score":0.9996633471},{"label":"<blank>","start":79,"end":79,"score":0.9628466626},{"label":"t","start":80,"end":80,"score":0.9995189836},{"label":"<star>","start":81,"end":82,"score":1.0},{"label":"a","start":83,"end":83,"score":0.9994877818},{"label":"<blank>","start":84,"end":84,"score":0.9999680529},{"label":"g","start":85,"end":85,"score":0.9999853375},{"label":"<blank>","start":86,"end":86,"score":0.9993598985},{"label":"a","start":87,"end":87,"score":0.9998275339},{"label":"<blank>","start":88,"end":88,"score":0.9815723951},{"label":"i","start":89,"end":89,"score":0.9996103375},{"label":"n","start":90,"end":91,"score":0.9477813496},{"label":"<blank>","start":92,"end":92,"score":0.9570949504},{"label":"s","start":93,"end":94,"score":0.9995631696},{"label":"t","start":95,"end":95,"score":0.9985741471},{"label":"<star>","start":96,"end":96,"score":1.0},{"label":"t","start":97,"end":97,"score":0.9929117535},{"label":"h","start":98,"end":99,"score":0.954817569},{"label":"e","start":100,"end":100,"score":0.9990323617},{"label":"<star>","start":101,"end":102,"score":1.0},{"label":"w","start":103,"end":103,"score":0.9961768486},{"label":"<blank>","start":104,"end":105,"score":0.97494578},{"label":"i","start":106,"end":106,"score":0.9853525761},{"label":"<blank>","start":107,"end":108,"score":0.9453579237},{"label":"z","start":109,"end":109,"score":0.1295572992},{"label":"<blank>","start":110,"end":112,"score":0.9849403574},{"label":"a","start":113,"end":113,"score":0.4104379223},{"label":"<blank>","start":114,"end":114,"score":0.9903937117},{"label":"r","start":115,"end":115,"score":0.9976006043},{"label":"<blank>","start":116,"end":117,"score":0.9362549043},{"label":"d","start":118,"end":118,"score":0.9871563645},{"label":"<star>","start":119,"end":132,"score":1.0},{"label":"w","start":133,"end":133,"score":0.9999108394},{"label":"h","start":134,"end":134,"score":0.9992416892},{"label":"<blank>","start":135,"end":135,"score":0.5053124213},{"label":"o","start":136,"end":136,"score":0.9987636612},{"label":"<star>","start":137,"end":137,"score":1.0},{"label":"h","start":138,"end":138,"score":0.0091890208},{"label":"<blank>","start":139,"end":139,"score":0.9943063848},{"label":"a","start":140,"end":140,"score":0.9835163913},{"label":"<blank>","start":141,"end":141,"score":0.9990810264},{"label":"d","start":142,"end":142,"score":0.9954436951},{"label":"<star>","start":143,"end":144,"score":1.0},{"label":"v","start":145,"end":145,"score":0.9999470739},{"label":"<blank>","start":146,"end":148,"score":0.9999332473},{"label":"a","start":149,"end":149,"score":0.9995909219},{"label":"<blank>","start":150,"end":152,"score":0.9925457974},{"label":"n","start":153,"end":154,"score":0.9623431922},{"label":"<blank>","start":155,"end":155,"score":0.9990886418},{"label":"i","start":156,"end":156,"score":0.978378219},{"label":"<blank>","start":157,"end":158,"score":0.9998401659},{"label":"s","start":159,"end":159,"score":0.9996010465},{"label":"h","start":160,"end":161,"score":0.9612069715},{"label":"e","start":162,"end":162,"score":0.0587350314},{"label":"d","start":163,"end":163,"score":0.17652149},{"label":"<star>","start":164,"end":164,"score":1.0},{"label":"b","start":165,"end":165,"score":0.2643482682},{"label":"e","start":166,"end":166,"score":0.9998294406},{"label":"<blank>","start":167,"end":169,"score":0.87159205},{"label":"h","start":170,"end":170,"score":0.9999492194},{"label":"<blank>","start":171,"end":174,"score":0.9913357762},{"label":"i","start":175,"end":175,"score":0.9999614969},{"label":"n","start":176,"end":177,"score":0.9981051892},{"label":"d","start":178,"end":178,"score":0.9991997928},{"label":"<star>","start":179,"end":179,"score":1.0},{"label":"t","start":180,"end":180,"score":0.9978940823},{"label":"h","start":181,"end":181,"score":0.998119084},{"label":"<blank>","start":182,"end":182,"score":0.5370870867},{"label":"e","start":183,"end":183,"score":0.9992308577},{"label":"<star>","start":184,"end":184,"score":1.0},{"label":"c","start":185,"end":185,"score":0.9997928572},{"label":"<blank>","start":186,"end":188,"score":0.9995793682},{"label":"u","start":189,"end":189,"score":0.9899866125},{"label":"<blank>","start":190,"end":191,"score":0.9352716948},{"label":"r","start":192,"end":192,"score":0.999799411},{"label":"<blank>","start":193,"end":194,"score":0.9997137412},{"label":"t","start":195,"end":195,"score":0.9991617083},{"label":"<blank>","start":196,"end":196,"score":0.9915706058},{"label":"a","start":197,"end":197,"score":0.7488822975},{"label":"i","start":198,"end":198,"score":0.0866946965},{"label":"<blank>","start":199,"end":199,"score":0.5098191014},{"label":"n","start":200,"end":200,"score":0.9962274835},{"label":"<star>","start":201,"end":202,"score":1.0},{"label":"o","start":203,"end":203,"score":0.9990571099},{"label":"<blank>","start":204,"end":205,"score":0.9987585478},{"label":"n","start":206,"end":206,"score":0.9989653813},{"label":"<star>","start":207,"end":208,"score":1.0},{"label":"t","start":209,"end":209,"score":0.9983147222},{"label":"h","start":210,"end":210,"score":0.999605692},{"label":"e","start":211,"end":211,"score":0.9982435613},{"label":"<star>","start":212,"end":215,"score":1.0},{"label":"l","start":216,"end":216,"score":0.9998294406},{"label":"<blank>","start":217,"end":219,"score":0.8514279676},{"label":"e","start":220,"end":220,"score":0.9999002318},{"label":"<blank>","start":221,"end":225,"score":0.7106267244},{"label":"f","start":226,"end":226,"score":0.9998941534},{"label":"<blank>","start":227,"end":229,"score":0.9998617363},{"label":"t","start":230,"end":230,"score":0.9996452398},{"label":"<blank>","start":230,"end":244,"score":0.9996452398}],"word_timestamps":[{"start":0.294,"end":0.315,"text":"He","score":0.9944099905},{"start":0.378,"end":0.63,"text":"began","score":0.9954342042},{"start":0.693,"end":0.693,"text":"a","score":1.0},{"start":0.756,"end":1.239,"text":"confused","score":0.9379318141},{"start":1.302,"end":1.68,"text":"complaint","score":0.9084427351},{"start":1.743,"end":1.995,"text":"against","score":0.7928364618},{"start":2.037,"end":2.1,"text":"the","score":0.9449287783},{"start":2.163,"end":2.478,"text":"wizard,","score":0.0313864711},{"start":2.793,"end":2.856,"text":"who","score":0.5048842208},{"start":2.898,"end":2.982,"text":"had","score":0.0089778396},{"start":3.045,"end":3.423,"text":"vanished","score":0.0523746931},{"start":3.465,"end":3.738,"text":"behind","score":0.2274623411},{"start":3.78,"end":3.843,"text":"the","score":0.5349479353},{"start":3.885,"end":4.2,"text":"curtain","score":0.0299149326},{"start":4.263,"end":4.326,"text":"on","score":0.9975994367},{"start":4.389,"end":4.431,"text":"the","score":0.9979210787},{"start":4.536,"end":5.124,"text":"left.","score":0.603946861}],"error":null}}

```