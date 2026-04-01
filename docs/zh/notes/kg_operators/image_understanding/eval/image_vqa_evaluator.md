---
title: ImageVQAScoreEvaluator
createTime: 2025/10/15 14:52:29
# icon: material-symbols-light:image
permalink: /zh/mm_operators/eval/image_vqa_evaluator/
---
## 📘 概述
`ImageVQAScoreEvaluator` 基于 **BLIP 视觉问答模型**，计算“图像是否与给定文本描述匹配”的 **Yes 概率分数**，取值范围为 `[0,1]`。  
内部思路：将文本包装成“该图像是否符合该描述？”的英文问句，分别以 `"yes"` 与 `"no"` 作为候选答案，  
利用模型对两种答案的损失构造相对概率，以 `"yes"` 的归一化概率作为图文一致性分数。





## ```__init__```函数
```python
def __init__(
    self,
    model_name: str = "Salesforce/blip-vqa-base",
    device: str = None,
    local_only: bool = True,
):
  ...
```

## `init`参数说明
| 参数名        | 类型          | 默认值                       | 说明 |
| :------------ | :------------ | :--------------------------- | :--- |
| `model_name`  | `str`         | `"Salesforce/blip-vqa-base"` | BLIP VQA 模型的 HF Model ID 或本地路径；通过 `BlipProcessor` / `BlipForQuestionAnswering` 加载。 |
| `device`      | `str \| None` | `None`                      | 推理设备；`None` 时自动选择可用的 `"cuda"`，否则使用 `"cpu"`。 |
| `local_only`  | `bool`        | `True`                      | 是否仅从本地加载权重；为 `True` 时会以 `local_files_only=True` 方式加载（无网络环境推荐保持为 `True`）。 |


## `run`函数
```python
def run(
    self,
    storage: DataFlowStorage,
    input_image_key: str = "image_path",
    input_text_key: str = "text",
    output_key: str = "vqa_score"
):
    ...
```
执行算子主逻辑
1. 从 `storage` 读取当前 DataFrame。按行遍历，从每一行中取出：  
   - `input_image_key` 对应的图像路径（例如 `"image_path"`）；  
   - `input_text_key` 对应的文本描述（例如 `"text"`）。  

2. 对每个样本构造英文问句：  
   `question = "Does this image match the description: {text}? Answer yes or no."`  

3. 使用 `BlipProcessor` 将图像和 `question` 打包成模型输入张量，放到指定 `device` 上。  

4. 分别以 `"yes"` 和 `"no"` 作为标签调用 BLIP VQA 模型得到两个损失：  
   - `out_yes = model(**inputs, labels=yes_ids)`  
   - `out_no  = model(**inputs, labels=no_ids)`  

5. 将两者的损失转换为“得分”并归一化为概率：  
   - 先计算 `py = exp(-loss_yes)`，`pn = exp(-loss_no)`；  
   - 再得到 `"yes"` 的归一化概率`p_yes = py / (py + pn + 1e-8)` 
   - 将 `p_yes` 限制在 `[0,1]` 区间作为最终 `vqa_score`。  

6. 若图像无法读取或文本为空，则该样本分数设为 `0.0`。  

7. 将所有样本的 `vqa_score` 写入新列 `output_key`，写回 `storage`，并返回 `[output_key]` 以供后续算子使用。 

参数
| 参数名            | 类型              | 默认值           | 说明 |
| :---------------- | :---------------- | :--------------- | :--- |
| `storage`         | `DataFlowStorage` | 无               | Dataflow 的读写存储对象。 |
| `input_image_key` | `str`             | `"image_path"`   | 输入图片路径列名。 |
| `input_text_key`  | `str`             | `"text"`         | 输入文本描述列名（会被包装成英文问句）。 |
| `output_key`      | `str`             | `"vqa_score"`    | 输出 VQA 评分字段名（范围 `[0,1]`，表示模型认为“图像匹配描述”的概率）。 |

## 🧠 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import ImageVQAScoreEvaluator

# 1) 准备 FileStorage（至少包含 image_path 与 text 两列）
storage = FileStorage(
    first_entry_file_name="./dataflow/example/test_image_eval/test_image_eval.jsonl",
    cache_path="./cache_local",
    file_name_prefix="vqa_eval",
    cache_type="jsonl"
)

# 2) 初始化 VQA 评估算子（可改为本地路径）
evaluator = ImageVQAScoreEvaluator(
    model_name="Salesforce/blip-vqa-base",
    device=None,      # 自动选择 cuda/cpu
    local_only=True   # 仅从本地加载（无网环境建议保持为 True）
)

# 3) 执行评估：将为每行新增 vqa_score ∈ [0,1]
cols = evaluator.run(
    storage=storage.step(),
    input_image_key="image_path",
    input_text_key="text",
    output_key="vqa_score"
)
print(cols)  # ["vqa_score"]
```

### 🧾 默认输出格式（Output Format）
| 字段名                                         | 类型     | 默认值 | 说明 |
| :--------------------------------------------- | :------- | :----- | :--- |
| `image_path`（或 `input_image_key` 指定列）    | `string` | 无     | 输入图片路径。 |
| `text`（或 `input_text_key` 指定列）           | `string` | 无     | 输入文本描述。 |
| `vqa_score`（或 `output_key`）                 | `float`  | 无     | BLIP VQA 计算的“该图像是否匹配该描述”的 Yes 概率，范围 `[0,1]`。 |


示例输入：
```jsonl
{
  "image_path": "1.png",
  "text": "A bride and groom smiling in a car."
}
```

示例输出：
```jsonl
{
  "image_path": "1.png",
  "text": "A bride and groom smiling in a car.",
  "vqa_score": 0.774
}
```