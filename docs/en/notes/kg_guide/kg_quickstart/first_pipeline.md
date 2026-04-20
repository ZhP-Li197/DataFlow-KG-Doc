---
title: First Pipeline
icon: material-symbols:route
createTime: 2026/04/14 19:00:00
permalink: /en/kg_guide/kg_quickstart/first_pipeline/
---

# Quick Start – Your First Pipeline

Here is a minimal DataFlow pipeline that allows you to use the same prompt to drive a large language model to transform your batch inputs. You can copy it and run it directly.

## 1. Code for the First Pipeline

```python
# Text2KGPipeline.py
import sys
from pathlib import Path
from dataflow.pipeline import PipelineABC
from dataflow.utils.storage import FileStorage
from dataflow.serving import APILLMServing_request
from dataflow.operators.general_kg.generate.kg_entity_extractor import KGEntityExtraction
from dataflow.operators.general_kg.generate.kg_triple_extractor import KGTripleExtraction
from dataflow.operators.general_kg.refinement.kg_tuple_normalization import KGTupleNormalization


class Text2KGPipeline(PipelineABC):
    def __init__(self):
        super().__init__()
        self.storage = FileStorage(
            first_entry_file_name="/input.json"
        )
        self.llm_serving = APILLMServing_request(
            api_url="https://api.openai.com/v1/chat/completions",
            key_name_of_api_key="OPENAI_API_KEY",
            model_name="gpt-4o",
            max_workers=4,
            temperature=0.0,
        )
        self.entity_extractor = KGEntityExtraction(
            llm_serving=self.llm_serving,
            lang="en",
        )
        self.triple_extractor = KGTripleExtraction(
            llm_serving=self.llm_serving,
            lang="en",
            triple_type="relation",
        )
        self.triple_normalizer = KGTupleNormalization(
            llm_serving=self.llm_serving,
            lang="en",
        )
    def forward(self):
        self.entity_extractor.run(
            storage=self.storage.step(),
            input_key="text",
            output_key="entity",
        )
        self.triple_extractor.run(
            storage=self.storage.step(),
            input_key="text",
            input_key_meta="entity",
            output_key="triple",
        )
        self.triple_normalizer.run(
            storage=self.storage.step(),
            input_key="triple",
            output_key="normalized_triple",
        )


if __name__ == "__main__":
    pipeline = Text2KGPipeline()
    pipeline.compile()
    pipeline.forward()
```

##2.  Dataset Preparation

You need to prepare a dataset. Create a file named `./input.json` and fill it with some test data. Here is an out-of-the-box question set:

```json
[
    {
        "doc_id": "demo-1", 
        "text": "Marie Curie was a physicist and chemist. She was born in Warsaw. Pierre Curie was her husband and research partner. Together they conducted pioneering research on radioactivity."
    }
]
```

## 3. API_KEY Preparation

Since the pipeline above uses an API-based large language model, you need to provide the corresponding `api_url` and secret key. For security reasons, you should export the `DF_API_KEY` environment variable instead of writing the key directly into code.

Linux:

```shell
export DF_API_KEY=sh-xxxxx
```

Windows CMD:

```cmd
set DF_API_KEY=sh-xxxxx
```

PowerShell:

```powershell
$env:DF_API_KEY = "sh-xxxxx"
```

After setting it up, the program can read the API key from the environment. Make sure not to expose the key in public code.

## 4. Run the Pipeline

You only need to run the Python file above:

```shell
python Text2KGPipeline.py
```

The output will look like this:

```text
$ python ./Text2KGPipeline.py
2026-04-15 12:34:38.156 | INFO     | DataFlow:Pipeline.py:compile:51 - Compiling pipeline and validating key integrity across 3 operator runtimes.
2026-04-15 12:34:38.156 | INFO     | DataFlow:storage.py:read:520 - Reading data from demo_data/kg_text_input.json with type dataframe
2026-04-15 12:34:38.156 | INFO     | DataFlow:storage.py:read:524 - Reading remote dataset from demo_data/kg_text_input.json with type dataframe
2026-04-15 12:34:38.158 | INFO     | DataFlow:storage.py:read:520 - Reading data from demo_data/kg_text_input.json with type dataframe
2026-04-15 12:34:38.158 | INFO     | DataFlow:storage.py:read:524 - Reading remote dataset from demo_data/kg_text_input.json with type dataframe
Generating......: 100%|███████████████████████████| 1/1 [00:02<00:00,  2.40s/it]
Extracting entities: 100%|████████████████████████| 1/1 [00:02<00:00,  2.40s/it]
2026-04-15 12:34:40.575 | SUCCESS  | DataFlow:storage.py:write:622 - Writing data to demo_output/kg_pipeline_cache/kg_demo_pipeline_step1.json with type json
2026-04-15 12:34:40.578 | INFO     | DataFlow:kg_entity_extractor.py:run:117 - Results saved to demo_output/kg_pipeline_cache/kg_demo_pipeline_step1.json
2026-04-15 12:34:40.578 | INFO     | DataFlow:storage.py:read:520 - Reading data from demo_output/kg_pipeline_cache/kg_demo_pipeline_step1.json with type dataframe
2026-04-15 12:34:40.581 | INFO     | DataFlow:kg_triple_extractor.py:_construct_examples:176 - Starting triple extraction...
Generating......: 100%|███████████████████████████| 1/1 [00:05<00:00,  5.28s/it]
Extract triples: 100%|████████████████████████████| 1/1 [00:05<00:00,  5.28s/it]
2026-04-15 12:34:45.861 | SUCCESS  | DataFlow:storage.py:write:622 - Writing data to demo_output/kg_pipeline_cache/kg_demo_pipeline_step2.json with type json
2026-04-15 12:34:45.863 | INFO     | DataFlow:kg_triple_extractor.py:run:162 - Results saved to demo_output/kg_pipeline_cache/kg_demo_pipeline_step2.json
2026-04-15 12:34:45.863 | INFO     | DataFlow:storage.py:read:520 - Reading data from demo_output/kg_pipeline_cache/kg_demo_pipeline_step2.json with type dataframe
2026-04-15 12:34:45.866 | INFO     | DataFlow:kg_tuple_normalization.py:_validate_dataframe:151 - Using input column 'triple' and output column 'normalized_triple'
2026-04-15 12:34:45.866 | INFO     | DataFlow:kg_tuple_normalization.py:_construct_examples:93 - Starting attribute normalization...
Generating......: 100%|███████████████████████████| 1/1 [00:02<00:00,  2.96s/it]
Normalize attributes: 100%|███████████████████████| 1/1 [00:02<00:00,  2.96s/it]
2026-04-15 12:34:48.834 | SUCCESS  | DataFlow:storage.py:write:622 - Writing data to demo_output/kg_pipeline_cache/kg_demo_pipeline_step3.json with type json
2026-04-15 12:34:48.835 | INFO     | DataFlow:kg_tuple_normalization.py:run:172 - Results saved to demo_output/kg_pipeline_cache/kg_demo_pipeline_step3.json
```

After that, you can find the output file in the default output directory `./demo_output/`. This file is the result of one DataFlow execution step:

```json
{
    "doc_id":"demo-1",
    "raw_chunk":"Marie Curie was a physicist and chemist. She was born in Warsaw. Pierre Curie was her husband and research partner. Together they conducted pioneering research on radioactivity.",
    "entity":"Marie Curie, Pierre Curie, Warsaw, radioactivity",
    "triple":["<subj> Marie Curie <obj> Warsaw <rel> is_born_in>","<subj> Marie Curie <obj> Pierre Curie <rel> is_married_to>","<subj> Marie Curie <obj> Pierre Curie <rel> is_research_partner_of>","<subj> Marie Curie <obj> radioactivity <rel> conducts_research_on>","<subj> Pierre Curie <obj> radioactivity <rel> conducts_research_on>"],
    "normalized_triple":["<subj> Marie Curie <obj> Warsaw <rel> is_born_in>","<subj> Marie Curie <obj> Pierre Curie <rel> is_married_to>","<subj> Marie Curie <obj> Pierre Curie <rel> is_research_partner_of>","<subj> radioactivity <obj> Marie Curie <rel> is_researched_by>","<subj> radioactivity <obj> Pierre Curie <rel> is_researched_by>"]
}
```

With this, you have completed the simplest operation of using DataFlow to perform batch inference on a set of content.

## 5. Detailed Explanation: LLMServing Classes

If you do not have access to an API but do have your own GPU, we recommend using a local LLMServing for inference. The available Serving classes are mainly located under `dataflow/serving/`.

The local model serving implementations are mainly `LocalModelLLMServing_vllm` and `LocalModelLLMServing_sglang` in `local_model_llm_serving.py`, which use vLLM and SGLang as inference backends. For example:

```python
class LocalModelLLMServing_vllm(LLMServingABC):
    '''
    A class for generating text using vllm, with model from huggingface or local directory
    '''
    def __init__(
        self,
        hf_model_name_or_path: str = None,
        hf_cache_dir: str = None,
        hf_local_dir: str = None,
        vllm_tensor_parallel_size: int = 1,
        vllm_temperature: float = 0.7,
        vllm_top_p: float = 0.9,
        vllm_max_tokens: int = 1024,
        vllm_top_k: int = 40,
        vllm_repetition_penalty: float = 1.0,
        vllm_seed: int = None,
        vllm_max_model_len: int = None,
        vllm_gpu_memory_utilization: float = 0.9,
    ):
```

Parameters prefixed with `hf_` mainly describe the model name, cache path, and other Hugging Face related settings. Parameters prefixed with `vllm_` are the built-in vLLM engine parameters. Fill them according to your GPU setup and model requirements to enable local inference. The same idea applies to SGLang.

To use a local model, import the corresponding local Serving class at the top of your Python script and replace the API serving in the sample pipeline.

## 6. Detailed Explanation: Storage Classes

The Storage classes in DataFlow are defined in `dataflow.utils.storage`. The main ones are:

- `FileStorage`
- `LazyFileStorage`

`FileStorage` uses a Pandas `DataFrame` internally to organize data. Operators read and write data by receiving the storage object in their `run` method. Storage is the bridge that connects operators and carries data through the pipeline.

By default, `FileStorage` writes the current `DataFrame` to the file system after every operator step. It provides the following parameters:

```python
class FileStorage(DataFlowStorage):
    """
    Storage for file system.
    """
    def __init__(
        self,
        first_entry_file_name: str,
        cache_path: str = "./cache",
        file_name_prefix: str = "dataflow_cache_step",
        cache_type: Literal["json", "jsonl", "csv", "parquet", "pickle"] = "jsonl",
    ):
```

The meaning of each parameter is:

- `first_entry_file_name`: Path to the input file. If this is an empty string, an empty `DataFrame` will be provided by default.
- `cache_path`: Directory where each operator step writes its output, which is also where the pipeline's temporary files are stored.
- `file_name_prefix`: Filename prefix for intermediate files generated after each operator step.
- `cache_type`: File type used for intermediate outputs. Supported values include `"json"`, `"jsonl"`, `"csv"`, `"parquet"`, and `"pickle"`.

If writing an intermediate file after every step puts too much pressure on storage, you can switch to `LazyFileStorage`, which only saves the final output.