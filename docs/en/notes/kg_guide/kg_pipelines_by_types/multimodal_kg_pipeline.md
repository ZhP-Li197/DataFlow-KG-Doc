---
title: Multimodal Knowledge Graph Pipeline
createTime: 2026/04/15 18:35:00
permalink: /en/kg_guide/multimodal_kg_pipeline/
icon: carbon:chart-network
---

# Multimodal Knowledge Graph Pipeline

## 1. Overview

The **Multimodal Knowledge Graph Pipeline** is designed for joint text-image KG construction and QA generation. It first extracts entities and textual triples from text, then extracts visual triples from images, samples multimodal subgraphs around entities, and finally generates QA pairs from the combined graph and image evidence.

This pipeline is suitable for:

- building multimodal KGs from text and images together
- generating subgraph QA samples with visual evidence
- preparing training or evaluation data for multimodal KG QA
- enhancing graph representations for document pages, news reports, and image-text articles

The main stages are:

1. **Text entity extraction**: identify candidate entities from `raw_chunk`.
2. **Text triple extraction**: extract textual relations from entities.
3. **Visual triple extraction**: extract `depicted_in`-style visual relations from images.
4. **Multimodal subgraph sampling**: organize textual edges, visual edges, and image URLs into multimodal subgraphs.
5. **QA pair generation**: generate multimodal QA pairs from subgraphs and images.

---

## 2. Quick Start

### Step 1: Create a new DataFlow workspace

```bash
mkdir run_dataflow_kg
cd run_dataflow_kg
```

### Step 2: Prepare the input file

Save the following example as `mmkg_demo.json`. The values in `img_dict` must be valid local image paths.

```json
[
  {
    "raw_chunk": "Tesla unveiled the Cybertruck at a product event. Elon Musk appeared on stage and the presentation slide showed the vehicle design.",
    "img_dict": {
      "img_0": "./images/cybertruck.jpg",
      "img_1": "./images/elon_musk.jpg"
    }
  }
]
```

### Step 3: Save the script and configure environment variables

Save the code in the "Pipeline Example" section below as `multimodal_kg_pipeline.py`, then configure:

```bash
export DF_API_KEY=sk-xxxx
export DF_MMKG_INPUT_FILE=./mmkg_demo.json
```

If you need to change the text model, vision model, or sampling hop, you can modify:

```python
llm_serving = APILLMServing_request(
    api_url="https://api.openai.com/v1/chat/completions",
    key_name_of_api_key="DF_API_KEY",
    model_name="gpt-4o-mini",
    max_workers=6,
    temperature=0.0,
)

vlm_serving = APIVLMServing_openai(
    api_url="https://api.openai.com/v1",
    key_name_of_api_key="DF_API_KEY",
    model_name="o4-mini",
    max_workers=4,
    temperature=0.0,
)
```

### Step 4: Run the script

```bash
python multimodal_kg_pipeline.py
```

---

## 3. Data Flow and Pipeline Logic

### 1. Input Data

This pipeline requires at least the following fields:

- **raw_chunk**: source text for entity and textual triple extraction
- **img_dict**: an image dictionary where keys are image IDs and values are local image paths

A sample input is:

```json
[
  {
    "raw_chunk": "Tesla unveiled the Cybertruck at a product event. Elon Musk appeared on stage and the presentation slide showed the vehicle design.",
    "img_dict": {
      "img_0": "./images/cybertruck.jpg",
      "img_1": "./images/elon_musk.jpg"
    }
  }
]
```

One implementation detail is worth noting: the current `MMKGEntityBasedSubgraphSampling` operator works best when it starts from a **single source record**, because it expands that record into multiple subgraph rows grouped by entity.

### 2. Multimodal KG Pipeline Logic (MultimodalKGPipeline)

#### Step 1: Text Entity Extraction (KGEntityExtraction)

**Functionality:**

- extract candidate entities from text
- output a comma-separated entity string shared by later text and visual stages

**Input**: `raw_chunk`  
**Output**: `entity`

#### Step 2: Text Triple Extraction (KGTripleExtraction)

**Functionality:**

- extract textual relation triples from `raw_chunk` and `entity`
- create the textual edges of the multimodal graph

**Input**: `raw_chunk`, `entity`  
**Output**: `triple`

#### Step 3: Visual Triple Extraction (MMKGVisualTripleExtraction)

**Functionality:**

- combine images and candidate entities to extract visual facts
- typically output triples in the form `"<subj> entity <rel> depicted_in <obj> image_id"`

**Input**: `img_dict`, `entity`  
**Output**: `vis_triple`

#### Step 4: Multimodal Subgraph Sampling (MMKGEntityBasedSubgraphSampling)

**Functionality:**

- combine `triple`, `vis_triple`, and `img_dict`
- sample mixed text-visual subgraphs around entities
- output subgraphs, aligned visual triples, and image URLs

**Input**: `triple`, `vis_triple`, `img_dict`  
**Output**: `subgraph`, `vis_triple`, `vis_url`

#### Step 5: QA Pair Generation (MMKGSubgraphBaseQAGeneration)

**Functionality:**

- generate multimodal QA pairs from subgraphs and images
- useful as an upstream generator for training or evaluation data

**Input**: `vis_url`, `subgraph`, `vis_triple`  
**Output**: `QA_pairs`

### 3. Output Data

Typical output fields include:

- **entity**: extracted candidate entities
- **triple**: textual triples
- **vis_triple**: visual triples
- **subgraph**: sampled multimodal subgraphs
- **vis_url**: image path list aligned with the subgraph
- **QA_pairs**: generated question-answer pairs

An example output is:

```json
{
  "entity": "Tesla, Cybertruck, Elon Musk",
  "triple": [
    "<subj> Tesla <obj> Cybertruck <rel> unveils",
    "<subj> Elon Musk <obj> Tesla <rel> presents_for"
  ],
  "vis_triple": [
    "<subj> Cybertruck <rel> depicted_in <obj> img_0",
    "<subj> Elon Musk <rel> depicted_in <obj> img_1"
  ],
  "subgraph": [
    "<subj> Tesla <obj> Cybertruck <rel> unveils",
    "<subj> Elon Musk <obj> Tesla <rel> presents_for"
  ],
  "vis_url": [
    "./images/cybertruck.jpg"
  ],
  "QA_pairs": [
    {
      "question": "What vehicle is shown in the event image?",
      "answer": "Cybertruck."
    }
  ]
}
```

---

## 4. Pipeline Example

Below is the full implementation of `MultimodalKGPipeline`.

```python
import os

from dataflow.core import LLMServingABC
from dataflow.operators.general_kg.generate.kg_entity_extractor import (
    KGEntityExtraction,
)
from dataflow.operators.general_kg.generate.kg_triple_extractor import (
    KGTripleExtraction,
)
from dataflow.operators.multi_model_kg import (
    MMKGEntityBasedSubgraphSampling,
    MMKGSubgraphBaseQAGeneration,
    MMKGVisualTripleExtraction,
)
from dataflow.pipeline import PipelineABC
from dataflow.serving import APILLMServing_request, APIVLMServing_openai
from dataflow.utils.storage import FileStorage


class MultimodalKGPipeline(PipelineABC):
    """Multimodal KG pipeline: text triples + visual triples -> subgraphs -> QA pairs."""

    def __init__(
        self,
        first_entry_file_name: str,
        llm_serving: LLMServingABC,
        vlm_serving: LLMServingABC,
        cache_path: str = "./cache_local",
        file_name_prefix: str = "multimodal_kg_pipeline_step",
        cache_type: str = "json",
        lang: str = "en",
        triple_type: str = "relation",
        sampling_type: str = "hop",
        subgraph_hop: int = 2,
        quality_threshold: int = 3,
    ):
        super().__init__()
        if llm_serving is None:
            raise ValueError("llm_serving is required for MultimodalKGPipeline")
        if vlm_serving is None:
            raise ValueError("vlm_serving is required for MultimodalKGPipeline")

        self.storage = FileStorage(
            first_entry_file_name=first_entry_file_name,
            cache_path=cache_path,
            file_name_prefix=file_name_prefix,
            cache_type=cache_type,
        )
        self.sampling_type = sampling_type
        self.subgraph_hop = subgraph_hop

        self.entity_extraction_step1 = KGEntityExtraction(
            llm_serving=llm_serving,
            lang=lang,
        )
        self.text_triple_extraction_step2 = KGTripleExtraction(
            llm_serving=llm_serving,
            triple_type=triple_type,
            lang=lang,
        )
        self.visual_triple_extraction_step3 = MMKGVisualTripleExtraction(
            llm_serving=vlm_serving,
            quality_threshold=quality_threshold,
            lang=lang,
        )
        self.subgraph_sampling_step4 = MMKGEntityBasedSubgraphSampling(
            llm_serving=llm_serving,
            lang=lang,
        )
        self.qa_generation_step5 = MMKGSubgraphBaseQAGeneration(
            llm_serving=vlm_serving,
            lang=lang,
        )

    def forward(self):
        self.entity_extraction_step1.run(
            storage=self.storage.step(),
            input_key="raw_chunk",
            output_key="entity",
        )
        self.text_triple_extraction_step2.run(
            storage=self.storage.step(),
            input_key="raw_chunk",
            input_key_meta="entity",
            output_key="triple",
        )
        self.visual_triple_extraction_step3.run(
            storage=self.storage.step(),
            input_key="img_dict",
            input_key_meta="entity",
            output_key="vis_triple",
        )
        self.subgraph_sampling_step4.run(
            storage=self.storage.step(),
            input_key="triple",
            output_key="subgraph",
            vis_triple_key="vis_triple",
            sampling_type=self.sampling_type,
            hop=self.subgraph_hop,
        )
        self.qa_generation_step5.run(
            storage=self.storage.step(),
            input_key="vis_url",
            input_key_meta="subgraph",
            output_key="QA_pairs",
        )


if __name__ == "__main__":
    input_file = os.environ.get("DF_MMKG_INPUT_FILE", "")
    if not input_file:
        raise ValueError(
            "Set DF_MMKG_INPUT_FILE to a JSON file containing `raw_chunk` and `img_dict`."
        )

    llm_serving = APILLMServing_request(
        api_url="https://api.openai.com/v1/chat/completions",
        key_name_of_api_key="DF_API_KEY",
        model_name="gpt-4o-mini",
        max_workers=6,
        temperature=0.0,
    )
    vlm_serving = APIVLMServing_openai(
        api_url="https://api.openai.com/v1",
        key_name_of_api_key="DF_API_KEY",
        model_name="o4-mini",
        max_workers=4,
        temperature=0.0,
    )

    pipeline = MultimodalKGPipeline(
        first_entry_file_name=input_file,
        llm_serving=llm_serving,
        vlm_serving=vlm_serving,
        cache_path="./cache_mmkg",
        lang="en",
        sampling_type="hop",
        subgraph_hop=2,
    )
    pipeline.forward()
```
