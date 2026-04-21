---
title: Hyper-Relational Knowledge Graph Pipeline
createTime: 2026/04/21 16:21:21
permalink: /en/kg_guide/hyper_kg_qa_pipeline/
icon: mdi:book-multiple-outline
---

# Hyper-Relational Knowledge Graph Pipeline

## 1. Overview

The **Hyper-Relational Knowledge Graph Pipeline** targets scenarios where natural language text is used to extract hyper-relational knowledge graph triples, filter attribute-specific subgraphs, and then generate and evaluate QA pairs from them. Compared with traditional triples, this pipeline can handle more complex graph structures, such as hyper-relational triples augmented with qualifiers like time and location, and it uses that richer structure to automatically build high-quality KG-QA datasets.

This pipeline is suitable for the following tasks:

- Extracting hyper-relational triples from complex text
- Retrieving and filtering subgraphs by specific attributes, such as `<Time>`
- Automatically generating multi-hop or otherwise complex QA pairs from hyper-relational knowledge graphs
- Automatically evaluating QA naturalness with a large language model

The main stages of the pipeline include:

1. **Hyper-Relational Triple Extraction**: Extract a set of hyper-relational triples with qualifier attributes from plain text.
2. **Attribute-Based Subgraph Filtering**: Filter generated triples according to a specified attribute tag, such as `<Time>`, and retain relevant subgraphs.
3. **Subgraph QA Generation**: Generate QA pairs of a specified type and quantity from the filtered subgraphs.
4. **QA Naturalness Evaluation**: Score the generated QA pairs for naturalness and fluency.

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

- Pipeline script: `api_pipelines/hyper_kg_qa_pipeline.py`
- Default data: `example/hyper_kg_qa_pipeline_input.json`

### Step 3: Configure the API key

This pipeline uses `gpt-4o` by default. You need to configure your OpenAI API key. The exact environment variable name depends on the underlying implementation of `APILLMServing_request`, and it is commonly `DF_API_KEY` or a similar setting:

```bash
export DF_API_KEY=sk-xxxx
```

### Step 4: Run the pipeline

```bash
python api_pipelines/hyper_kg_qa_pipeline.py
```

---

## 3. Data Flow and Pipeline Logic

### 3.1 Input Data

The required data format for this pipeline should be stored in `hyper_kg_qa_pipeline_input.json`, and at minimum it should contain the following field:

- **text**: A list of original natural language texts.

An example input is shown below:

```json
[
  {
    "text": "In March 2022, Alice joined Company A in Beijing. In July 2023, Alice led Project Orion for Company A in Shanghai. Bob collaborated with Alice on Project Orion in Shanghai during 2023."
  },
  {
    "text": "In April 2021, City X hosted the Spring Marathon in Riverside Park. In April 2022, City X hosted the Spring Marathon again in Riverside Park. Club Y won multiple titles at the 2022 event."
  },
  {
    "text": "In January 2020, Hospital Z launched a vaccination program in Shenzhen. In June 2021, Hospital Z expanded the program to Guangzhou. Doctors from Hospital Z reported higher participation in 2021."
  }
]
```

### 3.2 Hyper-Relational Knowledge Graph QA Pipeline Logic (`HyperKGQA_APIPipeline`)

#### Step 1: Hyper-Relational Triple Extraction (`HRKGTripleExtraction`)

**Functionality:**

- Use an LLM to extract hyper-relational triples from text, including subject, object, relation, and qualifier attributes such as time and location.

**Input**: `text`  
**Output**: `tuple`

**Operator Run:**

```python
self.hyper_triple_extraction_step1.run(
    storage=self.storage.step(),
    input_key="text",
    output_key="tuple",
)
```

#### Step 2: Attribute-Based Subgraph Filtering (`HRKGRelationTripleAttributeFilter`)

**Functionality:**

- Filter out subgraph data that contains a specific attribute qualifier, such as `<Time>`, to narrow the scope for later QA generation.

**Input**: `tuple`  
**Output**: `subgraph`  
**Parameter**: `attr_tag="<Time>"`

#### Step 3: Subgraph QA Generation (`HRKGRelationTripleSubgraphQAGeneration`)

**Functionality:**

- Use the filtered subgraphs with the target attribute to generate numeric or other specific types of QA pairs, such as `qa_type="num"`.
- Control the number of generated pairs, such as `num_q=5`.

**Input**: `subgraph`  
**Output**: `QA_pairs`

#### Step 4: QA Naturalness Evaluation (`KGQANaturalEvaluator`)

**Functionality:**

- Use an LLM to evaluate the generated QA pairs for naturalness and language quality, usually producing scores or evaluation results.

**Input**: `QA_pairs`  
**Output**: `naturalness_scores`

### 3.3 Output Data

After the pipeline finishes, DataFlow storage under the default path `./cache_local` will contain the following output fields:

- **text**: Original data
- **tuple**: Extracted hyper-relational triples
- **subgraph**: Graph structures after removing entries that do not contain the target attribute
- **QA_pairs**: Generated QA pairs, including questions and answers
- **naturalness_scores**: Naturalness evaluation scores for the QA pairs

Example output conceptually looks like the following. The actual structure depends on the implementation details of the underlying operators:

```json
{
  "text":"In January 2020, Hospital Z launched a vaccination program in Shenzhen. In June 2021, Hospital Z expanded the program to Guangzhou. Doctors from Hospital Z reported higher participation in 2021.",
  "tuple":[
    "<subj> Hospital Z <obj> Vaccination Program <rel> Launched <Time> January 2020 <Location> Shenzhen",
    "<subj> Hospital Z <obj> Vaccination Program <rel> Expanded <Time> June 2021 <Location> Guangzhou",
    "<subj> Doctors from Hospital Z <obj> Participation <rel> Reported <Time> 2021 <Degree> Higher"
  ],
  "subgraph":[
    "<subj> Hospital Z <obj> Vaccination Program <rel> Launched <Time> January 2020 <Location> Shenzhen",
    "<subj> Hospital Z <obj> Vaccination Program <rel> Expanded <Time> June 2021 <Location> Guangzhou",
    "<subj> Doctors from Hospital Z <obj> Participation <rel> Reported <Time> 2021 <Degree> Higher"
  ],
  "QA_pairs":[
    {
      "question":"In which locations did Hospital Z's vaccination program take place over time?",
      "answer":"Shenzhen, Guangzhou"
    },
    {
      "question":"What are the times associated with the launch and expansion of Hospital Z's vaccination program?",
      "answer":"January 2020, June 2021"
    },
    {
      "question":"What changes related to vaccination programs at Hospital Z were reported in 2021?",
      "answer":"Vaccination Program Expanded, Doctors Participation Higher"
    }
  ],
  "naturalness_scores":[
    1,
    0.5,
    0.5
  ]
}
```

---

## 4. Pipeline Example

The complete code structure of `hyper_kg_qa_pipeline.py` is shown below:

```python
from dataflow.serving import APILLMServing_request
from dataflow.utils.storage import FileStorage

from dataflow.operators.general_kg.eval.kg_qa_natural_eval import KGQANaturalEvaluator
from dataflow.operators.hyper_relation_kg import HRKGRelationTripleAttributeFilter
from dataflow.operators.hyper_relation_kg import (
    HRKGTripleExtraction,
)
from dataflow.operators.hyper_relation_kg import (
    HRKGRelationTripleSubgraphQAGeneration,
)


class HyperKGQA_APIPipeline:
    def __init__(self):
        self.storage = FileStorage(
            first_entry_file_name="../example_data/hyper_kg_qa_pipeline_input.json",
            cache_path="./cache_local",
            file_name_prefix="hyper_kg_qa_pipeline",
            cache_type="json",
        )

        self.llm_serving = APILLMServing_request(
            api_url="https://api.openai.com/v1/chat/completions",
            model_name="gpt-4o",
            max_workers=30,
        )

        self.hyper_triple_extraction_step1 = HRKGTripleExtraction(
            llm_serving=self.llm_serving,
            lang="en",
        )

        self.subgraph_filter_step2 = HRKGRelationTripleAttributeFilter(
            lang="en",
        )

        self.subgraph_qa_generation_step3 = HRKGRelationTripleSubgraphQAGeneration(
            llm_serving=self.llm_serving,
            lang="en",
            qa_type="set",
            num_q=3,
        )

        self.qa_natural_eval_step4 = KGQANaturalEvaluator(
            llm_serving=self.llm_serving,
            lang="en",
        )

    def forward(self):
        self.hyper_triple_extraction_step1.run(
            storage=self.storage.step(),
            input_key="text",
            output_key="tuple",
        )

        self.subgraph_filter_step2.run(
            storage=self.storage.step(),
            input_key="tuple",
            output_key="subgraph",
            attr_tag="<Time>",
        )

        self.subgraph_qa_generation_step3.run(
            storage=self.storage.step(),
            input_key="subgraph",
            output_key="QA_pairs",
        )

        self.qa_natural_eval_step4.run(
            storage=self.storage.step(),
            input_key="QA_pairs",
            output_key="naturalness_scores",
        )


if __name__ == "__main__":
    model = HyperKGQA_APIPipeline()
    model.forward()
```
