---
title: WikiQARefiner
createTime: 2025/10/15 19:00:00
# icon: material-symbols-light:article
permalink: /zh/mm_operators/refine/wikiqa/
--------------------------------------------
## 📘 概述

`WikiQARefiner` 是一个 **纯文本处理算子**，不依赖任何模型或 GPU 资源。它主要用于清洗和规范化包含 **Wikipedia Article** 与 **Question Answer Pairs** 的原始文本。

该算子通过鲁棒的规则解析逻辑，去除 Markdown 富文本噪声（如加粗、斜体等），识别并分离正文与问答对，最终将非结构化文本转换为标准的 `{context, qas}` JSON 结构，适用于 RAG 或阅读理解数据的预处理流水线。

## `__init__`函数

```python
def __init__(self):

```

该算子无需初始化参数。启动时仅创建日志实例，无模型加载开销。

## `run`函数

```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "text",
    output_key: str = "parsed",
):
    ...

```

执行算子主逻辑：

1. **读取数据**
从 `storage` 中读取 DataFrame，根据 `input_key` 获取原始文本列。
2. **正文解析（Context Parsing）**
* 自动扫描文本，识别并分离 Article 正文区域。
* 支持多种标题变体识别（如 `### QA`, `### Q&A`, `### Question Answer Pairs` 等，大小写不敏感）。
* **清洗噪声**：移除 Markdown 标记（如 `**bold**`, `*italic*`）及多余的空白字符，保留纯净文本作为 `context`。


3. **问答对解析（QA Parsing）**
* 基于**行结构**而非严格的 Markdown 语法进行解析，具有极高的鲁棒性。
* **问题识别**：以数字加点（如 `1.`, `2.`）作为起始标记。
* **答案识别**：以连字符（`-`, `–`, `—`）引导的行作为答案。
* 即使面对嵌套加粗（`**Q**`）、不规范换行或 Markdown 语法错误，也能正确提取 `question` 和 `answer`。


4. **结果构造与输出**
* 将解析得到的 `context` 字符串与 `qas` 列表组合为字典。
* 将结果写入 `output_key` 指定的新列，并更新 `storage`。



### 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `storage` | `DataFlowStorage` | 无 | Dataflow 的读写存储对象。 |
| `input_key` | `str` | `"text"` | 输入原始文本所在的列名。 |
| `output_key` | `str` | `"parsed"` | 解析后的结构化数据输出列名。 |

## 🧠 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.text import WikiQARefiner

# 1) 准备 FileStorage
storage = FileStorage(
    first_entry_file_name="data/wiki_raw.jsonl",
    cache_path="./cache_local",
    file_name_prefix="wikiqa_refined",
    cache_type="jsonl",
)

# 2) 初始化 Refiner 算子
op = WikiQARefiner()

# 3) 执行解析
op.run(
    storage=storage.step(),
    input_key="text",
    output_key="parsed",
)

```

### 🧾 默认输出格式（Output Format）

`output_key` 列中的数据结构如下：

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `context` | `string` | 清洗后的 Wikipedia 正文内容。 |
| `qas` | `List[Dict]` | 问答对列表，每项包含 `question` 和 `answer` 字段。 |

示例输入：

```jsonl
{
  "id": 1,
  "text": "### Wikipedia Article\nArtificial **intelligence** (AI) is...\n\n### Question Answer Pairs\n1. What does AI stand for?\n- Artificial Intelligence."
}

```

示例输出：

```jsonl
{
  "id": 1,
  "text": "...",
  "parsed": {
    "context": "Artificial intelligence (AI) is...",
    "qas": [
      {
        "question": "What does AI stand for?",
        "answer": "Artificial Intelligence."
      }
    ]
  }
}

```