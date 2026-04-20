---
title: Legal Judgement Prediction Pipeline
icon: material-symbols-light:page-info-rounded
createTime: 2026/04/13 11:15:00
permalink: /en/kg_guide/LegalKGPipeline/
---

## 1. Overview

The core objective of the **Legal Domain Knowledge Graph Pipeline** is to extract structured knowledge from legal case text and build a legal knowledge graph for case analysis around parties, legal institutions, case types, legal events, evidence, and judgments. The pipeline first loads a legal ontology as a constraint, then extracts legal triples, filters key facts according to a target ontology item, evaluates semantic similarity between the case summary and a target case type, filters low-relevance samples, and finally predicts a judgment from the filtered triples.

We support the following application scenarios:

- extracting structured triples from judgments, case fact descriptions, or legal reports
- building legal knowledge graphs around parties, litigation roles, legal events, and judicial relations
- filtering target triples according to a legal ontology, such as `NaturalPerson`, `constitutes`, or `violates`
- evaluating the relevance between a case summary and a target case type
- generating a judgment and supporting reasons from legal graph facts

The main processes of the pipeline include:

1. **Legal ontology loading**: `LegalKGGetBasicOntology` generates the general Legal Judgement Prediction ontology for later extraction and filtering.
2. **Legal triple extraction**: `LegalKGTupleExtraction` extracts `triple`, `entity_class`, and `case_summary` from `raw_chunk`.
3. **Target ontology filtering**: `LegalKGTripleFilter` filters triples by a target ontology item, such as keeping facts involving `NaturalPerson`.
4. **Case similarity evaluation**: `LegalKGCaseSummarySimilarity` evaluates the semantic match between `case_summary` and the target case type description.
5. **Case similarity filtering**: `LegalKGCaseSimilarityFilter` keeps relevant case samples according to `similarity_score`.
6. **Judgment prediction**: `LegalKGJudgementPrediction` generates `judgement` and `reason` from the filtered triples.

In this pipeline example, we select implemented operators that can form a strictly connected linear workflow. `legalkg_event_extractor.py`, `legalkg_triple_privacy_filtering.py`, and `legalkg_entity_link2database.py` are currently empty placeholder files, so they are not included in this pipeline example.

## 2. Quick Start

### Step 1: Install DataFlow-KG

```bash
pip install dataflow-kg
```

### Step 2: Create a new DataFlow working directory

```bash
mkdir run_legalkg_pipeline
cd run_legalkg_pipeline
```

### Step 3: Initialize DataFlow

```bash
dataflow init
```

You will see:

```shell
run_dataflow/api_pipelines/legal_kg_pipeline.py
```

If the initialized template does not include this file yet, you can manually create `legal_kg_pipeline.py` and copy the source code from Section 4 into it.

### Step 4: Configure API Key and API URL

For Linux and macOS:

```shell
export DF_API_KEY="sk-xxxxx"
```

For Windows PowerShell:

```powershell
$env:DF_API_KEY = "sk-xxxxx"
```

Configure the `api_url` in `legal_kg_pipeline.py` as follows:

```python
self.llm_serving = APILLMServing_request(
    api_url="https://api.openai.com/v1/chat/completions",
    model_name="gpt-4o",
    max_workers=20,
)
```

### Step 5: Prepare input data

A `jsonl` file is recommended. It should contain at least:

- `raw_chunk`: the legal case text to be processed

Example:

```jsonl
{"raw_chunk":"In March 2024, Zhang San took an iPhone worth RMB 6000 from a counter in a shopping mall in Chaoyang District, Beijing while the clerk was arranging shelves, put the phone into his backpack, and left the scene. Mall surveillance recorded Zhang San taking the phone and leaving the counter, and the public security authority later found the phone at his residence. After being brought to the case, Zhang San confessed the main facts and compensated the shopping mall for the loss. The court held that Zhang San secretly took another person's property for the purpose of illegal possession, that the amount was relatively large, and that his conduct constituted theft; the court then issued a judgment considering compensation, confession, and guilty plea circumstances."}
```

### Step 6: One-click execution

```bash
python legal_kg_pipeline.py
```

Next, we will introduce the data flow, operator composition, and parameter configuration used in this pipeline.

## 3. Data Flow and Pipeline Logic

### 3.1 Input data

The input data for this pipeline mainly includes the following field:

- **raw_chunk**: raw legal case text, typically from judgments, case fact descriptions, legal consultation records, or legal reports.

The input data can be stored in a `jsonl` file and loaded through `FileStorage`:

```python
self.storage = FileStorage(
    first_entry_file_name="./input/legal_kg_input.jsonl",
    cache_path="./cache_legalkg",
    file_name_prefix="legal_kg_pipeline",
    cache_type="jsonl",
)
```

### 3.2 Legal ontology loading

The first step uses `LegalKGGetBasicOntology` to load the general Legal Judgement Prediction ontology. This operator generates entity types, relation types, and attribute types, and writes them to the cache path:

```text
./.cache/api/legal_ontology.json
```

This cache file is then used by both `LegalKGTupleExtraction` and `LegalKGTripleFilter`, ensuring that extraction and filtering share the same legal ontology constraints.

### 3.3 Legal triple extraction

The second step uses `LegalKGTupleExtraction` to extract legal triples and a case summary from `raw_chunk`:

- input: `raw_chunk`
- ontology input: `legal_ontology`
- outputs: `triple`, `entity_class`, `case_summary`

`triple` stores the extracted legal fact triples, `entity_class` stores entity type information, and `case_summary` stores the case summary for later similarity evaluation.

### 3.4 Target ontology filtering

The third step uses `LegalKGTripleFilter` to filter extracted triples:

- inputs: `triple`, `entity_class`
- ontology input: `legal_ontology`
- target: `target_ontology="NaturalPerson"`
- output: `filtered_triple`

In the example pipeline, we use `NaturalPerson` as the target entity type and keep facts involving natural persons. You can replace it with other targets in the ontology, such as `IllegalAct`, `constitutes`, or `Court`.

### 3.5 Case similarity evaluation

The fourth step uses `LegalKGCaseSummarySimilarity` to evaluate semantic similarity between the case summary and a target case type:

- input: `case_summary`
- target case type: `input_key_meta=["theft case"]`
- output: `similarity_score`

This operator calls the LLM to output a similarity score between 0 and 1, which is used for downstream filtering.

### 3.6 Case similarity filtering

The fifth step uses `LegalKGCaseSimilarityFilter` to filter samples by the similarity threshold:

- inputs: `filtered_triple`, `similarity_score`
- output: filtered DataFrame

This step keeps rows whose `similarity_score` falls within `[min_score, max_score]`, and passes the filtered data to the judgment prediction step.

### 3.7 Judgment prediction

The sixth step uses `LegalKGJudgementPrediction` to generate the judgment and supporting reasons:

- input: `filtered_triple`
- case description: `input_key_meta=["Zhang San stole an iPhone worth RMB 6000"]`
- outputs: `judgement`, `reason`

Here, `filtered_triple` is used as the input to make sure the legal facts after ontology filtering and similarity filtering are actually consumed by the downstream prediction step.

### 3.8 Output data

The final output usually contains the following fields:

- **raw_chunk**: raw legal case text
- **triple**: extracted legal fact triples
- **entity_class**: entity types aligned with triples
- **case_summary**: case summary
- **filtered_triple**: triples filtered by the target ontology item
- **similarity_score**: similarity between the case summary and target case type
- **judgement**: generated judgment
- **reason**: generated supporting reasons

## 4. Pipeline Example

```python
from dataflow.serving import APILLMServing_request
from dataflow.utils.storage import FileStorage
from dataflow.operators.domain_kg.utils.legalkg_get_ontology import (
    LegalKGGetBasicOntology,
)
from dataflow.operators.domain_kg.legal_kg.generate.legalkg_triple_extractor import (
    LegalKGTupleExtraction,
)
from dataflow.operators.domain_kg.utils.legalkg_triple_ontology_filtering import (
    LegalKGTripleFilter,
)
from dataflow.operators.domain_kg.legal_kg.eval.legalkg_case_similarity_eval import (
    LegalKGCaseSummarySimilarity,
)
from dataflow.operators.domain_kg.legal_kg.filter.legalkg_case_similarity_filtering import (
    LegalKGCaseSimilarityFilter,
)
from dataflow.operators.domain_kg.legal_kg.generate.legalkg_case_judgement_generator import (
    LegalKGJudgementPrediction,
)


class LegalKGPipeline:
    def __init__(self):
        self.storage = FileStorage(
            first_entry_file_name="./input/legal_kg_input.jsonl",
            cache_path="./cache_legalkg",
            file_name_prefix="legal_kg_pipeline",
            cache_type="jsonl",
        )
        self.ontology_storage = FileStorage(
            first_entry_file_name="",
            cache_path="./cache_legalkg_ontology",
            file_name_prefix="legal_kg_ontology",
            cache_type="json",
        )

        self.llm_serving = APILLMServing_request(
            api_url="https://api.openai.com/v1/chat/completions",
            model_name="gpt-4o",
            max_workers=20,
        )

        self.ontology_loader_step1 = LegalKGGetBasicOntology(lang="en")
        self.triple_extractor_step2 = LegalKGTupleExtraction(
            llm_serving=self.llm_serving,
            triple_type="relation",
            lang="en",
        )
        self.triple_filter_step3 = LegalKGTripleFilter()
        self.case_similarity_eval_step4 = LegalKGCaseSummarySimilarity(
            llm_serving=self.llm_serving,
            lang="en",
        )
        self.case_similarity_filter_step5 = LegalKGCaseSimilarityFilter()
        self.judgement_prediction_step6 = LegalKGJudgementPrediction(
            llm_serving=self.llm_serving,
            lang="en",
        )

    def forward(self):
        self.ontology_loader_step1.run(
            storage=self.ontology_storage.step(),
        )

        self.triple_extractor_step2.run(
            storage=self.storage.step(),
            input_key="raw_chunk",
            input_key_meta="legal_ontology",
            output_key="triple",
            output_key_meta1="entity_class",
            output_key_meta2="case_summary",
        )

        self.triple_filter_step3.run(
            storage=self.storage.step(),
            input_key="triple",
            input_key_class="entity_class",
            input_key_meta="legal_ontology",
            target_ontology="NaturalPerson",
            output_key="filtered_triple",
        )

        self.case_similarity_eval_step4.run(
            storage=self.storage.step(),
            input_key="case_summary",
            input_key_meta=["theft case"],
            output_key="similarity_score",
        )

        self.case_similarity_filter_step5.run(
            storage=self.storage.step(),
            input_key="filtered_triple",
            output_key="similarity_score",
            min_score=0.6,
            max_score=1.0,
        )

        self.judgement_prediction_step6.run(
            storage=self.storage.step(),
            input_key="filtered_triple",
            input_key_meta=["Zhang San stole an iPhone worth RMB 6000"],
            output_key_judgement="judgement",
            output_key_reason="reason",
        )


if __name__ == "__main__":
    pipeline = LegalKGPipeline()
    pipeline.forward()
```
