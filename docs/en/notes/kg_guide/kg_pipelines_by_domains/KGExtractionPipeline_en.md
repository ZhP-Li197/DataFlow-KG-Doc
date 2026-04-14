---
title: General Knowledge Graph Extraction Pipeline
createTime: 2026/04/13 11:35:00
permalink: /en/kg_guide/kg_pipelines_by_domains/kgextractionpipeline/
---

## 1. Overview

The core objective of the **General Knowledge Graph Extraction Pipeline** is to extract entities and relation triples from unstructured text, then produce cleaner and more reliable knowledge graph construction results through relation inference, deduplication, and validity checking. The pipeline first identifies candidate entities from raw text, then extracts relation triples based on those entities, infers implicit relations from existing triples, removes duplicate triples, and finally uses an LLM to validate whether the remaining triples are semantically plausible.

We support the following application scenarios:

- extracting entities and relation triples from general text, encyclopedic content, technical documents, or domain corpora
- preparing structured triples for knowledge graph construction, graph completion, or graph question answering
- inferring implicit relations from existing relation triples to expand KG closure
- deduplicating and validating extracted or inferred triples to improve downstream data quality

The main processes of the pipeline include:

1. **Entity extraction**: `KGEntityExtraction` extracts candidate entities from `raw_chunk` and writes them to `entity`.
2. **Relation triple extraction**: `KGTripleExtraction` extracts relation-type `triple` from `raw_chunk` and `entity`.
3. **Relation triple inference**: `KGRelationTripleInference` infers implicit triples from existing `triple` and merges them back into `triple` with `merge_to_input=True`.
4. **Triple deduplication**: `KGTupleRemoveRepeated` strictly deduplicates the merged `triple`.
5. **Triple validity checking**: `KGTupleValidity` judges whether the deduplicated `triple` entries are semantically valid and outputs `valid_triple`.

In this pipeline example, we use relation triple extraction and relation triple validation so that the `.py` file remains a strictly connected linear pipeline. `KGTripleExtraction` also supports attribute extraction, but attribute-style outputs are not suitable as direct inputs for `KGRelationTripleInference` in this example.

## 2. Quick Start

### Step 1: Install DataFlow-KG

```bash
pip install dataflow-kg
```

### Step 2: Create a new DataFlow working directory

```bash
mkdir run_kg_extraction_pipeline
cd run_kg_extraction_pipeline
```

### Step 3: Initialize DataFlow

```bash
dataflow init
```

You will see:

```shell
run_dataflow/api_pipelines/kg_extraction_pipeline.py
```

If the initialized template does not include this file yet, you can manually create `kg_extraction_pipeline.py` and copy the source code from Section 4 into it.

### Step 4: Configure API Key and API URL

For Linux and macOS:

```shell
export DF_API_KEY="sk-xxxxx"
```

For Windows PowerShell:

```powershell
$env:DF_API_KEY = "sk-xxxxx"
```

Configure the `api_url` in `kg_extraction_pipeline.py` as follows:

```python
self.llm_serving = APILLMServing_request(
    api_url="https://api.openai.com/v1/chat/completions",
    model_name="gpt-4o",
    max_workers=20,
)
```

### Step 5: Prepare input data

A `jsonl` file is recommended. It should contain at least:

- `raw_chunk`: the raw text to be processed

Example:

```jsonl
{"raw_chunk":"Ada Lovelace collaborated with Charles Babbage on the Analytical Engine. Lovelace wrote notes about the Analytical Engine and described an algorithm for computing Bernoulli numbers. Charles Babbage designed the Analytical Engine, which influenced later programmable computing concepts. Lovelace was associated with the early history of computer programming, and the Analytical Engine is often discussed as an important precursor to modern computers."}
```

### Step 6: One-click execution

```bash
python kg_extraction_pipeline.py
```

Next, we will introduce the data flow, operator composition, and parameter configuration used in this pipeline.

## 3. Data Flow and Pipeline Logic

### 3.1 Input data

The input data for this pipeline mainly includes the following field:

- **raw_chunk**: raw text from general corpora, webpages, document paragraphs, or domain-specific text.

The input data can be stored in a `jsonl` file and loaded through `FileStorage`:

```python
self.storage = FileStorage(
    first_entry_file_name="./input/kg_extraction_input.jsonl",
    cache_path="./cache_kg_extraction",
    file_name_prefix="kg_extraction_pipeline",
    cache_type="jsonl",
)
```

### 3.2 Entity extraction

The first step uses `KGEntityExtraction` to extract candidate entities from `raw_chunk`:

- input: `raw_chunk`
- output: `entity`

`entity` is used as the entity constraint for the next relation triple extraction step, helping `KGTripleExtraction` generate structured relations only around recognized entities.

### 3.3 Relation triple extraction

The second step uses `KGTripleExtraction` to extract relation-type KG triples:

- input: `raw_chunk`
- entity input: `entity`
- parameter: `triple_type="relation"`
- output: `triple`

In this pipeline, the output of `KGTripleExtraction` is consumed by the downstream relation inference operator, so we use relation triple mode rather than attribute extraction mode.

### 3.4 Relation triple inference

The third step uses `KGRelationTripleInference` to infer implicit triples from existing `triple`:

- input: `triple`
- output: `inferred_triple`
- key parameter: `merge_to_input=True`

`merge_to_input=True` merges the inferred `inferred_triple` values back into the original `triple` column. This allows the next deduplication operator to continue reading `triple`, keeping the pipeline strictly connected from one step to the next.

### 3.5 Triple deduplication

The fourth step uses `KGTupleRemoveRepeated` to strictly deduplicate the merged `triple`:

- input: `triple`
- output: `triple`

This operator removes fully identical triple strings and reduces duplicate results that may be introduced during extraction or inference.

### 3.6 Triple validity checking

The fifth step uses `KGTupleValidity` to judge whether the deduplicated `triple` entries are semantically plausible:

- input: `triple`
- parameter: `triple_type="relation"`
- output: `valid_triple`

`valid_triple` stores triples that pass LLM-based semantic validation and can be used for downstream KG insertion, graph question answering, or graph reasoning tasks.

### 3.7 Output data

The final output usually contains the following fields:

- **triple**: relation triples after inference merging and deduplication
- **valid_triple**: triples kept after semantic validity checking

Because `KGTupleRemoveRepeated` writes the deduplicated results into a new triple table, the final file focuses on cleaned `triple` values and their validation results. If you need to preserve the original text and entity columns, you can replace the deduplication step with a custom cleaning step that keeps the full row context.

## 4. Pipeline Example

```python
from dataflow.serving import APILLMServing_request
from dataflow.utils.storage import FileStorage
from dataflow.operators.general_kg.generate.kg_entity_extractor import (
    KGEntityExtraction,
)
from dataflow.operators.general_kg.generate.kg_triple_extractor import (
    KGTripleExtraction,
)
from dataflow.operators.general_kg.generate.kg_rel_triple_inference import (
    KGRelationTripleInference,
)
from dataflow.operators.general_kg.filter.kg_tuple_remove_repeated import (
    KGTupleRemoveRepeated,
)
from dataflow.operators.general_kg.filter.kg_tuple_validation import (
    KGTupleValidity,
)


class KGExtractionPipeline:
    def __init__(self):
        self.storage = FileStorage(
            first_entry_file_name="./input/kg_extraction_input.jsonl",
            cache_path="./cache_kg_extraction",
            file_name_prefix="kg_extraction_pipeline",
            cache_type="jsonl",
        )

        self.llm_serving = APILLMServing_request(
            api_url="https://api.openai.com/v1/chat/completions",
            model_name="gpt-4o",
            max_workers=20,
        )

        self.entity_extractor_step1 = KGEntityExtraction(
            llm_serving=self.llm_serving,
            lang="en",
        )
        self.triple_extractor_step2 = KGTripleExtraction(
            llm_serving=self.llm_serving,
            triple_type="relation",
            lang="en",
        )
        self.triple_inference_step3 = KGRelationTripleInference(
            llm_serving=self.llm_serving,
            lang="en",
            merge_to_input=True,
        )
        self.tuple_dedup_step4 = KGTupleRemoveRepeated(
            lang="en",
        )
        self.tuple_validation_step5 = KGTupleValidity(
            llm_serving=self.llm_serving,
            lang="en",
            triple_type="relation",
        )

    def forward(self):
        self.entity_extractor_step1.run(
            storage=self.storage.step(),
            input_key="raw_chunk",
            output_key="entity",
        )

        self.triple_extractor_step2.run(
            storage=self.storage.step(),
            input_key="raw_chunk",
            input_key_meta="entity",
            output_key="triple",
        )

        self.triple_inference_step3.run(
            storage=self.storage.step(),
            input_key="triple",
            output_key="inferred_triple",
        )

        self.tuple_dedup_step4.run(
            storage=self.storage.step(),
            input_key="triple",
            output_key="triple",
        )

        self.tuple_validation_step5.run(
            storage=self.storage.step(),
            input_key="triple",
            output_key="valid_triple",
        )


if __name__ == "__main__":
    model = KGExtractionPipeline()
    model.forward()
```
