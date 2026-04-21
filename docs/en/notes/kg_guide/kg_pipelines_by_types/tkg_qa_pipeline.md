---
title: Temporal Knowledge Graph QA Generation Pipeline
createTime: 2026/04/21 17:14:00
permalink: /en/kg_guide/tkg_qa_pipeline/
icon: mdi:alarm-clock 
---

# Temporal Knowledge Graph QA Pipeline

## 1. Overview

The **Temporal Knowledge Graph QA Generation Pipeline** is designed for scenarios where time-aware knowledge structures need to be extracted from natural language text and then used to generate temporal QA pairs based on specific time ranges and relational paths. Unlike a standard knowledge graph, a Temporal Knowledge Graph (TKG) emphasizes the valid time or occurrence time of facts. This pipeline can automatically extract temporal facts, filter them by time windows, build multi-hop relation paths, and finally generate and evaluate high-quality time-point QA pairs.

This pipeline is suitable for the following tasks:

- Extracting temporal tuples or triples with time information from unstructured text
- Precisely filtering the graph by a specified time interval, such as from `Q1 2021` to `2023`
- Generating and sampling multi-hop relation paths in temporal knowledge graphs
- Automatically building complex QA datasets that query specific time points based on multi-hop temporal paths
- Automatically evaluating QA naturalness with a large language model

The main stages of the pipeline include:

1. **Temporal Tuple Extraction**: Extract relation tuples with temporal constraints from text.
2. **Time Range Filtering**: Filter temporal tuples according to a specified start time and end time.
3. **Relation Path Generation**: Generate relation paths of a specified hop length, such as 2-hop paths, from the extracted tuples.
4. **Temporal Path QA Generation**: Generate QA pairs about time points based on those relation paths.
5. **QA Naturalness Evaluation**: Score the generated QA pairs for fluency and naturalness.

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

- Pipeline script: `api_pipelines/tkg_qa_pipeline.py`
- Default data: `example/tkg_qa_pipeline_input.json`

### Step 3: Configure the API key

This pipeline uses `gpt-4o` by default. You need to configure your OpenAI API key. The exact environment variable name depends on the underlying implementation of `APILLMServing_request`, and it is commonly `DF_API_KEY` or a similar setting:

```bash
export DF_API_KEY=sk-xxxx
```

### Step 4: Run the pipeline

```bash
python api_pipelines/tkg_qa_pipeline.py
```

---

## 3. Data Flow and Pipeline Logic

### 3.1 Input Data

The required data format for this pipeline should be stored in `tkg_qa_pipeline_input.json`, and at minimum it should contain a list of plain-text inputs:

- **text**: A list of original natural language texts that contain rich temporal events.

An example input is shown below:

```json
[
  {
    "text":"Alice joined Company A in January 2021. Alice was promoted to team lead in March 2022. Bob collaborated with Alice in 2022."
  },
  {
    "text":"City X hosted the spring marathon in April 2021. The event returned in April 2022. Tourists increased after the 2022 race."
  }
]
```

### 3.2 Temporal Knowledge Graph QA Pipeline Logic (`TKGQA_APIPipeline`)

#### Step 1: Temporal Tuple Extraction (`TKGTupleExtraction`)

**Functionality:**  
Use an LLM to extract relation triples or tuples with temporal constraints from text.  
**Input**: `text`  
**Output**: `tuple`

#### Step 2: Time Range Filtering (`TKGTupleTimeFilter`)

**Functionality:**  
Filter tuples according to the specified start and end times, keeping only events within the given time window.  
**Input**: `tuple`  
**Output**: `filtered_tuple`  
**Parameters**: `query_time_start="Q1 2021"`, `query_time_end="2023"`

#### Step 3: Relation Path Generation (`KGRelationTuplePathGenerator`)

**Functionality:**  
Generate connected relation paths of length `k`, for example `k=2`, from the extracted tuple set. These paths support later multi-hop and more complex reasoning-based QA.  
**Input**: `tuple`  
**Output**: `hop_paths` (stored at the meta level)

#### Step 4: Temporal Path QA Generation (`TKGTuplePathQAGeneration`)

**Functionality:**  
Generate QA pairs that ask about specific time points based on the generated path data above. For example, it can generate `qa_type="time_point"` questions for `hop=2`, with the number controlled by `num_q=5`.  
**Input**: `hop_paths` (meta)  
**Output**: `QA_pairs` (meta)

#### Step 5: QA Naturalness Evaluation (`KGQANaturalEvaluator`)

**Functionality:**  
Evaluate the naturalness and language quality of the 2-hop QA pairs generated in Step 4, where the key is `2_QA_pairs`.  
**Input**: `2_QA_pairs`  
**Output**: `naturalness_scores`

### 3.3 Output Data

After the pipeline finishes, DataFlow storage will contain the following core fields:

- **tuple**: All extracted temporal tuples
- **filtered_tuple**: Temporal tuples filtered by the time window, such as `Q1 2021 - 2023`
- **hop_paths**: Generated 2-hop entity relation paths
- **2_QA_pairs**: Complex QA pairs about time points generated from 2-hop paths
- **naturalness_scores**: Naturalness evaluation scores for the QA pairs

Example output conceptually looks like the following. The actual structure depends on the implementation details of the underlying operators:

```json
{
    "2_hop_paths":"<subj> Alice <obj> Company A <rel> joined <time> January 2021 || <subj> Bob <obj> Alice <rel> collaborated with <time> 2022",
    "2_QA_pairs":[
      {
        "question":"When did Alice join Company A?",
        "answer":"January 2021"
      },
      {
        "question":"At what time did Bob collaborate with Alice?",
        "answer":"2022"
      }
    ],
    "naturalness_scores":[
      1,
      0.5
    ]
}
```

---

## 4. Pipeline Example

The complete code structure of `tkg_qa_pipeline.py` is shown below:

```python
from pathlib import Path

import pandas as pd

from dataflow.serving import APILLMServing_request
from dataflow.utils.storage import FileStorage

from dataflow.operators.general_kg.eval.kg_qa_natural_eval import KGQANaturalEvaluator
from dataflow.operators.general_kg.filter.kg_rel_tuple_path_sampling import (
    KGRelationTuplePathGenerator,
)
from dataflow.operators.temporal_kg import TKGTupleExtraction
from dataflow.operators.temporal_kg import TKGTuplePathQAGeneration
from dataflow.operators.temporal_kg import TKGTupleTimeFilter

class TKGQA_APIPipeline:
    def __init__(self):
        self.storage = FileStorage(
            first_entry_file_name="../example_data/tkg_qa_pipeline_input.json",
            cache_path="./cache_local",
            file_name_prefix="tkg_qa_pipeline",
            cache_type="json",
        )

        self.llm_serving = APILLMServing_request(
            api_url="https://api.openai.com/v1/chat/completions",
            model_name="gpt-4o",
            max_workers=30,
        )

        self.temporal_tuple_extraction_step1 = TKGTupleExtraction(
            llm_serving=self.llm_serving,
            triple_type="relation",
            lang="en",
        )

        self.temporal_time_filter_step2 = TKGTupleTimeFilter(
            merge_to_input=True,
        )

        self.path_generation_step3 = KGRelationTuplePathGenerator(
            llm_serving=self.llm_serving,
            lang="en",
            k=2,
        )

        self.temporal_path_qa_generation_step4 = TKGTuplePathQAGeneration(
            llm_serving=self.llm_serving,
            lang="en",
            hop=2,
            qa_type="time_point",
            num_q=5,
        )

        self.qa_natural_eval_step5 = KGQANaturalEvaluator(
            llm_serving=self.llm_serving,
            lang="en",
        )

    def forward(self):
        self.temporal_tuple_extraction_step1.run(
            storage=self.storage.step(),
            input_key="text",
            output_key="tuple",
        )

        self.temporal_time_filter_step2.run(
            storage=self.storage.step(),
            input_key="tuple",
            output_key="filtered_tuple",
            query_time_start="Q1 2021",
            query_time_end="2023",
        )

        self.path_generation_step3.run(
            storage=self.storage.step(),
            input_key="tuple",
            output_key_meta="hop_paths",
        )

        self.temporal_path_qa_generation_step4.run(
            storage=self.storage.step(),
            input_key_meta="hop_paths",
            output_key_meta="QA_pairs",
        )

        self.qa_natural_eval_step5.run(
            storage=self.storage.step(),
            input_key="2_QA_pairs",
            output_key="naturalness_scores",
        )


if __name__ == "__main__":
    model = TKGQA_APIPipeline()
    model.forward()
```
