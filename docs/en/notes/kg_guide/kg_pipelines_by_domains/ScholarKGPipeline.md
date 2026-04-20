---
title: Scholar Knowledge Answering Pipeline
icon: material-symbols-light:book-ribbon-rounded
createTime: 2026/04/13 11:05:00
permalink: /en/kg_guide/kg_pipelines_by_domains/scholarkgpipeline/
---

## 1. Overview

The core objective of the **Scholar Knowledge Answering Pipeline** is to extract structured knowledge from scholarly text and build a scholar knowledge graph around entities such as authors, papers, organizations, venues, and research topics. The pipeline first loads a scholarly ontology as an extraction constraint, then extracts triples from text, filters key academic relations according to a target ontology item, and finally generates a query reasoning answer from the filtered graph evidence.

We support the following application scenarios:

- extracting structured triples from paper abstracts, author profiles, project descriptions, or scholarly metadata
- building scholar knowledge graphs around authors, papers, organizations, topics, and venues
- filtering target triples according to a scholarly ontology, such as `author_of` or `has_topic`
- generating query reasoning answers based on scholarly knowledge graph paths

The main processes of the pipeline include:

1. **Scholar ontology loading**: `SchoKGGetOntology` generates the basic scholarly ontology for later extraction and filtering.
2. **Scholar triple extraction**: `SchoKGTripleExtraction` extracts `triple` and `entity_class` from `raw_chunk`.
3. **Target ontology filtering**: `SchoKGTripleFilter` filters triples by a target ontology item, such as keeping only triples with relation `author_of`.
4. **Query reasoning**: `SchoKGQueryReasoningOperator` generates `reasoning_path` and `reasoning_answer` from `query` and the filtered triples.

In this pipeline example, we use the query reasoning operator as the final step so that the `.py` file remains a strictly connected linear pipeline. `SchoKGRecommendOperator` can be used as an alternative final operator for scholarly node recommendation, such as recommending authors, papers, organizations, or topics.

## 2. Quick Start

### Step 1: Install DataFlow-KG

```bash
pip install dataflow-kg
```

### Step 2: Create a new DataFlow working directory

```bash
mkdir run_schokg_pipeline
cd run_schokg_pipeline
```

### Step 3: Initialize DataFlow

```bash
dfkg init
```

You will see:

```shell
run_dataflow/api_pipelines/scholar_kg_pipeline.py
```

If the initialized template does not include this file yet, you can manually create `scholar_kg_pipeline.py` and copy the source code from Section 4 into it.

### Step 4: Configure API Key and API URL

For Linux and macOS:

```shell
export DF_API_KEY="sk-xxxxx"
```

For Windows PowerShell:

```powershell
$env:DF_API_KEY = "sk-xxxxx"
```

Configure the `api_url` in `scholar_kg_pipeline.py` as follows:

```python
self.llm_serving = APILLMServing_request(
    api_url="https://api.openai.com/v1/chat/completions",
    model_name="gpt-4o",
    max_workers=20,
)
```

### Step 5: Prepare input data

A `jsonl` file is recommended. It should contain at least:

- `raw_chunk`: the scholarly text to be processed
- `query`: the question used for scholar KG reasoning

Example:

```jsonl
{"raw_chunk":"Alice Smith and Bob Lee co-authored the paper Graph Neural Networks for Scientific Discovery. The paper studies graph neural networks and scientific discovery, and was published at KDD 2024. Alice Smith is affiliated with Peking University, while Bob Lee is affiliated with Tsinghua University. Alice Smith leads the Scientific Graph Intelligence Lab, whose research focuses on graph mining and machine learning.","query":"Which paper is related to Alice Smith, graph neural networks, and scientific discovery?"}
```

### Step 6: One-click execution

```bash
python scholar_kg_pipeline.py
```

Next, we will introduce the data flow, operator composition, and parameter configuration used in this pipeline.

## 3. Data Flow and Pipeline Logic

### 3.1 Input data

The input data for this pipeline mainly includes the following fields:

- **raw_chunk**: raw scholarly text, typically from paper abstracts, author homepages, project descriptions, conference submission metadata, or other scholarly sources.
- **query**: a downstream KG reasoning question, such as asking which papers or research topics are related to a given author.

The input data can be stored in a `jsonl` file and loaded through `FileStorage`:

```python
self.storage = FileStorage(
    first_entry_file_name="./input/scholar_kg_input.jsonl",
    cache_path="./cache_schokg",
    file_name_prefix="scholar_kg_pipeline",
    cache_type="jsonl",
)
```

### 3.2 Scholar ontology loading

The first step uses `SchoKGGetOntology` to load the basic scholarly ontology. This operator generates entity types, relation types, and attribute types, and writes them to the cache path:

```text
./.cache/schokg/ontology.json
```

This cache file is then used by both `SchoKGTripleExtraction` and `SchoKGTripleFilter`, ensuring that extraction and filtering share the same scholarly ontology constraints.

### 3.3 Scholar triple extraction

The second step uses `SchoKGTripleExtraction` to extract scholarly triples from `raw_chunk`:

- input: `raw_chunk`
- ontology input: `ontology`
- outputs: `triple`, `entity_class`

`triple` stores the extracted scholarly relation triples, while `entity_class` stores the aligned entity type information. Both outputs are used as inputs for the following filtering operator.

### 3.4 Target ontology filtering

The third step uses `SchoKGTripleFilter` to filter extracted triples:

- inputs: `triple`, `entity_class`
- ontology input: `ontology`
- target: `target_ontology="author_of"`
- output: `filtered_triple`

In the example pipeline, we use `author_of` as the target relation and keep authorship relations between authors and papers. You can replace it with other targets in the ontology, such as `has_topic`, `affiliated_with`, or `Author`.

### 3.5 Scholar KG query reasoning

The fourth step uses `SchoKGQueryReasoningOperator` to generate query reasoning results:

- inputs: `query`, `filtered_triple`
- outputs: `reasoning_path`, `reasoning_answer`

The operator builds candidate graph paths from the filtered triples and uses the LLM to generate an answer based on the query. Here, `filtered_triple` is used as the triple input to make sure the output of the filtering step is actually consumed by the downstream reasoning step.

### 3.6 Optional alternatives and extensions

If the target task is scholarly node recommendation, the final step can be replaced with `SchoKGRecommendOperator`, and the outputs can be changed to `recommended_node` and `recommendation_reason`. This operator reads `query`, `triple`, and `entity_class`, and is suitable for recommending target nodes such as authors, papers, organizations, or research topics.

### 3.7 Output data

The final output usually contains the following fields:

- **raw_chunk**: raw scholarly text
- **query**: scholar KG query
- **triple**: extracted scholarly triples
- **entity_class**: entity types aligned with triples
- **filtered_triple**: triples filtered by the target ontology item
- **reasoning_path**: candidate reasoning paths used for the query answer
- **reasoning_answer**: generated query reasoning answer

## 4. Pipeline Example

```python
from dataflow.serving.api_llm_serving_request import APILLMServing_request
from dataflow.utils.storage import FileStorage
from dataflow.operators.domain_kg.utils.schokg_get_ontology import (
    SchoKGGetOntology,
)
from dataflow.operators.domain_kg.scholar_kg.generate.schokg_triple_extractor import (
    SchoKGTripleExtraction,
)
from dataflow.operators.domain_kg.scholar_kg.generate.schokg_query_reasoning import (
    SchoKGQueryReasoningOperator,
)


class ScholarKGPipeline:
    def __init__(self):
        self.storage = FileStorage(
            first_entry_file_name="../example_data/schokg_pipeline_input.json",
            cache_path="./cache_schokg",
            file_name_prefix="scholar_kg_pipeline",
            cache_type="jsonl",
        )
        self.ontology_storage = FileStorage(
            first_entry_file_name="",
            cache_path="./cache_schokg_ontology",
            file_name_prefix="scholar_kg_ontology",
            cache_type="json",
        )

        self.llm_serving = APILLMServing_request(
            api_url="https://api.openai.com/v1/chat/completions",
            model_name="gpt-4o",
            max_workers=20,
        )

        self.ontology_loader_step1 = SchoKGGetOntology()
        self.triple_extractor_step2 = SchoKGTripleExtraction(
            llm_serving=self.llm_serving,
            lang="en",
        )
        self.query_reasoning_step3 = SchoKGQueryReasoningOperator(
            llm_serving=self.llm_serving,
            lang="en",
            max_hop=3,
            max_candidate_paths=20,
        )

    def forward(self):
        self.ontology_loader_step1.run(
            storage=self.ontology_storage.step(),
        )

        self.triple_extractor_step2.run(
            storage=self.storage.step(),
            input_key="raw_chunk",
            input_key_meta="ontology",
            output_key="triple",
            output_key_meta="entity_class",
        )

        self.query_reasoning_step3.run(
            storage=self.storage.step(),
            input_key_query="query",
            input_key_triple="triple",
            output_key_path="reasoning_path",
            output_key_answer="reasoning_answer",
        )



if __name__ == "__main__":
    pipeline = ScholarKGPipeline()
    pipeline.forward()
```
