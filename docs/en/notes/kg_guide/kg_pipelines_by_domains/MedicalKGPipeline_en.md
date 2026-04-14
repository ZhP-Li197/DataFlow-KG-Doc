---
title: Medical Domain Knowledge Graph Pipeline
createTime: 2026/04/13 10:35:00
permalink: /en/kg_guide/kg_pipelines_by_domains/medicalkgpipeline/
---

## 1. Overview

The core objective of the **Medical Domain Knowledge Graph Pipeline** is to extract structured knowledge from medical text and build high-quality triples for downstream analysis around medical entities such as drugs, diseases, and genes. The pipeline first loads a medical ontology as a constraint, then extracts medical triples, filters key relations according to a target ontology item, and finally generates a drug action mechanism explanation from the filtered evidence.

We support the following application scenarios:

- extracting structured triples from medical papers, clinical reports, or drug-related text
- building medical knowledge graphs around drugs, diseases, genes, and related biomedical entities
- filtering target triples according to a medical ontology, such as `treats` or `affects`
- generating drug action mechanism explanations from knowledge graph evidence

The main processes of the pipeline include:

1. **Medical ontology loading**: `MedKGGetDrugTherapyOntology` generates the drug and therapy ontology for later extraction and filtering.
2. **Medical triple extraction**: `MedKGTripleExtraction` extracts `triple` and `entity_class` from `raw_chunk`.
3. **Target ontology filtering**: `MedKGTripleFilter` filters triples by a target ontology item, such as keeping only triples with relation `treats`.
4. **Action mechanism discovery**: `MedKGTripleDrugActionMechanismDiscovery` generates `mechanism_path` and `mechanism_answer` from `query` and the filtered triples.

In this pipeline example, we select only one knowledge discovery operator `MedKGTripleDrugActionMechanismDiscovery` for demonstration. `MedKGTripleDrugRepositioningDiscovery` can be used as an alternative final operator for drug repositioning. 

## 2. Quick Start

### Step 1: Install DataFlow-KG

```bash
pip install dataflow-kg
```

### Step 2: Create a new DataFlow working directory

```bash
mkdir run_medkg_pipeline
cd run_medkg_pipeline
```

### Step 3: Initialize DataFlow

```bash
dataflow init
```

You will see:

```shell
run_dataflow/api_pipelines/medical_kg_pipeline.py
```

### Step 4: Configure API Key and API URL

For Linux and macOS:

```shell
export DF_API_KEY="sk-xxxxx"
```

For Windows PowerShell:

```powershell
$env:DF_API_KEY = "sk-xxxxx"
```

Configure the `api_url` in `medical_kg_pipeline.py` as follows:

```python
self.llm_serving = APILLMServing_request(
    api_url="https://api.openai.com/v1/chat/completions",
    model_name="gpt-4o",
    max_workers=20,
)
```

### Step 5: Prepare input data

A `jsonl` file is recommended. It should contain at least:

- `raw_chunk`: the medical text to be processed
- `query`: the query used for drug action mechanism discovery

Example:

```jsonl
{"raw_chunk":"Gefitinib is used to treat EGFR-mutant non-small cell lung cancer. Gefitinib inhibits EGFR tyrosine kinase activity and reduces downstream MAPK and PI3K-AKT signaling. EGFR exon 19 deletion is associated with sensitivity to gefitinib, while the T790M mutation is associated with acquired resistance. Clinical studies report that gefitinib can improve progression-free survival in selected patients with advanced non-small cell lung cancer.","query":"What is the action mechanism of gefitinib in EGFR-mutant non-small cell lung cancer?"}
```

### Step 6: One-click execution

```bash
python medical_kg_pipeline.py
```

Next, we will introduce the data flow, operator composition, and parameter configuration used in this pipeline.

## 3. Data Flow and Pipeline Logic

### 3.1 Input data

The input data for this pipeline mainly includes the following fields:

- **raw_chunk**: raw medical text, typically from medical literature, clinical descriptions, drug labels, or other biomedical corpora.
- **query**: a downstream knowledge discovery query, such as asking for the action mechanism of a drug in a disease context.

The input data can be stored in a `jsonl` file and loaded through `FileStorage`:

```python
self.storage = FileStorage(
    first_entry_file_name="./input/medical_kg_input.jsonl",
    cache_path="./cache_medkg",
    file_name_prefix="medical_kg_pipeline",
    cache_type="jsonl",
)
```

### 3.2 Medical ontology loading

The first step uses `MedKGGetDrugTherapyOntology` to load the drug and therapy ontology. This operator generates entity types and relation types, and writes them to the cache path:

```text
./.cache/medical/drug_therapy_ontology.json
```

This cache file is then used by both `MedKGTripleExtraction` and `MedKGTripleFilter`, ensuring that extraction and filtering share the same medical ontology constraints.

### 3.3 Medical triple extraction

The second step uses `MedKGTripleExtraction` to extract medical triples from `raw_chunk`:

- input: `raw_chunk`
- ontology input: `drug_therapy_ontology`
- outputs: `triple`, `entity_class`

`triple` stores the extracted medical relation triples, while `entity_class` stores the aligned entity type information. Both outputs are used as inputs for the following filtering operator.

### 3.4 Target ontology filtering

The third step uses `MedKGTripleFilter` to filter extracted triples:

- inputs: `triple`, `entity_class`
- ontology input: `drug_therapy_ontology`
- target: `target_ontology="treats"`
- output: `filtered_triple`

In the example pipeline, we use `treats` as the target relation and keep drug-disease treatment triples. You can replace it with other targets in the ontology, such as `affects`, `binds`, or a specific entity type.

### 3.5 Drug action mechanism discovery

The fourth step uses `MedKGTripleDrugActionMechanismDiscovery` to generate drug action mechanism explanations:

- inputs: `query`, `filtered_triple`
- outputs: `mechanism_path`, `mechanism_answer`

The operator builds candidate graph paths from the filtered triples and uses the LLM to generate a mechanism explanation based on the query. Here, `filtered_triple` is used as the triple input to make sure the output of the filtering step is actually consumed by the downstream discovery step.

### 3.6 Optional alternatives and extensions

If the target task is drug repositioning, the final step can be replaced with `MedKGTripleDrugRepositioningDiscovery`, and the outputs can be changed to `reposition_path` and `reposition_answer`.

If the target task is meta-path analysis, `MedKGMetaPathGenerator` can be used separately to read `triple` and `entity_class` for path matching. However, because this operator currently writes a new single-column dataframe, it is better used as an independent analysis pipeline rather than being inserted directly into the linear `.py` example in this document.

### 3.7 Output data

The final output usually contains the following fields:

- **raw_chunk**: raw medical text
- **query**: medical knowledge discovery query
- **triple**: extracted medical triples
- **entity_class**: entity types aligned with triples
- **filtered_triple**: triples filtered by the target ontology item
- **mechanism_path**: candidate paths used for mechanism explanation
- **mechanism_answer**: generated drug action mechanism explanation

## 4. Pipeline Example

```python
from dataflow.serving import APILLMServing_request
from dataflow.utils.storage import FileStorage
from dataflow.operators.domain_kg.utils.medkg_get_drug_therapy_ontology import (
    MedKGGetDrugTherapyOntology,
)
from dataflow.operators.domain_kg.medical_kg.generate.medkg_triple_extractor import (
    MedKGTripleExtraction,
)
from dataflow.operators.domain_kg.utils.medkg_triple_ontology_filtering import (
    MedKGTripleFilter,
)
from dataflow.operators.domain_kg.medical_kg.generate.medkg_triple_drug_action_mechanism_discovery import (
    MedKGTripleDrugActionMechanismDiscovery,
)


class MedicalKGPipeline:
    def __init__(self):
        self.storage = FileStorage(
            first_entry_file_name="./input/medical_kg_input.jsonl",
            cache_path="./cache_medkg",
            file_name_prefix="medical_kg_pipeline",
            cache_type="jsonl",
        )
        self.ontology_storage = FileStorage(
            first_entry_file_name="",
            cache_path="./cache_medkg_ontology",
            file_name_prefix="medical_kg_ontology",
            cache_type="json",
        )

        self.llm_serving = APILLMServing_request(
            api_url="https://api.openai.com/v1/chat/completions",
            model_name="gpt-4o",
            max_workers=20,
        )

        self.ontology_loader_step1 = MedKGGetDrugTherapyOntology()
        self.triple_extractor_step2 = MedKGTripleExtraction(
            llm_serving=self.llm_serving,
            lang="en",
        )
        self.triple_filter_step3 = MedKGTripleFilter()
        self.mechanism_discovery_step4 = MedKGTripleDrugActionMechanismDiscovery(
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
            input_key_meta="drug_therapy_ontology",
            output_key="triple",
            output_key_meta="entity_class",
        )

        self.triple_filter_step3.run(
            storage=self.storage.step(),
            input_key_triple="triple",
            input_key_class="entity_class",
            input_key_meta="drug_therapy_ontology",
            target_ontology="treats",
            output_key="filtered_triple",
        )

        self.mechanism_discovery_step4.run(
            storage=self.storage.step(),
            input_key_query="query",
            input_key_triple="filtered_triple",
            output_key_path="mechanism_path",
            output_key_answer="mechanism_answer",
        )


if __name__ == "__main__":
    pipeline = MedicalKGPipeline()
    pipeline.forward()
```
