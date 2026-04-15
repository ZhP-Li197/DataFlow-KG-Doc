---
title: Financial KG Risk Analysis Pipeline
createTime: 2026/04/15 18:40:00
permalink: /en/kg_guide/finkg_risk_pipeline/
icon: carbon:chart-network
---

# Financial KG Risk Analysis Pipeline

## 1. Overview

The **Financial KG Risk Analysis Pipeline** is designed for risk identification over financial text. It first extracts Financial KG quadruples from raw text, filters them by ontology, and then produces a risk explanation and a risk score for a specified `target_entity`.

This pipeline is suitable for:

- risk assessment for corporations, institutions, or financial entities
- extracting risk signals from financial news and announcements
- building structured risk explanations from graph relations
- preparing data for downstream investment, compliance, or audit tasks

The main stages are:

1. **Financial quadruple extraction**: extract time-aware KG quadruples from raw text.
2. **Ontology filtering**: keep relations relevant to the target ontology.
3. **Risk analysis**: generate a risk explanation and score for the target entity.

---

## 2. Quick Start

### Step 1: Prepare the input data

The input file must contain at least:

- `raw_chunk`
- `target_entity`

A sample input is:

```json
[
  {
    "raw_chunk": "In 2012, Goldman Sachs underwrote three bond issuances for 1Malaysia Development Berhad (1MDB). In 2015, 1MDB faced potential default, and in 2020 Goldman Sachs agreed to pay more than $2.9 billion in fines to settle global investigations.",
    "target_entity": "Goldman Sachs"
  }
]
```

### Step 2: Configure the API key

```bash
export DF_API_KEY=sk-xxxx
```

### Step 3: Initialize the model service and run the pipeline

```python
from dataflow.serving import APILLMServing_request
from dataflow.statics.pipelines.api_pipelines.finkg_risk_pipeline import FinKGRiskPipeline

llm_serving = APILLMServing_request(
    api_url="https://api.openai.com/v1/chat/completions",
    key_name_of_api_key="DF_API_KEY",
    model_name="gpt-4o-mini",
    max_workers=8,
    temperature=0.0,
)

pipeline = FinKGRiskPipeline(
    first_entry_file_name="./finkg_risk_demo.json",
    llm_serving=llm_serving,
    cache_path="./cache_finkg_risk",
    lang="en",
    target_ontology="Corporation",
)
pipeline.forward()
```

---

## 3. Data Flow and Pipeline Logic

### 1. Input Data

This pipeline requires two input fields:

- **raw_chunk**: raw financial text
- **target_entity**: the entity whose risk should be assessed

A sample input is:

```json
[
  {
    "raw_chunk": "In 2012, Goldman Sachs underwrote three bond issuances for 1Malaysia Development Berhad (1MDB), a Malaysian state investment fund. In 2015, 1MDB faced potential default. In October 2020, Goldman Sachs agreed to pay more than $2.9 billion in fines to settle global investigations.",
    "target_entity": "Goldman Sachs"
  }
]
```

### 2. Financial KG Risk Analysis Pipeline Logic (FinKGRiskPipeline)

#### Step 1: Financial Quadruple Extraction (FinKGTupleExtraction)

**Functionality:**

- extract time-aware relation quadruples from financial text
- output ontology classes for participating entities

**Input**: `raw_chunk`  
**Output**: `tuple`, `entity_class`

Example quadruple format:

```text
<subj> Goldman Sachs <obj> 1MDB Bond <rel> underwrites <time> 2012
```

#### Step 2: Ontology Filtering (FinKGTupleFilter)

**Functionality:**

- filter quadruples by `target_ontology`
- keep the subset more relevant to the target entity type

**Input**: `tuple`, `entity_class`  
**Output**: `tuple`

#### Step 3: Risk Analysis (FinKGEntityRiskAssessment)

**Functionality:**

- combine filtered quadruples with `target_entity`
- output a risk explanation and a risk score

**Input**: `tuple`, `target_entity`  
**Output**: `risk_answer`, `risk_score`

### 3. Output Data

Typical output fields include:

- **tuple**: filtered financial quadruples
- **entity_class**: entity class labels
- **risk_answer**: risk analysis text
- **risk_score**: a score between 0 and 1

An example output is:

```json
{
  "tuple": [
    "<subj> Goldman Sachs <obj> 1MDB Bond <rel> underwrites <time> 2012",
    "<subj> 1MDB <obj> 1MDB Bond <rel> defaults_on <time> 2015",
    "<subj> SEC <obj> Goldman Sachs <rel> fined_by <time> 2020"
  ],
  "risk_answer": "Goldman Sachs is exposed to compliance and reputational risk because it underwrote the 1MDB-related bonds and was later fined during the investigation.",
  "risk_score": 0.91
}
```

---

## 4. Pipeline Example

Below is the full implementation of `FinKGRiskPipeline`.

```python
from dataflow.core import LLMServingABC
from dataflow.operators.domain_kg.financial_kg.filter.finkg_4tuple_ontology_filtering import (
    FinKGTupleFilter,
)
from dataflow.operators.domain_kg.financial_kg.generate.finkg_4tuple_extractor import (
    FinKGTupleExtraction,
)
from dataflow.operators.domain_kg.financial_kg.refine.finkg_entity_risk_assessment import (
    FinKGEntityRiskAssessment,
)
from dataflow.operators.domain_kg.utils.finkg_get_ontology import load_finkg_ontology
from dataflow.pipeline import PipelineABC
from dataflow.utils.storage import FileStorage


class FinKGRiskPipeline(PipelineABC):
    """Financial KG pipeline: raw text -> tuples -> filtered tuples -> risk answer.

    Required dataset columns:
    - `raw_chunk`: source financial text
    - `target_entity`: entity whose risk should be assessed
    """

    def __init__(
        self,
        first_entry_file_name: str,
        llm_serving: LLMServingABC,
        cache_path: str = "./cache_local",
        file_name_prefix: str = "finkg_risk_pipeline_step",
        cache_type: str = "jsonl",
        lang: str = "en",
        triple_type: str = "relation",
        target_ontology: str = "Corporation",
    ):
        super().__init__()
        if llm_serving is None:
            raise ValueError("llm_serving is required for FinKGRiskPipeline")

        self.storage = FileStorage(
            first_entry_file_name=first_entry_file_name,
            cache_path=cache_path,
            file_name_prefix=file_name_prefix,
            cache_type=cache_type,
        )
        self.ontology = load_finkg_ontology()
        self.target_ontology = target_ontology

        self.tuple_extraction_step1 = FinKGTupleExtraction(
            llm_serving=llm_serving,
            triple_type=triple_type,
            lang=lang,
        )
        self.tuple_filter_step2 = FinKGTupleFilter()
        self.risk_answer_step3 = FinKGEntityRiskAssessment(
            llm_serving=llm_serving,
            lang=lang,
        )

    def forward(self):
        self.tuple_extraction_step1.run(
            storage=self.storage.step(),
            ontology_lists=self.ontology,
            input_key="raw_chunk",
            input_key_meta=None,
            output_key="tuple",
            output_key_meta="entity_class",
        )
        self.tuple_filter_step2.run(
            storage=self.storage.step(),
            ontology_lists=self.ontology,
            input_key_tuple="tuple",
            input_key_class="entity_class",
            output_key="tuple",
            input_key_meta=None,
            target_ontology=self.target_ontology,
        )
        self.risk_answer_step3.run(
            storage=self.storage.step(),
            input_key="tuple",
            output_key="risk_answer",
            output_key_score="risk_score",
        )
```

A minimal invocation example is:

```python
from dataflow.serving import APILLMServing_request
from dataflow.statics.pipelines.api_pipelines.finkg_risk_pipeline import FinKGRiskPipeline

llm_serving = APILLMServing_request(
    api_url="https://api.openai.com/v1/chat/completions",
    key_name_of_api_key="DF_API_KEY",
    model_name="gpt-4o-mini",
    max_workers=8,
    temperature=0.0,
)

pipeline = FinKGRiskPipeline(
    first_entry_file_name="./finkg_risk_demo.json",
    llm_serving=llm_serving,
    cache_path="./cache_finkg_risk",
    lang="en",
    target_ontology="Corporation",
)
pipeline.forward()
```
