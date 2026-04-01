---

title: WikiQARefiner
createTime: 2025/10/15 19:00:00
# icon: material-symbols-light:article
permalink: /en/mm_operators/refine/wikiqa/
--------------------------------------------
## 📘 Overview

`WikiQARefiner` is a **pure text-processing operator** designed to normalize raw text containing *Wikipedia Article + Question Answer Pairs*. It parses unstructured text into structured JSON data without relying on any models or GPUs.

This operator focuses on cleaning Markdown/rich-text noise (e.g., `**bold**`, `*italic*`) and robustly parsing common WikiQA text structures to separate the article content from QA pairs, making it ideal for RAG or reading comprehension data pipelines.

## `__init__` Function

```python
def __init__(self):

```

This operator requires no initialization parameters. It incurs minimal startup overhead as it does not load any models.

## `run` Function

```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "text",
    output_key: str = "parsed",
):
    ...

```

Executes the main operator logic:

1. **Read Data**
Reads the DataFrame from `storage` and iterates through rows to process the raw text column specified by `input_key`.
2. **Context Parsing**
* Automatically scans the text to identify and separate the Article body.
* Supports various header variants (e.g., `### QA`, `### Q&A`, `### Question Answer Pairs`, case-insensitive).
* **Noise Cleaning**: Removes Markdown markers (like `**bold**`, `*italic*`) and normalizes excess whitespace to produce a clean `context` string.


3. **QA Parsing**
* Uses a **line-structure based strategy** rather than strict Markdown parsing for higher robustness.
* **Question Detection**: Identifies lines starting with a number followed by a dot (e.g., `1.`, `2.`).
* **Answer Detection**: Identifies lines introduced by hyphens or dashes (`-`, `–`, `—`).
* Correctly extracts `question` and `answer` even in cases with nested emphasis (e.g., `**Q**`), irregular spacing, or broken Markdown syntax.


4. **Result Construction**
* Combines the parsed `context` string and `qas` list into a dictionary.
* Writes the result into the new column specified by `output_key` and updates `storage`.



### Parameters

| Parameter Name | Type | Default | Description |
| --- | --- | --- | --- |
| `storage` | `DataFlowStorage` | N/A | The DataFlow storage object for reading/writing. |
| `input_key` | `str` | `"text"` | The column name containing the raw WikiQA text. |
| `output_key` | `str` | `"parsed"` | The output column name for the parsed structured data. |

## 🧠 Example Usage

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.text import WikiQARefiner

# 1) Prepare FileStorage
storage = FileStorage(
    first_entry_file_name="data/wiki_raw.jsonl",
    cache_path="./cache_local",
    file_name_prefix="wikiqa_refined",
    cache_type="jsonl",
)

# 2) Initialize the Refiner operator
op = WikiQARefiner()

# 3) Execute parsing
op.run(
    storage=storage.step(),
    input_key="text",
    output_key="parsed",
)

```

### 🧾 Output Format

The data structure in the `output_key` column is as follows:

| Field Name | Type | Description |
| --- | --- | --- |
| `context` | `string` | The normalized Wikipedia article text. |
| `qas` | `List[Dict]` | A list of QA pairs, where each item contains `question` and `answer`. |

Example Input:

```jsonl
{
  "id": 1,
  "text": "### Wikipedia Article\nArtificial **intelligence** (AI) is...\n\n### Question Answer Pairs\n1. What does AI stand for?\n- Artificial Intelligence."
}

```

Example Output:

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