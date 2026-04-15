---
title: GraphRAG Pipeline
createTime: 2026/04/15 18:25:00
permalink: /en/kg_guide/graph_rag_pipeline/
icon: carbon:chart-network
---

# GraphRAG Pipeline

## 1. Overview

The **GraphRAG Pipeline** is designed for question answering over an existing knowledge graph represented as triples. It first extracts query semantics from the input questions, retrieves entity-centered subgraphs, organizes them into prompts, generates answers with an LLM, and then evaluates answer difficulty and plausibility before filtering low-confidence outputs.

This pipeline is suitable for:

- KG question answering over an existing triple set
- Unified GraphRAG inference for a batch of questions
- Adding difficulty tags and plausibility scores to QA outputs
- Fast offline validation of GraphRAG workflows

The main stages are:

1. **Query semantic extraction**: extract entities and relations from questions.
2. **Subgraph retrieval**: retrieve k-hop subgraphs from `triplet`.
3. **Answer generation**: generate answers from subgraph prompts.
4. **Question difficulty evaluation**: assign easy / medium / hard style labels.
5. **Answer plausibility evaluation**: compute answer plausibility scores.
6. **Answer filtering**: remove answers with low plausibility.

---

## 2. Quick Start

### Step 1: Create a new DataFlow workspace

```bash
mkdir run_dataflow_kg
cd run_dataflow_kg
```

### Step 2: Prepare the script

Save the code in the "Pipeline Example" section below as `graph_rag_pipeline.py`.

The script reads the built-in demo file by default:

```python
dataflow/data_for_operator_testing/graphrag.json
```

### Step 3: Configure the API key and model service

```bash
export DF_API_KEY=sk-xxxx
```

If you need to change the model endpoint, model name, cache path, or retrieval hop, you can modify:

```python
llm_serving = APILLMServing_request(
    api_url="https://api.openai.com/v1/chat/completions",
    key_name_of_api_key="DF_API_KEY",
    model_name="gpt-4o-mini",
    max_workers=8,
    temperature=0.0,
)

pipeline = GraphRAGPipeline(
    first_entry_file_name="dataflow/data_for_operator_testing/graphrag.json",
    llm_serving=llm_serving,
    cache_path="./cache_graph_rag",
    hop=1,
    lang="en",
)
```

### Step 4: Run the pipeline

```bash
python graph_rag_pipeline.py
```

After execution, the cache directory will contain query semantics, subgraph prompts, generated answers, difficulty labels, plausibility scores, and filtered answers.

---

## 3. Data Flow and Pipeline Logic

### 1. Input Data

This pipeline requires at least the following fields:

- **question**: a list of questions. In the current implementation, each row should contain a question list rather than a single question.
- **triplet**: a list of KG triples formatted as `"<subj> ... <obj> ... <rel> ..."`.

A sample input record is:

```json
[
  {
    "question": [
      "On which date was Polar Lights released?",
      "Who is Henry trained by?",
      "Which organization that Lucy joins inspires Henry?",
      "Which cities has Maple Leaves performed in?"
    ],
    "triplet": [
      "<subj> Henry <obj> Maria Rodriguez <rel> is_trained_by",
      "<subj> Henry <obj> Maple Leaves <rel> forms",
      "<subj> Lucy <obj> University Toronto <rel> studies_at",
      "<subj> Maple Leaves <obj> Polar Lights <rel> releases",
      "<subj> Polar Lights <obj> August 12 2020 <rel> is_released_on",
      "<subj> Lucy <obj> Clean Earth <rel> joins",
      "<subj> Henry <obj> Lucy <rel> is_inspired_by",
      "<subj> Maple Leaves <obj> Paris <rel> performs_in",
      "<subj> Maple Leaves <obj> Berlin <rel> performs_in",
      "<subj> Maple Leaves <obj> Rome <rel> performs_in"
    ]
  }
]
```

### 2. GraphRAG Pipeline Logic (GraphRAGPipeline)

The pipeline chains 6 operators together following the pattern: semantic extraction -> subgraph retrieval -> answer generation -> quality evaluation.

#### Step 1: Query Semantic Extraction (KGGraphRAGQueryExtraction)

**Functionality:**

- Extract entity clues and relation clues from each question
- Provide entity seeds for later subgraph retrieval

**Input**: `question`  
**Output**: `entities`, `relations`

#### Step 2: Subgraph Retrieval (KGGraphRAGSubgraphRetrieval)

**Functionality:**

- Retrieve k-hop subgraphs from `triplet` using `entities`
- Build `subgraph_prompt` values that can be sent directly to the LLM

**Input**: `question`, `entities`, `triplet`  
**Output**: `subgraph_prompt`

#### Step 3: Answer Generation (KGGraphRAGGetAnswer)

**Functionality:**

- Generate answers using the retrieved subgraph prompts
- Encourage the model to answer only from KG facts

**Input**: `question`, `subgraph_prompt`  
**Output**: `answer`

#### Step 4: Question Difficulty Evaluation (KGRAGQuestionDifficultyEvaluation)

**Input**: `question`  
**Output**: `question_difficulty`

#### Step 5: Answer Plausibility Evaluation (KGRAGQuestionPlausibilityEvaluation)

**Input**: `question`, `answer`  
**Output**: `question_plausibility_score`

#### Step 6: Answer Filtering (KGRAGAnswerPlausibilityFilter)

**Input**: `answer`, `question_plausibility_score`  
**Output**: `filtered_answer`

### 3. Output Data

Typical output fields include:

- **entities**: extracted entities for each question
- **relations**: extracted relation clues for each question
- **subgraph_prompt**: retrieved subgraph prompts
- **answer**: raw generated answers
- **question_difficulty**: difficulty labels
- **question_plausibility_score**: plausibility scores
- **filtered_answer**: filtered answers

An example output is:

```json
{
  "entities": [
    ["Polar Lights"],
    ["Henry"],
    ["Lucy", "Henry"],
    ["Maple Leaves"]
  ],
  "relations": [
    ["release_date"],
    ["trained_by"],
    ["joins", "inspires"],
    ["performed_in"]
  ],
  "answer": [
    "Polar Lights was released on August 12, 2020.",
    "Henry is trained by Maria Rodriguez.",
    "The organization that Lucy joins and which inspires Henry is Clean Earth.",
    "Maple Leaves has performed in Rome, Paris, and Berlin."
  ],
  "question_difficulty": [
    "easy",
    "easy",
    "medium",
    "easy"
  ],
  "question_plausibility_score": [
    1.0,
    1.0,
    0.92,
    1.0
  ],
  "filtered_answer": [
    "Polar Lights was released on August 12, 2020.",
    "Henry is trained by Maria Rodriguez.",
    [],
    "Maple Leaves has performed in Rome, Paris, and Berlin."
  ]
}
```

---

## 4. Pipeline Example

Below is the full implementation of `GraphRAGPipeline`.

```python
import os

from dataflow.core import LLMServingABC
from dataflow.operators.graph_rag import (
    KGGraphRAGGetAnswer,
    KGGraphRAGQueryExtraction,
    KGGraphRAGSubgraphRetrieval,
    KGRAGAnswerPlausibilityFilter,
    KGRAGQuestionDifficultyEvaluation,
    KGRAGQuestionPlausibilityEvaluation,
)
from dataflow.pipeline import PipelineABC
from dataflow.serving import APILLMServing_request
from dataflow.utils.storage import FileStorage


class GraphRAGPipeline(PipelineABC):
    """GraphRAG pipeline: question -> subgraph retrieval -> answer -> answer filtering."""

    def __init__(
        self,
        first_entry_file_name: str,
        llm_serving: LLMServingABC,
        cache_path: str = "./cache_local",
        file_name_prefix: str = "graph_rag_pipeline_step",
        cache_type: str = "json",
        lang: str = "en",
        hop: int = 1,
        plausibility_min_score: float = 0.95,
        plausibility_max_score: float = 1.0,
    ):
        super().__init__()
        if llm_serving is None:
            raise ValueError("llm_serving is required for GraphRAGPipeline")

        self.storage = FileStorage(
            first_entry_file_name=first_entry_file_name,
            cache_path=cache_path,
            file_name_prefix=file_name_prefix,
            cache_type=cache_type,
        )
        self.plausibility_min_score = plausibility_min_score
        self.plausibility_max_score = plausibility_max_score

        self.query_extraction_step1 = KGGraphRAGQueryExtraction(
            llm_serving=llm_serving,
            lang=lang,
        )
        self.subgraph_retrieval_step2 = KGGraphRAGSubgraphRetrieval(hop=hop)
        self.answer_generation_step3 = KGGraphRAGGetAnswer(
            llm_serving=llm_serving,
            lang=lang,
        )
        self.question_difficulty_step4 = KGRAGQuestionDifficultyEvaluation(
            llm_serving=llm_serving,
            lang=lang,
        )
        self.answer_plausibility_step5 = KGRAGQuestionPlausibilityEvaluation(
            llm_serving=llm_serving,
            lang=lang,
        )
        self.answer_filter_step6 = KGRAGAnswerPlausibilityFilter(
            merge_to_input=False
        )

    def forward(self):
        self.query_extraction_step1.run(
            storage=self.storage.step(),
            input_key="question",
            output_keys=["entities", "relations"],
        )
        self.subgraph_retrieval_step2.run(
            storage=self.storage.step(),
            output_key="subgraph_prompt",
        )
        self.answer_generation_step3.run(
            storage=self.storage.step(),
            input_keys=["question", "subgraph_prompt"],
            output_key="answer",
        )
        self.question_difficulty_step4.run(
            storage=self.storage.step(),
            question_key="question",
            output_key="question_difficulty",
        )
        self.answer_plausibility_step5.run(
            storage=self.storage.step(),
            question_key="question",
            answer_key="answer",
            output_key="question_plausibility_score",
        )
        self.answer_filter_step6.run(
            storage=self.storage.step(),
            input_key="answer",
            score_key="question_plausibility_score",
            output_key="filtered_answer",
            min_score=self.plausibility_min_score,
            max_score=self.plausibility_max_score,
        )


if __name__ == "__main__":
    repo_root = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "..")
    )
    input_file = os.path.join(
        repo_root,
        "dataflow",
        "data_for_operator_testing",
        "graphrag.json",
    )

    llm_serving = APILLMServing_request(
        api_url="https://api.openai.com/v1/chat/completions",
        key_name_of_api_key="DF_API_KEY",
        model_name="gpt-4o-mini",
        max_workers=8,
        temperature=0.0,
    )

    pipeline = GraphRAGPipeline(
        first_entry_file_name=input_file,
        llm_serving=llm_serving,
        cache_path="./cache_graph_rag",
        lang="en",
        hop=1,
    )
    pipeline.forward()
```
