---
title: TKGTupleDisambiguation
createTime: 2026/03/18 00:00:00
icon: material-symbols-light:tune
permalink: /zh/kg_operators/temporal_kg/refine/tkgtupledisambiguation/
---

## 📚 概述

[TKGTupleDisambiguation](https://github.com/ZhP-Li197/DataFlow-KG/tree/main/dataflow/operators/temporal_kg/refinement/tkg_4tuple_disambiguation.py) 是一个基于大语言模型（LLM）的时序知识图谱四元组消歧算子。它用于对知识图谱合并过程中产生的歧义四元组进行自动消歧处理。该算子能够自动检测四元组的类型（属性四元组或关系四元组），并调用对应的 Prompt 模板请求 LLM 进行推理，从多个冲突候选中选出最合理的一条四元组作为消歧结果。

## ✒️ `__init__`函数

```python
def __init__(self, llm_serving: LLMServingABC, seed: int = 0, lang: str = "en", attribute_prompt: Union[KGAttributeTripleDisambiguationPrompt, DIYPromptABC] = None, relation_prompt: Union[TKGRelationDisambiguationPrompt, DIYPromptABC] = None):
```

### `init`参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| **llm_serving** | LLMServingABC | 必需 | 大语言模型服务实例，用于执行消歧推理。 |
| **seed** | int | 0 | 随机种子，用于可复现性。 |
| **lang** | str | "en" | 语言设置，支持 "en" 或 "zh"，影响 prompt 模板语言。 |
| **attribute_prompt** | Union[KGAttributeTripleDisambiguationPrompt, DIYPromptABC] | None | 属性四元组消歧的 prompt 模板。为 None 时自动使用默认模板。 |
| **relation_prompt** | Union[TKGRelationDisambiguationPrompt, DIYPromptABC] | None | 关系四元组消歧的 prompt 模板。为 None 时自动使用默认模板。 |

### Prompt模板说明

该算子使用两个 prompt 模板，根据四元组类型自动选择：

| 四元组类型 | Prompt 类 | 主要用途 |
| --- | --- | --- |
| relation | TKGRelationDisambiguationPrompt | 关系四元组消歧 |
| attribute | KGAttributeTripleDisambiguationPrompt | 属性四元组消歧 |

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
        "⟨subj⟩ E2 ⟨obj⟩ E3 ⟨rel⟩ relC ⟨time⟩ 2026-03-02 ｜ 2026-03-05"

        Output:
        {
          "resolved_quadruple": [
            "⟨subj⟩ E2 ⟨obj⟩ E3 ⟨rel⟩ relC ⟨time⟩ 2026-03-05"
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

## 💡 `run`函数

```python
def run(self, storage: DataFlowStorage = None, input_key: str = "merged_tuples", input_key_meta: str = "ambiguous", output_key: str = "resolved"):
```

#### `参数`

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| **storage** | DataFlowStorage | None | 数据流存储实例，负责读取与写入数据。 |
| **input_key** | str | "merged_tuples" | 输入列名，对应合并后的四元组字典字段。 |
| **input_key_meta** | str | "ambiguous" | 从 input_key 字典中读取的子键名，对应待消歧的四元组列表。 |
| **output_key** | str | "resolved" | 输出列名，对应消歧后的四元组列表。 |

## 🤖 示例用法

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

#### 🧾 默认输出格式（Output Format）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| merged_tuples | Dict | 输入的合并四元组字典（保留原始字段）。 |
| resolved | List[str] | 消歧后的四元组列表，每条为从歧义候选中选出的唯一结果。 |

**示例输入：**

```json
{
  "merged_tuples": {
    "unambiguous": [
      "⟨subj⟩ SpaceX ⟨obj⟩ ISS ⟨rel⟩ first commercial spacecraft docking with ⟨time⟩ 2012",
      "⟨subj⟩ Elon Musk ⟨obj⟩ Neuralink ⟨rel⟩ founded ⟨time⟩ 2016"
    ],
    "ambiguous": [
      "⟨subj⟩ Elon Musk ⟨obj⟩ SpaceX ⟨rel⟩ established ⟨time⟩ 2002 ｜ ⟨subj⟩ Elon Musk ⟨obj⟩ SpaceX ⟨rel⟩ founded ⟨time⟩ 2002",
      "⟨subj⟩ Elon Musk ⟨obj⟩ Tesla Motors ⟨rel⟩ took over as CEO ⟨time⟩ 2006 ｜ ⟨subj⟩ Elon Musk ⟨obj⟩ Tesla Motors ⟨rel⟩ took over as CEO ⟨time⟩ 2008"
    ]
  }
}
```

**示例输出：**

```json
{
  "merged_tuples": {"...（同上）"},
  "resolved": [
    "⟨subj⟩ Elon Musk ⟨obj⟩ SpaceX ⟨rel⟩ founded ⟨time⟩ 2002",
    "⟨subj⟩ Elon Musk ⟨obj⟩ Tesla Motors ⟨rel⟩ took over as CEO ⟨time⟩ 2008"
  ]
}
```