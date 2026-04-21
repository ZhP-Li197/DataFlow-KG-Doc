---
title: Knowledge Graph QA Generation Pipeline
createTime: 2026/04/21 17:05:00
permalink: /en/kg_guide/kg_qa_pipeline/
icon: solar:document-text-outline
---

# Knowledge Graph QA Generation Pipeline

## 1. Overview

The **Knowledge Graph QA Generation Pipeline ** targets end-to-end scenarios where the system starts from plain natural language text, automatically builds a knowledge graph, and then generates and evaluates high-quality question-answer pairs. Starting from unstructured text, it performs entity recognition, relation triple extraction, graph construction and denoising, followed by subgraph sampling and density-based filtering to retain high-quality knowledge subgraphs. Finally, it generates QA pairs from those subgraphs and evaluates their naturalness.

This pipeline is suitable for the following tasks:

- End-to-end construction from unstructured text to a structured knowledge graph
- Building KG-based QA datasets
- Extracting connected subgraphs with specific hop counts, such as 2-hop subgraphs
- Automatically filtering low-quality or sparse graphs to better control QA quality and reduce hallucinations from large language models

The main stages of the pipeline include:

1. **Entity Extraction**: Extract key entities from text.
2. **Triple Extraction and Deduplication**: Extract relation triples from text and entities, then clean duplicated results.
3. **Subgraph Sampling**: Sample multi-hop subgraphs around entities.
4. **Subgraph Scale Evaluation and Filtering**: Compute the number of nodes, number of edges, and density for each subgraph, then filter them by density range.
5. **Subgraph QA Generation**: Generate QA pairs of a specified type and quantity based on filtered high-quality subgraphs.
6. **QA Naturalness Evaluation**: Evaluate the naturalness and language quality of the generated QA pairs.

---

## 2. Quick Start

### Step 1: Create a new DataFlow working directory

```bash
mkdir run_dataflow_kg
cd run_dataflow_kg
```

### Step 2: Initialize the pipeline code and default data

```bash
dfkg init
```

After initialization, the following files will be generated:

- Pipeline script: `api_pipelines/kg_qa_pipeline.py`
- Default data: `example/kg_qa_pipeline_input.json`

### Step 3: Configure the API key

This pipeline uses `gpt-4o` by default. You need to configure your OpenAI API key. The exact environment variable name depends on the underlying implementation of `APILLMServing_request`, and it is commonly `DF_API_KEY` or a similar setting:

```bash
export DF_API_KEY=sk-xxxx
```

### Step 4: Run the pipeline

```bash
python api_pipelines/kg_qa_pipeline.py
```

---

## 3. Data Flow and Pipeline Logic

### 3.1 Input Data

At minimum, this pipeline requires a list of plain-text inputs stored in `kg_qa_pipeline_input.json`:

- **text**: A list of original natural language texts.

An example input is shown below:

```json
[
  {
    "text": "Marie Curie studied at the University of Paris. Pierre Curie collaborated with Marie Curie. Marie Curie discovered radium with Pierre Curie."
  },
  {
    "text": "Ada Lovelace worked with Charles Babbage on the Analytical Engine. Charles Babbage designed the Analytical Engine. Ada Lovelace wrote detailed notes about the machine."
  },
  {
    "text": "The Nile flows through Egypt. Cairo is the capital of Egypt. Alexandria is a major city in Egypt."
  }
]
```

### 3.2 Knowledge Graph QA Pipeline Logic (`KGQA_APIPipeline`)

#### Step 1: Entity Extraction (`KGEntityExtraction`)

**Functionality:** Use an LLM to identify and extract key entities from plain text.  
**Input**: `text`  
**Output**: `entity`

#### Step 2: Triple Extraction (`KGTripleExtraction`)

**Functionality:** Extract graph relation triples from the original text together with the entities extracted in the previous step (`triple_type="relation"`).  
**Input**: `text`, `entity` (as meta information)  
**Output**: `triple`

#### Step 3: Triple Deduplication (`KGTupleRemoveRepeated`)

**Functionality:** Clean and remove duplicate triples to keep the graph data cleaner.  
**Input**: `triple`  
**Output**: `triple`

#### Step 4: Subgraph Sampling (`KGEntityBasedSubgraphSampling`)

**Functionality:** Perform subgraph walks and sampling over the deduplicated triple graph based on entities, using a specified hop setting such as `hop=2` and `M=5`.  
**Input**: `triple`  
**Output**: `subgraph`

#### Step 5: Subgraph Scale Evaluation (`KGSubgraphScaleEvaluator`)

**Functionality:** Evaluate the scale of each generated subgraph and compute the number of nodes, number of edges, and graph density.  
**Input**: `subgraph`  
**Output**: `num_nodes`, `num_edges`, `density`

#### Step 6: Subgraph Scale Filtering (`KGSubgraphScaleFilter`)

**Functionality:** Filter subgraphs using density thresholds such as `min_score=0.1` and `max_score=1.0`, removing graphs that are overly sparse or otherwise abnormal.  
**Input**: `subgraph`, `density`

#### Step 7: Subgraph QA Generation (`KGRelationTripleSubgraphQAGeneration`)

**Functionality:** Use the filtered high-quality subgraphs to generate numeric QA pairs with an LLM, for example with `qa_type="num"` and `num_q=5`.  
**Input**: `subgraph`  
**Output**: `QA_pairs`

#### Step 8: QA Naturalness Evaluation (`KGQANaturalEvaluator`)

**Functionality:** Use an LLM to evaluate the generated QA pairs for naturalness and fluency.  
**Input**: `QA_pairs`  
**Output**: `naturalness_scores`

### 3.3 Output Data

After the pipeline finishes running, the corresponding step files under `./cache_local` will gradually produce the following key fields:

- **entity**: The extracted entity list
- **triple**: Deduplicated relation triples
- **subgraph**: Subgraphs after sampling and density-based filtering
- **num_nodes / num_edges / density**: Graph scale and density metrics
- **QA_pairs**: The set of QA pairs generated from the graph
- **naturalness_scores**: Naturalness scores for each QA pair

Example output conceptually looks like the following. The actual structure depends on the implementation details of the underlying operators:

```json
{
    "subgraph":[
        "<subj> Marie Curie <obj> University Paris <rel> studied_at",
        "<subj> Pierre Curie <obj> Marie Curie <rel> collaborated_with",
        "<subj> Marie Curie <obj> Pierre Curie <rel> collaborated_with",
        "<subj> Marie Curie <obj> radium <rel> discovered",
        "<subj> Pierre Curie <obj> radium <rel> discovered"
    ],
    "num_nodes":4,
    "num_edges":5,
    "density":0.4166666667,
    "QA_pairs":[
        {
        "question":"How many individuals collaborated with Marie Curie and also discovered radium?",
        "answer":1
        },
        {
        "question":"How many unique entities did Marie Curie have a relationship with, according to the triples?",
        "answer":3
        },
        {
        "question":"What is the total number of collaborative relationships involving Marie Curie and Pierre Curie?",
        "answer":2
        },
        {
        "question":"How many entities are associated with the discovery of radium?",
        "answer":2
        },
        {
        "question":"What is the difference between the number of entities Marie Curie collaborated with and the number of entities she discovered radium with?",
        "answer":1
        }
    ],
    "naturalness_scores":[
        0.5,
        0,
        0.5,
        0.5,
        0.5
    ]
}
```

---

## 4. Pipeline Example

The complete code structure of `kg_qa_pipeline.py` is shown below:

```python
from dataflow.serving import APILLMServing_request
from dataflow.utils.storage import FileStorage

from dataflow.operators.general_kg.eval.kg_qa_natural_eval import KGQANaturalEvaluator
from dataflow.operators.general_kg.eval.kg_subgraph_scale_eval import KGSubgraphScaleEvaluator
from dataflow.operators.general_kg.filter.kg_rel_tuple_subgraph_sampling import (
    KGEntityBasedSubgraphSampling,
)
from dataflow.operators.general_kg.filter.kg_subgraph_scale_filtering import (
    KGSubgraphScaleFilter,
)
from dataflow.operators.general_kg.filter.kg_tuple_remove_repeated import (
    KGTupleRemoveRepeated,
)
from dataflow.operators.general_kg.generate.kg_entity_extractor import KGEntityExtraction
from dataflow.operators.general_kg.generate.kg_rel_triple_subgraph_qa_generator import (
    KGRelationTripleSubgraphQAGeneration,
)
from dataflow.operators.general_kg.generate.kg_triple_extractor import KGTripleExtraction


class KGQA_APIPipeline:
    def __init__(self):
        self.storage = FileStorage(
            first_entry_file_name="../example_data/kg_qa_pipeline_input.json",
            cache_path="./cache_local",
            file_name_prefix="kg_qa_pipeline",
            cache_type="json",
        )

        self.llm_serving = APILLMServing_request(
            api_url="https://api.openai.com/v1/chat/completions",
            model_name="gpt-4o",
            max_workers=30,
        )

        self.entity_extraction_step1 = KGEntityExtraction(
            llm_serving=self.llm_serving,
            lang="en",
        )

        self.triple_extraction_step2 = KGTripleExtraction(
            llm_serving=self.llm_serving,
            triple_type="relation",
            lang="en",
        )

        self.triple_dedup_step3 = KGTupleRemoveRepeated()

        self.subgraph_sampling_step4 = KGEntityBasedSubgraphSampling(
            llm_serving=self.llm_serving,
            lang="en",
        )

        self.subgraph_scale_eval_step5 = KGSubgraphScaleEvaluator()

        self.subgraph_scale_filter_step6 = KGSubgraphScaleFilter()

        self.subgraph_qa_generation_step7 = KGRelationTripleSubgraphQAGeneration(
            llm_serving=self.llm_serving,
            lang="en",
            qa_type="num",
            num_q=5,
        )

        self.qa_natural_eval_step8 = KGQANaturalEvaluator(
            llm_serving=self.llm_serving,
            lang="en",
        )

    def forward(self):
        self.entity_extraction_step1.run(
            storage=self.storage.step(),
            input_key="text",
            output_key="entity",
        )

        self.triple_extraction_step2.run(
            storage=self.storage.step(),
            input_key="text",
            input_key_meta="entity",
            output_key="triple",
        )

        self.triple_dedup_step3.run(
            storage=self.storage.step(),
            input_key="triple",
            output_key="triple",
        )

        self.subgraph_sampling_step4.run(
            storage=self.storage.step(),
            input_key="triple",
            output_key="subgraph",
            sampling_type="hop",
            hop=2,
            M=5,
        )

        self.subgraph_scale_eval_step5.run(
            storage=self.storage.step(),
            input_key="subgraph",
            output_key1="num_nodes",
            output_key2="num_edges",
            output_key3="density",
        )

        self.subgraph_scale_filter_step6.run(
            storage=self.storage.step(),
            input_key="subgraph",
            output_key="density",
            min_score=0.1,
            max_score=1.0,
        )

        self.subgraph_qa_generation_step7.run(
            storage=self.storage.step(),
            input_key="subgraph",
            output_key="QA_pairs",
        )

        self.qa_natural_eval_step8.run(
            storage=self.storage.step(),
            input_key="QA_pairs",
            output_key="naturalness_scores",
        )


if __name__ == "__main__":
    model = KGQA_APIPipeline()
    model.forward()
```
