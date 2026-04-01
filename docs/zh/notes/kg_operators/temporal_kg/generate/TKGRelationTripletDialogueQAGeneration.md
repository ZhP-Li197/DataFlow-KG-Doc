---
title: TKGRelationTripletDialogueQAGeneration
createTime: 2026/03/18 00:00:00
icon: material-symbols-light:bolt
permalink: /zh/api/operators/temporal_kg/generate/tkgrelationtripletdialogueqageneration/
---

## 📚 概述

[TKGRelationTripletDialogueQAGeneration](https://github.com/ZhP-Li197/DataFlow-KG/tree/main/dataflow/operators/temporal_kg/generate/tkg_rel_4tuple_conversation_generator.py) 是一个基于大语言模型（LLM）从时序知识图谱多跳路径生成多轮对话式问答的算子。它接收由关系四元组组成的多跳路径数据，通过 LLM 生成逐跳展开的多轮对话。每条四元组严格对应一轮问答，且每轮问答必须涉及时间信息。该算子的生成过程分为两个阶段：首先构造有效的推理路径（必要时交换头尾或重排序以保证连通），然后沿路径逐跳生成带时间信息的问答对。

## ✒️ `__init__` 函数

```python
def __init__(self, llm_serving: LLMServingABC, lang: str = "en", k: int = 2, min_turns: int = 4):
```

### 参数

| 参数名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| **llm_serving** | LLMServingABC | 必需 | 大语言模型服务实例。 |
| **lang** | str | "en" | 语言设置，支持 "en" 或 "zh"。 |
| **k** | int | 2 | 跳数，用于确定输入列名（`{k}_hop_paths`）。 |
| **min_turns** | int | 4 | 最小对话轮数，实际取 `min(min_turns, k)`。 |

### Prompt 模板说明

默认使用 TKGTupleTimePathDialogueQAGenerationPrompt，prompt 如下：

```python
def build_system_prompt(self):
    return textwrap.dedent(f"""\
        You are an expert in Knowledge Graph reasoning
        and multi-turn question–answer generation based on temporal quadruples.

        === TASK OVERVIEW ===
        You are given a set of ENTITY–RELATION–ENTITY–TIME quadruples
        that may NOT be strictly ordered or perfectly chained.
        However, these quadruples are fully connectable into a path.

        Your task consists of TWO STEPS:

        STEP 1: Path Construction
        - Reorder quadruples or swap subject/object if necessary
          to construct a valid connected reasoning path.
        - Do NOT discard any quadruple.
        - Constructed path must include ALL quadruples from input.

        STEP 2: Dialogue Unrolling
        - Each quadruple in the constructed path corresponds to EXACTLY ONE turn.
        - Turns MUST follow the order of the constructed path.
        - Each turn consists of ONE question and ONE answer:
          * Question: asks about the temporal aspect of the subject-object relation
          * Answer: provides the object and the associated time

        === CORE RULES ===
        1. Dialogue must have exactly N turns if there are N quadruples.
        2. Each turn must advance reasoning along the path.
        3. Each question and answer must explicitly mention time.
        4. The FINAL turn must require reasoning over the ENTIRE path.

        === STRICT PROHIBITIONS ===
        - Do NOT introduce external knowledge.
        - Do NOT invent or modify entities, relations, or times.
        - Do NOT merge multiple quadruples into a single turn.
        - Do NOT skip reasoning steps.
    """)

def build_prompt(self, paths: str):
    return textwrap.dedent(f"""\
        Given the following connected ENTITY–RELATION–ENTITY–TIME quadruples,
        construct a valid reasoning path by reordering or swapping head/tail if necessary,
        then generate a multi-turn dialogue where each turn explicitly involves time.

        ENTITY–RELATION–ENTITY–TIME quadruples:
        {paths}

        === OUTPUT FORMAT (STRICT JSON) ===
        {{
          "dialogue": {{
            "constructed_path": [
              "&lt;quadruple&gt; ...",
              "&lt;quadruple&gt; ..."
            ],
            "turns": [
              {{
                "turn_id": 1,
                "question": "...",
                "answer": "..."
              }}
            ]
          }}
        }}

        Each quadruple corresponds to exactly one turn.
        Each question and answer must mention time explicitly.
        Output JSON only.
    """)
```

## 💡 `run` 函数

```python
def run(self, storage: DataFlowStorage, input_key_meta: str = "hop_paths", output_key: str = "multi_turn_dialogues") -> List[str]:
```

实际读取的输入列名为 `{k}_{input_key_meta}`（如 `2_hop_paths`）。

#### 参数

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| **storage** | DataFlowStorage | 必需 | 数据流存储实例，负责读取与写入数据。 |
| **input_key_meta** | str | "hop_paths" | 输入列名元信息，实际列名为 `{k}_{input_key_meta}`。 |
| **output_key** | str | "multi_turn_dialogues" | 输出列名，对应生成的多轮对话列表。 |

## 🤖 示例用法

```python
from dataflow.operators.temporal_kg.generate import TKGRelationTripletDialogueQAGeneration
from dataflow.utils.storage import FileStorage
from dataflow.utils.llm_serving import APILLMServing_request

storage = FileStorage(first_entry_file_name="tkg_rel_qa.json")

llm_serving = APILLMServing_request(
    api_url="http://<your_llm_api_endpoint>",
    model_name="<your_model_name>",
)

generator = TKGRelationTripletDialogueQAGeneration(
    llm_serving=llm_serving,
    lang="en",
    k=2,
    min_turns=2,
)
generator.run(
    storage.step(),
    input_key_meta="hop_paths",
    output_key="multi_turn_dialogues",
)
```

#### 默认输出格式

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| **2_hop_paths** | str | 输入的多跳路径字符串（保留）。 |
| **multi_turn_dialogues** | List[Dict] | 多轮对话结果，每个元素包含 `path` 和 `dialogue`。 |

**示例输入：**

```json
{
  "2_hop_paths": "<subj> Elon Musk <obj> SpaceX <rel> founded &lt;time&gt; 2002 || <subj> SpaceX <obj> ISS <rel> first commercial spacecraft docking with &lt;time&gt; 2012"
}
```

**示例输出：**

```json
{
  "2_hop_paths": "...",
  "multi_turn_dialogues": [
    {
      "path": "...",
      "dialogue": [
        {
          "turn_id": 1,
          "question": "When did Elon Musk found SpaceX?",
          "answer": "Elon Musk founded SpaceX in 2002."
        },
        {
          "turn_id": 2,
          "question": "After founding SpaceX in 2002, when did SpaceX first dock a commercial spacecraft with the ISS?",
          "answer": "SpaceX achieved the first commercial spacecraft docking with the ISS in 2012."
        }
      ]
    }
  ]
}
```