---
title: TKGTupleDisambiguation
createTime: 2026/03/18 00:00:00
permalink: /en/kg_operators/temporal_kg/refine/tkg_4tuple_disambiguation_en/
---

## 📚 Overview

[TKGTupleDisambiguation](https://github.com/ZhP-Li197/DataFlow-KG/tree/main/dataflow/operators/temporal_kg/refinement/tkg_4tuple_disambiguation.py) is a temporal KG quadruple disambiguation operator based on large language models (LLM). It is used to resolve ambiguous quadruples produced during knowledge graph merging. The operator detects whether a quadruple is relation-based or attribute-based, and calls the corresponding prompt template to select the most reasonable candidate from multiple conflict options.

## ✒️ `__init__` Function

```python
def __init__(self, llm_serving: LLMServingABC, seed: int = 0, lang: str = "en", attribute_prompt: Union[KGAttributeTripleDisambiguationPrompt, DIYPromptABC] = None, relation_prompt: Union[TKGRelationDisambiguationPrompt, DIYPromptABC] = None):
```

#### Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| **llm_serving** | LLMServingABC | Required | Large language model serving instance, used for disambiguation reasoning. |
| **seed** | int | 0 | Random seed, for reproducibility. |
| **lang** | str | "en" | Language setting, supports "en" or "zh"; affects prompt template language. |
| **attribute_prompt** | Union[KGAttributeTripleDisambiguationPrompt, DIYPromptABC] | None | Prompt template for attribute quadruple disambiguation. If None, the default template is used automatically. |
| **relation_prompt** | Union[TKGRelationDisambiguationPrompt, DIYPromptABC] | None | Prompt template for relation quadruple disambiguation. If None, the default template is used automatically. |

#### Prompt Template

This operator uses two prompt templates, automatically selected based on the quadruple type:

| Quadruple Type | Prompt Class | Primary Use |
| --- | --- | --- |
| relation | TKGRelationDisambiguationPrompt | Relation quadruple disambiguation |
| attribute | KGAttributeTripleDisambiguationPrompt | Attribute quadruple disambiguation |

#### `TKGRelationDisambiguationPrompt`

```python
def build_system_prompt(self):
    return textwrap.dedent("""\
        You are an expert in knowledge graph quadruple disambiguation.

        Task:
        - Input quadruples may contain ambiguity in relation, tail entity,
          attribute value, or time, represented by multiple candidates
          separated by "｜" (pipe).
        - Select the single most correct quadruple for each ambiguous input.
        - Keep the quadruple structure unchanged.

        Rules:
        1. Each ambiguous input produces exactly one resolved quadruple.
        2. Do NOT modify head entity or attribute names.
        3. Do NOT add explanations, comments, or extra quadruples.
        4. Output must be valid JSON.

        Example:
        Input:
        "<subj> E2 <obj> E3 <rel> relC <time> 2026-03-02 ｜ 2026-03-05"

        Output:
        {
          "resolved_quadruple": [
            "<subj> E2 <obj> E3 <rel> relC <time> 2026-03-05"
          ]
        }
    """)

def build_prompt(self, ambiguous_quadruple: str):
    return textwrap.dedent(f"""\
        Disambiguate the following knowledge graph quadruple.
        Select the single most correct candidate when multiple options
        are provided (separated by "｜").

        Ambiguous Quadruple:
        {ambiguous_quadruple}

        Return ONLY a JSON object with key "resolved_quadruple"
        and value as a list containing the resolved quadruple.
    """)
```

#### `KGAttributeTripleDisambiguationPrompt`

```python
def build_system_prompt(self):
    return textwrap.dedent("""\
        You are an expert in knowledge graph attribute triple disambiguation.

        Task:
        - Input attribute triples may contain multiple candidate values separated by "|" (pipe).
        - Select the most correct, standardized, or widely accepted value.
        - Only disambiguate values; do NOT modify entity names, attribute names, or structure.

        Output rules:
        1. Keep triple structure unchanged.
        2. Only choose a single value for each ambiguous attribute.
        3. Do NOT add extra explanation or commentary.
    """)
```

## 💡 `run` Function

`run` reads a DataFrame from `storage`, validates that it contains the column specified by `input_key` and that the column specified by `output_key` does not yet exist. For each row, it extracts the list from `input_key_dict[input_key_meta]` (e.g., the `ambiguous` list inside `merged_tuples`), iterates over each ambiguous quadruple, automatically detects whether it is a relation or attribute type, calls the corresponding LLM prompt for disambiguation, and collects the resolved results. If a row has no ambiguous candidates or parsing fails, the original input is kept or an empty list is returned. The resolved list is written into the `output_key` column. The function returns a list containing the `output_key` string.

```python
def run(self, storage: DataFlowStorage = None, input_key: str = "merged_tuples", input_key_meta: str = "ambiguous", output_key: str = "resolved"):
```

#### Parameters

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| **storage** | DataFlowStorage | None | DataFlow storage instance, responsible for reading and writing data. |
| **input_key** | str | "merged_tuples" | Input column name, corresponding to the merged quadruple dictionary field. |
| **input_key_meta** | str | "ambiguous" | Sub-key name read from the input_key dictionary, corresponding to the list of quadruples to be disambiguated. |
| **output_key** | str | "resolved" | Output column name, corresponding to the disambiguated quadruple list. |

## 🤖 Example Usage

```python
from dataflow.operators.temporal_kg.refinement import TKGTupleDisambiguation
from dataflow.utils.storage import FileStorage
from dataflow.core import LLMServingABC

storage = FileStorage(first_entry_file_name="tkg_merge.json")

from dataflow.utils.llm_serving import APILLMServing_request
llm_serving = APILLMServing_request(
    api_url="http://<your_llm_api_endpoint>",
    model_name="<your_model_name>",
)

operator = TKGTupleDisambiguation(
    llm_serving=llm_serving,
    seed=0,
    lang="en",
)
operator.run(
    storage.step(),
    input_key="merged_tuples",
    input_key_meta="ambiguous",
    output_key="resolved",
)
```

#### Default Output Format

| Field | Type | Description |
| --- | --- | --- |
| merged_tuples | Dict | Input merged quadruple dictionary (original field preserved). |
| resolved | List[str] | Disambiguated quadruple list; each entry is the unique result selected from the ambiguous candidates. |

**Example Input:**

```json
{
  "merged_tuples": {
    "unambiguous": [
      "<subj> SpaceX <obj> ISS <rel> first commercial spacecraft docking with <time> 2012",
      "<subj> Elon Musk <obj> Neuralink <rel> founded <time> 2016"
    ],
    "ambiguous": [
      "<subj> Elon Musk <obj> SpaceX <rel> established <time> 2002 ｜ <subj> Elon Musk <obj> SpaceX <rel> founded <time> 2002",
      "<subj> Elon Musk <obj> Tesla Motors <rel> took over as CEO <time> 2006 ｜ <subj> Elon Musk <obj> Tesla Motors <rel> took over as CEO <time> 2008"
    ]
  }
}
```

**Example Output:**

```json
{
  "merged_tuples": {"..."},
  "resolved": [
    "<subj> Elon Musk <obj> SpaceX <rel> founded <time> 2002",
    "<subj> Elon Musk <obj> Tesla Motors <rel> took over as CEO <time> 2008"
  ]
}
```

---

#### Related Links

- Operator implementation: `DataFlow-KG/dataflow/operators/temporal_kg/refinement/tkg_4tuple_disambiguation.py`
- Prompt templates: `DataFlow-KG/dataflow/prompts/diverse_kg/tkg.py`, `DataFlow-KG/dataflow/prompts/core_kg/rel_triple_refinement.py`, `DataFlow-KG/dataflow/prompts/core_kg/attri_triple.py`
- Upstream operator: `DataFlow-KG/dataflow/operators/temporal_kg/generate/tkg_4tuple_merge.py`
