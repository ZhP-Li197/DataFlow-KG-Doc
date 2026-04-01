---
title: ImageCatFilter
createTime: 2025/10/15 15:00:00
# icon: material-symbols-light:image
permalink: /zh/mm_operators/filter/image_cat_filter/
---
## 📘 概述
`ImageCatFilter` 基于 **Caption-as-Teacher** 思想，结合 **BART-large-MNLI 自然语言推理模型** 与可选的 **Tesseract OCR**，  
对图文样本进行「语义复杂度 + 动作性 + OCR 抄写」三重过滤，仅保留语义信息更丰富、真正描述图像内容的 caption。

## ```__init__```函数
```python
def __init__(
    self,
    model_name: str = "facebook/bart-large-mnli",
    complexity_thresh: float = 0.4,
    min_caps: int = 2,
    action_thresh: float = 0.4,
    ocr_overlap_threshold: float = 0.2,
    ocr_nli_thresh: float = 0.6,
    device: str | None = None,
):
```

## `init`参数说明
| 参数名                 | 类型              | 默认值                          | 说明 |
| :--------------------- | :---------------- | :------------------------------ | :--- |
| `model_name`           | `str`             | `"facebook/bart-large-mnli"`    | 用于 NLI 判断的预训练模型名称或本地路径；通过 `AutoTokenizer` 与 `AutoModelForSequenceClassification` 加载。 |
| `complexity_thresh`    | `float`           | `0.4`                           | caption 对各类「能力假设句」的 **蕴含概率阈值**；高于该值视为该能力被 caption 覆盖，用于衡量语义复杂度。 |
| `min_caps`             | `int`             | `2`                             | 至少需要被支持的能力假设条数；即 caption 至少要蕴含多少种能力（动作、交互、场景细节等）才算“复杂度达标”。 |
| `action_thresh`        | `float`           | `0.4`                           | caption 对 `ACTION_HYPOTHESIS`（描述场景中正在发生的动作）的蕴含概率阈值；低于该值认为动作性不足而被过滤。 |
| `ocr_overlap_threshold`| `float`           | `0.2`                           | OCR 文本与 caption tokens 的 Jaccard 重叠度阈值；仅当重叠度高于该值时才进一步用 NLI 判断是否为 OCR 抄写。 |
| `ocr_nli_thresh`       | `float`           | `0.6`                           | caption 对 `OCR_ONLY_HYPOTHESIS`（主要抄写图像文字）的蕴含概率阈值；重叠度高且该概率超过此阈值时，判定为 OCR 抄写并过滤。 |
| `device`               | `str \| None`     | `None`   


## `run`函数
```python
def run(
    self,
    storage: DataFlowStorage,
    input_image_key: str = "image",
    input_caption_key: str = "caption",
):
    ...
```
执行算子主逻辑：
1. **读取数据**  
   从 `storage` 中读取当前 DataFrame，并按行遍历，每一行视为一个图文样本：  
   - `input_image_key` 列给出图像路径（默认 `"image"`）；  
   - `input_caption_key` 列给出英文 caption（默认 `"caption"`）。

2. **复杂度检测（Complexity check）**  
   - 对当前 caption，依次与 `CAPS_HYPOTHESES` 中的每条「能力假设句」组成 NLI 前提-假设对：  
     `premise = caption`，`hypothesis = 某条能力句`。  
   - 用 `BART-large-mnli` 计算每条假设的 **entailment 概率** `p_entail`；  
   - 当 `p_entail >= complexity_thresh` 时，认为该能力被 caption 覆盖，并计入能力计数；  
   - 最终能力计数 `cap_num >= min_caps` 时，认为 caption 具有足够的语义复杂度，否则该样本被过滤。

3. **动作性检测（Action check）**  
   - 使用单一假设 `ACTION_HYPOTHESIS`：  
     > "The caption clearly describes an action happening in the scene."  
   - 计算 caption 对该假设的 entailment 概率 `p_action`；  
   - 当 `p_action < action_thresh` 时，认为 caption 并未清晰描述动作，样本被过滤。

4. **OCR 抄写检测（OCR-only check，可选）**  
   - 若本机未安装 Tesseract 或初始化时检测失败，则 **跳过** 本步骤，默认通过 OCR 检查；  
   - 否则：  
     1. 使用 `pytesseract.image_to_string` 对图像做 OCR，得到 `ocr_text`；  
     2. 对 `ocr_text` 与 `caption` 分别提取英文 token 集合 `ocr_tokens` 与 `cap_tokens`；  
     3. 计算 Jaccard 重叠度：  
        \[
        J = \frac{|ocr\_tokens \cap cap\_tokens|}{|ocr\_tokens \cup cap\_tokens|}
        \]  
     4. 若 `J < ocr_overlap_threshold`，认为 caption 不主要抄写文字，通过 OCR 检查；  
     5. 若 `J >= ocr_overlap_threshold`，进一步构造 `OCR_ONLY_HYPOTHESIS`：  
        > "The caption mainly transcribes the visible text in the image instead of describing the visual scene."  
        并计算其 entailment 概率 `p_ocr_only`：  
        - 若 `p_ocr_only >= ocr_nli_thresh`，则认为 caption 主要是 OCR 抄写，样本被过滤；  
        - 否则仍视为通过 OCR 检查。

5. **综合判定**  
   对每一行样本，只有当 **复杂度检测通过 + 动作检测通过 + OCR 检测通过** 三者同时满足时，  
   才将该行标记为保留；否则标记为过滤。


参数
| 参数名            | 类型              | 默认值         | 说明 |
| :---------------- | :---------------- | :------------- | :--- |
| `storage`         | `DataFlowStorage` | 无             | Dataflow 的读写存储对象。 |
| `input_image_key` | `str`             | `"image"`      | 图像路径所在列名。 |
| `input_caption_key` | `str`           | `"caption"`    | 英文图像描述所在列名。 |




## 🧠 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import ImageCatFilter

# 1) 准备 FileStorage（至少包含 image 与 caption 两列）
storage = FileStorage(
    first_entry_file_name="./dataflow/example/test_image_filter/test_image_filter.jsonl",
    cache_path="./cache_local",
    file_name_prefix="cat_filter",
    cache_type="jsonl"
)

# 2) 初始化 Cat 过滤算子（可调节复杂度阈值与 OCR 相关超参）
cat_filter = ImageCatFilter(
    model_name="facebook/bart-large-mnli",
    complexity_thresh=0.4,
    min_caps=2,
    action_thresh=0.4,
    ocr_overlap_threshold=0.2,
    ocr_nli_thresh=0.6,
    device=None  # 自动选择 cuda/cpu
)

# 3) 执行过滤：仅保留语义复杂、具有动作且非纯 OCR 抄写的样本
cols = cat_filter.run(
    storage=storage.step(),
    input_image_key="image",
    input_caption_key="caption",
)
print(cols)  # ["image", "caption"]
```

### 🧾 默认输出格式（Output Format）
| 字段名                                          | 类型     | 默认值 | 说明 |
| :---------------------------------------------- | :------- | :----- | :--- |
| `image`（或 `input_image_key` 指定列）          | `string` | 无     | 输入图像路径。 |
| `caption`（或 `input_caption_key` 指定列）      | `string` | 无     | 输入英文图像描述。 |


示例输入：
```jsonl
{
  "image_path": "1.png",
  "caption": "A bride smiles while the groom points ahead inside a car, their hands resting together on the seat."
}
{
  "image_path": "2.jpg",
  "caption": "SALE SALE SALE 50% OFF"
}
```

示例输出：
```jsonl
{
  "image_path": "1.png",
  "caption": "A bride smiles while the groom points ahead inside a car, their hands resting together on the seat."
}
```