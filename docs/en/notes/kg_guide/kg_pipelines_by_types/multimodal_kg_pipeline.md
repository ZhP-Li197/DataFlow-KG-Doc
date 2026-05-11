---
title: Multimodal Knowledge Graph Pipeline
createTime: 2026/04/15 18:35:00
permalink: /en/kg_guide/multimodal_kg_pipeline/
icon: solar:skip-next-bold
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

### Step 2: Initialize pipeline code and default data

```bash
dfkg init
```

The initialization creates:

- Pipeline script: `api_pipelines/multimodal_kg_pipeline.py`
- Default data: `example_data/MultimodalKGPipeline/input.json`
- Sample images: `example_data/MultimodalKGPipeline/images/cyber.jpg`, `example_data/MultimodalKGPipeline/images/musk.jpg`

Values in `img_dict` are the actual paths the VLM serving layer opens. Only **local paths** are supported today: the serving layer calls `open(path, "rb")` and base64-encodes the bytes into the request, and it does not fetch remote URLs. The default data ships with runnable example images, and the paths are written relative to the `api_pipelines/` directory (the CWD when you run `python multimodal_kg_pipeline.py`).

### Step 3: Configure the API key and optional model settings

```bash
export DF_API_KEY=sk-xxxx
```

The default text model is `gpt-4o-mini`, and the default vision model is `o4-mini`. You can override the defaults with `DF_API_URL`, `DF_LLM_MODEL`, `DF_VLM_API_URL`, `DF_VLM_MODEL`, or `DF_MMKG_INPUT_FILE`.

### Step 4: Run the script

```bash
python api_pipelines/multimodal_kg_pipeline.py
```

---

## 3. Data Flow and Pipeline Logic

### 3.1 Input Data

This pipeline requires at least the following fields:

- **raw_chunk**: source text for entity and textual triple extraction
- **img_dict**: an image dictionary where keys are image IDs (free-form strings that appear in `vis_triple`) and values are local image paths
- **vis_url**: a list of image paths the VLM opens during step 5 QA generation. Its order must match the order in which image IDs first appear in `img_dict`.

A sample input is:

```json
[
  {
    "raw_chunk": "Tesla unveiled the Cybertruck at a product event. Elon Musk appeared on stage during the launch presentation. The presentation focused on electric vehicle design and manufacturing.",
    "img_dict": {
      "img_cybertruck": "../example_data/MultimodalKGPipeline/images/cyber.jpg",
      "img_musk_stage": "../example_data/MultimodalKGPipeline/images/musk.jpg"
    },
    "vis_url": [
      "../example_data/MultimodalKGPipeline/images/cyber.jpg",
      "../example_data/MultimodalKGPipeline/images/musk.jpg"
    ]
  }
]
```

One implementation detail is worth noting: the current `MMKGEntityBasedSubgraphSampling` operator works best when it starts from a **single source record**, because it expands that record into multiple subgraph rows grouped by entity.

### 3.2 Multimodal KG Pipeline Logic (MultimodalKGPipeline)

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
- output triples in the form `"<subj> entity <obj> image_id <rel> depicted_in "`

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

### 3.3 Output Data

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
  "entity": "Tesla, Cybertruck, Elon Musk, electric vehicle design, manufacturing",
  "triple": [
    "<subj> Tesla <obj> Cybertruck <rel> unveiled",
    "<subj> Elon Musk <obj> Cybertruck <rel> appeared_on_stage"
  ],
  "vis_triple": [
    "<subj> Cybertruck <obj> img_cybertruck <rel> depicted_in ",
    "<subj> Elon Musk <obj> img_musk_stage <rel> depicted_in ",
    "<subj> Cybertruck <obj> img_musk_stage <rel> depicted_in "
  ],
  "subgraph": [
    "<subj> Tesla <obj> Cybertruck <rel> unveiled",
    "<subj> Elon Musk <obj> Cybertruck <rel> appeared_on_stage"
  ],
  "vis_url": [
    "../example_data/MultimodalKGPipeline/images/cyber.jpg",
    "../example_data/MultimodalKGPipeline/images/musk.jpg"
  ],
  "QA_pairs": [
    {
      "question": "Based on the image img_cybertruck, who unveiled the Cybertruck?",
      "answer": "The image img_cybertruck shows the Cybertruck, which was unveiled by Tesla."
    },
    {
      "question": "In the image img_musk_stage, who is associated with the Cybertruck's appearance?",
      "answer": "The image img_musk_stage shows Elon Musk, who appeared on stage with the Cybertruck as per the subgraph."
    }
  ]
}
```

---

## 4. Pipeline Example

The following is a reference view of the `MultimodalKGPipeline` code generated by `dfkg init`. For execution, use the generated `api_pipelines/multimodal_kg_pipeline.py` file.

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
    input_file = os.environ.get(
        "DF_MMKG_INPUT_FILE",
        os.path.abspath(
            os.path.join(
                os.path.dirname(__file__),
                "..",
                "example_data",
                "MultimodalKGPipeline",
                "input.json",
            )
        ),
    )

    llm_serving = APILLMServing_request(
        api_url=os.environ.get(
            "DF_API_URL",
            "https://api.openai.com/v1/chat/completions",
        ),
        key_name_of_api_key="DF_API_KEY",
        model_name=os.environ.get("DF_LLM_MODEL", "gpt-4o-mini"),
        max_workers=6,
        temperature=0.0,
    )
    vlm_serving = APIVLMServing_openai(
        api_url=os.environ.get("DF_VLM_API_URL", "https://api.openai.com/v1"),
        key_name_of_api_key="DF_API_KEY",
        model_name=os.environ.get("DF_VLM_MODEL", "o4-mini"),
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
