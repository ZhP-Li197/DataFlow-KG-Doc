---
title: TKGTupleExtraction
createTime: 2026/03/18 00:00:00
permalink: /en/kg_operators/temporal_kg/generate/tkg_4tuple_extractor/
---

## 📚 Overview

[TKGTupleExtraction](https://github.com/ZhP-Li197/DataFlow-KG/tree/main/dataflow/operators/temporal_kg/generate/tkg_4tuple_extractor.py) is a temporal KG quadruple extraction operator based on large language models (LLM). It extracts structured temporal quadruples from raw text, supporting both relation and attribute quadruples via a parameter switch. The operator standardizes time values (dates, months, years, quarters, and time intervals), and fills NA when no explicit time exists. It also performs text quality checks and filters inputs that are too short, too long, or contain excessive special characters.

## ✒️ `__init__` Function

```python
def __init__(self, llm_serving: LLMServingABC, triple_type: str = "attribute", seed: int = 0, lang: str = "en", num_q: int = 5):
```

#### Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| **llm_serving** | LLMServingABC | Required | Large language model serving instance, used for extraction reasoning. |
| **triple_type** | str | "attribute" | Extraction type; `"attribute"` for attribute quadruples, `"relation"` for relation quadruples. |
| **seed** | int | 0 | Random seed. |
| **lang** | str | "en" | Language setting, affects prompt template language; supports "en" or "zh". |
| **num_q** | int | 5 | Reserved parameter for future extension. |

#### Prompt Template

The prompt template is automatically selected based on `triple_type`:

| triple_type | Prompt Class | Primary Use |
| --- | --- | --- |
| relation | TKGRelationQuadrupleExtractorPrompt | Extract entity-relation-entity-time quadruples |
| attribute | TKGAttributeQuadrupleExtractorPrompt | Extract entity-attribute-value-time quadruples |

The default prompt (triple_type="attribute") is as follows:

```python
def build_system_prompt(self):
    return textwrap.dedent("""\
        You are an expert in extracting temporal entity-attribute quadruples from natural language text.

        Each quadruple MUST follow this exact format:
        ⟨entity⟩ Entity ⟨attribute⟩ AttributeName ⟨value⟩ AttributeValue ⟨time⟩ TimeValue

        === TIME STANDARDIZATION ===
        1. Specific date: YYYY-MM-DD, e.g., 2025-03-03
        2. Month: Full month name + year, e.g., March 2025
        3. Year: YYYY, e.g., 2025
        4. Quarter: QX YYYY, e.g., Q1 2025
        5. Time span / interval: start_date|end_date, e.g., 2025-01-01|2025-01-03
        6. If no time is explicitly mentioned in the text, set ⟨time⟩ to 'NA'.

        === CORE RULES ===
        - ENTITY: clear noun/noun phrase, no pronouns
        - ATTRIBUTE: the property of the entity explicitly stated in the text
        - VALUE: the value corresponding to the attribute
        - TIME: optional; fill with standardized value if present, otherwise 'NA'
        - Each quadruple expresses ONE fact
        - Do NOT invent entities, attributes, values, or times beyond the text

        === OUTPUT FORMAT ===
        - JSON object only
        - Key: "tuple"
        - Do NOT add explanations or extra text
    """)

def build_prompt(self, text: str):
    return textwrap.dedent(f"""\
        Extract temporal entity-attribute quadruples from the following text according to the rules above.

        Text:
        {text}

        Output ONLY JSON:
        {{
          "tuple": [
            "⟨entity⟩ Entity ⟨attribute⟩ AttributeName ⟨value⟩ AttributeValue ⟨time⟩ TimeValue"
          ]
        }}
    """)
```

## 💡 `run` Function

`run` reads a DataFrame from `storage`, validates that it contains the column specified by `input_key` and that the column specified by `output_key` does not yet exist. It then iterates over each row, calls `process_batch()` to extract quadruples via the LLM for every input text, and writes the resulting list of quadruples into the `output_key` column. If preprocessing fails or the LLM response cannot be parsed as valid JSON, an empty list is written for that row. The function returns a list containing the `output_key` string.

```python
def run(self, storage: DataFlowStorage = None, input_key: str = "raw_chunk", output_key: str = "tuple"):
```

#### Parameters

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| **storage** | DataFlowStorage | None | DataFlow storage instance, responsible for reading and writing data. |
| **input_key** | str | "raw_chunk" | Input column name, corresponding to the raw text field. |
| **output_key** | str | "tuple" | Output column name, corresponding to the extracted quadruple list field. |

## 🤖 Example Usage

```python
from dataflow.operators.temporal_kg.generate import TKGTupleExtraction
from dataflow.utils.storage import FileStorage
from dataflow.utils.llm_serving import APILLMServing_request

storage = FileStorage(first_entry_file_name="knowledge_extraction.json")

llm_serving = APILLMServing_request(
    api_url="http://<your_llm_api_endpoint>",
    model_name="<your_model_name>",
)

extractor = TKGTupleExtraction(
    llm_serving=llm_serving,
    triple_type="relation",
    lang="en",
)
extractor.run(
    storage.step(),
    input_key="raw_chunk",
    output_key="tuple",
)
```

#### Default Output Format

| Field | Type | Description |
| --- | --- | --- |
| **raw_chunk** | str | Input raw text (preserved). |
| **tuple** | List[str] | Extracted quadruples from the text. |

**Example Input:**

```json
{
  "raw_chunk": "After graduating from Stanford University in 2004, Elon Musk co-founded multiple technology companies..."
}
```

**Example Output (triple_type="relation"):**

```json
{
  "raw_chunk": "After graduating from Stanford University in 2004...",
  "tuple": [
    "<subj> Elon Musk <obj> Stanford University <rel> graduated from <time> 2004",
    "<subj> Elon Musk <obj> multiple technology companies <rel> co-founded <time> NA",
    "<subj> Elon Musk <obj> Tesla Motors <rel> took over as CEO <time> 2008"
  ]
}
```

---

#### Related Links

- Operator implementation: `DataFlow-KG/dataflow/operators/temporal_kg/generate/tkg_4tuple_extractor.py`
- Prompt templates: `DataFlow-KG/dataflow/prompts/diverse_kg/tkg.py`