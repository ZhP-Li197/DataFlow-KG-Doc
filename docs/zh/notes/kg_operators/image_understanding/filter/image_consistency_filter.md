---
title: ImageConsistencyFilter
createTime: 2025/10/15 15:48:32
# icon: material-symbols-light:image
permalink: /zh/mm_operators/filter/image_consistency_filter/
---
## 📘 概述
`ImageConsistencyFilter` 是一个基于 **NLI（自然语言推理）** 的一致性过滤算子，用于检查同一图像下的三元组  
**(caption, question, answer)** 在语义上是否自洽：**answer 是否可以由 caption + question 推理得到**。  

内部通过将 `caption + question` 视为前提（premise），将 `answer` 视为假设（hypothesis），调用 `bart-large-mnli` 模型计算  
**entailment 概率**，当概率低于阈值 `threshold` 时判定该样本语义不一致并将其过滤掉。


## ```__init__```函数
```python
def __init__(
    self,
    model_name: str = "facebook/bart-large-mnli",
    threshold: float = 0.35,
    device: str = None
):
    ...
```

## `init`参数说明
| 参数名       | 类型          | 默认值                      | 说明 |
| :----------- | :------------ | :-------------------------- | :--- |
| `model_name` | `str`         | `"facebook/bart-large-mnli"` | NLI 模型本地路径或 Hugging Face Model ID；内部通过 `AutoTokenizer` / `AutoModelForSequenceClassification` 加载（`local_files_only=True`, `use_safetensors=True`, `weights_only=False`）。 |
| `threshold`  | `float`       | `0.35`                      | entailment 概率阈值；若某条样本的 **caption+question → answer** 蕴含概率小于该值，则认为语义不一致并过滤掉。数值越高过滤越严格。 |
| `device`     | `str \| None` | `None`                      | 推理设备；`None` 时自动选择可用的 `"cuda"`，否则回退到 `"cpu"`。 |




## `run`函数
```python
def run(
    self,
    storage: DataFlowStorage,
    input_caption_key: str = "caption",
    input_question_key: str = "question",
    input_answer_key: str = "answer",
):
    ...
```
执行算子主逻辑：
1. **读取数据**  
   从 `storage` 中读取当前 DataFrame，一般至少包含三列：  
   - `input_caption_key`：图像描述 caption 文本；  
   - `input_question_key`：针对该图像的提问文本；  
   - `input_answer_key`：对应的回答文本。  

2. **构造前提与假设**  
   对于每一行样本：
   - 前提（premise）：`premise = caption.strip() + " " + question.strip()`  
   - 假设（hypothesis）：`hypothesis = answer.strip()`  
   若 `hypothesis` 为空，则直接将该样本视为不一致（概率记为 0）。

3. **调用 NLI 模型计算蕴含概率**  
   使用 `AutoTokenizer` 对 `(premise, hypothesis)` 做编码，输入 `bart-large-mnli` 模型得到 `logits`，  
   对 `logits` 做 softmax，取 **entailment 类别**（MNLI 中 index=2）对应的概率 `p_entail` 作为一致性得分。

4. **应用阈值进行过滤**  
   - 若 `p_entail >= threshold`，则认为该 (caption, question, answer) 三元组语义自洽，样本通过过滤；  
   - 否则判断为不一致样本并过滤，同时在调试日志中记录其得分与截断后的文本片段。

5. **写回结果**  
   - 使用布尔掩码仅保留通过过滤的样本行，并 `reset_index(drop=True)`；  
   - 将过滤后的 DataFrame 写回 `storage`；  
   - 返回 `[input_caption_key, input_question_key, input_answer_key]`，供后续算子继续使用相同的三列作为输入。


参数
| 参数名              | 类型              | 默认值        | 说明 |
| :------------------ | :---------------- | :------------ | :--- |
| `storage`           | `DataFlowStorage` | 无            | Dataflow 的读写存储对象。 |
| `input_caption_key` | `str`             | `"caption"`   | caption 文本列名，通常为图像的自然语言描述。 |
| `input_question_key`| `str`             | `"question"`  | question 文本列名，表示针对图像的提问。 |
| `input_answer_key`  | `str`             | `"answer"`    | answer 文本列名，表示对问题的回答。 |




## 🧠 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import ImageConsistencyFilter

# 1) 准备 FileStorage（至少包含 caption / question / answer 三列）
storage = FileStorage(
    first_entry_file_name="./dataflow/example/test_image_filter/test_image_filter.jsonl",
    cache_path="./cache_local",
    file_name_prefix="image_consistency_filter",
    cache_type="jsonl"
)

# 2) 初始化算子（可使用本地或 HF 模型）
filt = ImageConsistencyFilter(
    model_name="facebook/bart-large-mnli",  # 或本地路径 "../ckpt/bart-large-mnli"
    threshold=0.35,                         # entailment 概率阈值
    device=None                             # 自动选择 cuda/cpu
)

# 3) 执行过滤
cols = filt.run(
    storage=storage.step(),
    input_caption_key="caption",
    input_question_key="question",
    input_answer_key="answer"
)
print(cols)  # ["caption", "question", "answer"]
```

### 🧾 默认输出格式（Output Format）
| 字段名                                 | 类型     | 默认值 | 说明 |
| :------------------------------------- | :------- | :----- | :--- |
| `caption`（或 `input_caption_key` 指定列）  | `string` | 无 | 过滤后保留下来的图像描述文本。 |
| `question`（或 `input_question_key` 指定列） | `string` | 无 | 与 caption 一致且被判定为可推理到 answer 的问题文本。 |
| `answer`（或 `input_answer_key` 指定列）   | `string` | 无 | 在 NLI 模型下由 caption+question 蕴含概率 `≥ threshold` 的回答文本。 |

示例输入：
```jsonl
{
  "caption":  "A groom in a black tuxedo sits in a car next to his smiling bride.",
  "question": "Where are the couple sitting?",
  "answer":   "They are sitting inside a car."
}
{
  "caption":  "A groom in a black tuxedo sits in a car next to his smiling bride.",
  "question": "What color is the sky in this picture?",
  "answer":   "The sky is green with purple stripes."
}
```

示例输出：
```jsonl
{
  "caption":  "A groom in a black tuxedo sits in a car next to his smiling bride.",
  "question": "Where are the couple sitting?",
  "answer":   "They are sitting inside a car."
}

```