---
title: ComplexityFilter
createTime: 2025/10/15 16:10:28
# icon: material-symbols-light:image
permalink: /zh/mm_operators/filter/complexity_filter/
---
## 📘 概述
`ComplexityFilter` 是一个基于 **NLI（自然语言推理）** 的文本过滤算子，用于评估 caption 是否同时覆盖多种视觉能力要素（如颜色、形状、动作识别、计数、空间关系等），从而判定其**能力丰富度**。

算子会为每条 caption 构造假设句（模板：`"The following text describes {}."`），使用 MNLI 模型计算 **entailment** 概率；当命中要素的数量达到阈值（`min_k`）时保留该样本，否则过滤掉。

## ```__init__```函数
```python
def __init__(
    self,
    model_name: str = "facebook/bart-large-mnli",
    threshold: float = 0.4,
    min_k: int = 2,
    device: str = None
)
```

## `init`参数说明
| 参数名       | 类型        | 默认值                       | 说明 |
| :----------- | :---------- | :--------------------------- | :--- |
| `model_name` | `str`       | `"facebook/bart-large-mnli"` | NLI 模型本地路径或 Hugging Face Model ID；内部使用 `AutoTokenizer` / `AutoModelForSequenceClassification` 加载（`local_files_only=True`, `use_safetensors=True`, `weights_only=False`）。 |
| `threshold`  | `float`     | `0.4`                        | 将某一能力要素判定为“命中（entailment）”的最低概率阈值；数值越高过滤越严格。 |
| `min_k`      | `int`       | `2`                          | 至少需要命中的能力要素个数；若某条 caption 命中要素数 `< min_k` 则该样本会被过滤掉。 |
| `device`     | `str \| None` | `None`                    | 推理设备；`None` 时自动选择可用的 `"cuda"`，否则回退到 `"cpu"`。 |



## `run`函数
```python
def run(
    self,
    storage: DataFlowStorage,
    input_caption_key: str = "caption"
):
    ...
```
执行算子主逻辑：
1. **读取数据**  
   从 `storage` 读取当前 DataFrame，例如包含列：`caption`。

2. **为每条 caption 构造能力假设（hypotheses）**  
   内部预定义了一组能力标签（如颜色、形状、物体识别、动作识别、文本识别、空间关系、计数、场景理解等），并使用统一模板：
   > `"The following text describes {}."`  
   对于每个能力标签 capability，拼出对应假设句（hypothesis）。

3. **调用 MNLI 模型做 NLI 推理**  
   对于每个能力标签，构造前提–假设对：
   - premise：caption 文本本身  
   - hypothesis：由模板生成的能力描述句  

   使用 `bart-large-mnli` 计算该前提对该假设的 **entailment 概率**（通常是 `logits` 中第 3 维 / index 2 的 softmax 概率）。

4. **统计命中能力数**  
   - 若某个能力的 entailment 概率 ≥ `threshold`，则视为该能力被 caption “覆盖/命中”；  
   - 对所有能力标签统计命中个数 `hit_count`。

5. **过滤规则**  
   - 若 `hit_count >= min_k`，则认为该 caption 在视觉能力维度上足够丰富，样本通过过滤；  
   - 否则认为描写过于单一或内容极其简单，样本会被过滤掉。

6. **写回结果**  
   - 仅保留通过过滤的样本行（`hit_count >= min_k`），`reset_index(drop=True)` 后写回 `storage`；  
   - 返回 `[input_caption_key]`，通常为 `["caption"]`，供后续算子继续使用同一列名进行处理。



参数
| 参数名             | 类型              | 默认值        | 说明 |
| :----------------- | :---------------- | :------------ | :--- |
| `storage`          | `DataFlowStorage` | 无            | Dataflow 的读写存储对象。 |
| `input_caption_key` | `str`            | `"caption"`   | 待评估文本列名，一般为图像描述字段（caption）。 |



## 🧠 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import ComplexityFilter

# 1) 准备 FileStorage（至少包含 caption 列）
storage = FileStorage(
    first_entry_file_name="./dataflow/example/test_image_filter/test_image_filter.jsonl",
    cache_path="./cache_local",
    file_name_prefix="complexity_filter",
    cache_type="jsonl"
)

# 2) 初始化算子（可用本地或 HF 模型）
filt = ComplexityFilter(
    model_name="facebook/bart-large-mnli",  # 或 "../ckpt/bart-large-mnli"
    threshold=0.4,                          # entailment 概率阈值
    min_k=2,                                # 至少命中 2 个能力要素
    device=None                             # 自动选择 cuda/cpu
)

# 3) 执行过滤
cols = filt.run(
    storage=storage.step(),
    input_caption_key="caption"
)
print(cols)  # ["caption"]
```

### 🧾 默认输出格式（Output Format）
| 字段名                 | 类型     | 默认值 | 说明 |
| :--------------------- | :------- | :----- | :--- |
| `caption`（或 `input_caption_key` 指定列） | `string` | 无 | 过滤后保留的 caption 文本；仅包含命中能力要素数 `≥ min_k` 的样本行。 |


示例输入：
```jsonl
{
  "caption": "A red double-decker bus turns left at a city intersection while pedestrians wait at the crosswalk."
}
{
  "caption": "SALE SALE SALE 50% OFF"
}
{
  "caption": "Two kids count seashells on a sandy beach while their mother reads under a blue umbrella."
}
```

示例输出：
```jsonl
{
  "caption": "A red double-decker bus turns left at a city intersection while pedestrians wait at the crosswalk."
}
{
  "caption": "Two kids count seashells on a sandy beach while their mother reads under a blue umbrella."
}
```