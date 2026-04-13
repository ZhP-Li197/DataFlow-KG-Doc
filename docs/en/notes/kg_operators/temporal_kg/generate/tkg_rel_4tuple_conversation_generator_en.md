---
title: TKGRelationTupleDialogueQAGeneration
createTime: 2026/03/18 00:00:00
permalink: /en/kg_operators/temporal_kg/generate/tkg_rel_4tuple_conversation_generator/
---

## 📚 Overview

[TKGRelationTupleDialogueQAGeneration](https://github.com/ZhP-Li197/DataFlow-KG/tree/main/dataflow/operators/temporal_kg/generate/tkg_rel_4tuple_conversation_generator.py) is a temporal KG multi-turn dialogue QA generation operator based on large language models (LLM). It takes multi-hop paths of relation quadruples as input and generates step-wise multi-turn dialogues. Each quadruple corresponds to exactly one turn, and each turn must include temporal information. The generation process has two stages: first construct a valid reasoning path (reordering or swapping head/tail to keep connectivity if needed), then unroll the path into temporal QA turns.

## ✒️ `__init__` Function

```python
def __init__(self, llm_serving: LLMServingABC, lang: str = "en", k: int = 2, min_turns: int = 4):
```

#### Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| **llm_serving** | LLMServingABC | Required | Large language model serving instance. |
| **lang** | str | "en" | Language setting, supports "en" or "zh". |
| **k** | int | 2 | Hop count, used to determine the input column name (`{k}_hop_paths`). |
| **min_turns** | int | 4 | Minimum number of dialogue turns; the actual value is `min(min_turns, k)`. |

#### Prompt Template

The default prompt uses TKGTupleTimePathDialogueQAGenerationPrompt, as shown below:

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
              "⟨quadruple⟩ ...",
              "⟨quadruple⟩ ..."
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

## 💡 `run` Function

`run` reads a DataFrame from `storage`, validates that it contains the input column `{k}_{input_key_meta}` (e.g., `2_hop_paths`) and that the `output_key` column does not yet exist. It then iterates over each row, calls `_generate_dialogue_for_path()` for each path to generate a multi-turn dialogue via the LLM, collects the results as a list of `{"path": ..., "dialogue": ...}` dictionaries, and writes this list into the `output_key` column. If dialogue generation or parsing fails for a path, that path is skipped and not included in the output list for that row. The function returns a list containing the `output_key` string.

```python
def run(self, storage: DataFlowStorage, input_key_meta: str = "hop_paths", output_key: str = "multi_turn_dialogues") -> List[str]:
```

The actual input column name is `{k}_{input_key_meta}` (e.g., `2_hop_paths`).

#### Parameters

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| **storage** | DataFlowStorage | Required | DataFlow storage instance, responsible for reading and writing data. |
| **input_key_meta** | str | "hop_paths" | Input column name meta information; the actual column name is `{k}_{input_key_meta}`. |
| **output_key** | str | "multi_turn_dialogues" | Output column name, corresponding to the generated multi-turn dialogue list. |

## 🤖 Example Usage

```python
from dataflow.operators.temporal_kg.generate import TKGRelationTupleDialogueQAGeneration
from dataflow.utils.storage import FileStorage
from dataflow.utils.llm_serving import APILLMServing_request

storage = FileStorage(first_entry_file_name="tkg_rel_qa.json")

llm_serving = APILLMServing_request(
    api_url="http://<your_llm_api_endpoint>",
    model_name="<your_model_name>",
)

generator = TKGRelationTupleDialogueQAGeneration(
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

#### Default Output Format

| Field | Type | Description |
| --- | --- | --- |
| **2_hop_paths** | str | Input multi-hop path string (preserved). |
| **multi_turn_dialogues** | List[Dict] | Multi-turn dialogue results; each element contains `path` and `dialogue`. |

**Example Input:**

```json
{
  "2_hop_paths": "<subj> Elon Musk <obj> SpaceX <rel> founded <time> 2002 || <subj> SpaceX <obj> ISS <rel> first commercial spacecraft docking with <time> 2012"
}
```

**Example Output:**

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

---

#### Related Links

- Operator implementation: `DataFlow-KG/dataflow/operators/temporal_kg/generate/tkg_rel_4tuple_conversation_generator.py`
- Prompt templates: `DataFlow-KG/dataflow/prompts/diverse_kg/tkg.py`