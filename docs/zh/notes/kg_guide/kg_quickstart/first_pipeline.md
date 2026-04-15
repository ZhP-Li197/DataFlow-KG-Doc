---
title: 第一条流水线
icon: material-symbols:route
createTime: 2026/04/14 19:00:00
permalink: /zh/kg_guide/kg_quickstart/first_pipeline/
---

# 快速上手-第一个Pipeline

以下是一个 DataFlow 最简的 pipeline，它可以让你用同一个 prompt 来驱动大模型转化你的批量输入。你可以直接拷贝下来运行。

## 第一个Pipeline的代码

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

## 数据集准备

你需要准备相应的数据集。可以创建一个名为 `./input.json` 的文件，并填入一些测试数据，下面是一个可以直接使用的问题集合：

```json
[
    {
        "doc_id": "demo-1", 
        "text": "Marie Curie was a physicist and chemist. She was born in Warsaw. Pierre Curie was her husband and research partner. Together they conducted pioneering research on radioactivity."
    }
]
```

## API_KEY准备

上面的 pipeline 使用了基于 API 的大模型，所以你需要填入相应的 `api_url` 和密钥。为了安全，建议通过环境变量暴露 `DF_API_KEY`，这样可以避免把 key 直接写进 GitHub 仓库。

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

设置完成后，程序就可以从环境中读取 API 密钥。请不要把密钥暴露在公开代码中。

## 运行Pipeline

你只需要运行上面的 Python 文件：

```shell
python mypipeline.py
```

运行结果类似这样：

```text
$ python ./mypipeline.py
2025-12-22 17:23:37.767 | INFO     | DataFlow:registry.py:__getattr__:358 - Lazyloader ['dataflow/operators/core_text/'] trying to import PromptedGenerator
storage POSITIONAL_OR_KEYWORD
input_key POSITIONAL_OR_KEYWORD
output_key POSITIONAL_OR_KEYWORD
2025-12-22 17:23:37.768 | INFO     | DataFlow:Pipeline.py:compile:51 - Compiling pipeline and validating key integrity across 1 operator runtimes.
2025-12-22 17:23:37.769 | INFO     | DataFlow:storage.py:read:477 - Reading data from ./input.json with type dataframe
2025-12-22 17:23:37.769 | INFO     | DataFlow:storage.py:read:481 - Reading remote dataset from ./input.json with type dataframe
2025-12-22 17:23:37.772 | INFO     | DataFlow:prompted_generator.py:run:57 - Running PromptGenerator...
2025-12-22 17:23:37.772 | INFO     | DataFlow:storage.py:read:477 - Reading data from ./input.json with type dataframe
2025-12-22 17:23:37.772 | INFO     | DataFlow:storage.py:read:481 - Reading remote dataset from ./input.json with type dataframe
2025-12-22 17:23:37.774 | INFO     | DataFlow:prompted_generator.py:run:61 - Loading, number of rows: 3
2025-12-22 17:23:37.774 | INFO     | DataFlow:prompted_generator.py:run:75 - Generating text using the model...
Generating......: 100%|██████████████████████████████████████████████████████████████████████████████████████████| 3/3 [00:06<00:00,  2.13s/it]
2025-12-22 17:23:44.171 | INFO     | DataFlow:prompted_generator.py:run:80 - Text generation completed.
2025-12-22 17:23:44.172 | SUCCESS  | DataFlow:logger.py:success:12 - Writing data to ./df_cache/dataflow_cache_step_step1.json with type json



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

随后你可以在默认输出目录 `./demo_output/` 下看到输出文件，它就是 DataFlow 一步运行后的结果：

```json
{
    "doc_id":"demo-1",
    "raw_chunk":"Marie Curie was a physicist and chemist. She was born in Warsaw. Pierre Curie was her husband and research partner. Together they conducted pioneering research on radioactivity.",
    "entity":"Marie Curie, Pierre Curie, Warsaw, radioactivity",
    "triple":["<subj> Marie Curie <obj> Warsaw <rel> is_born_in>","<subj> Marie Curie <obj> Pierre Curie <rel> is_married_to>","<subj> Marie Curie <obj> Pierre Curie <rel> is_research_partner_of>","<subj> Marie Curie <obj> radioactivity <rel> conducts_research_on>","<subj> Pierre Curie <obj> radioactivity <rel> conducts_research_on>"],
    "normalized_triple":["<subj> Marie Curie <obj> Warsaw <rel> is_born_in>","<subj> Marie Curie <obj> Pierre Curie <rel> is_married_to>","<subj> Marie Curie <obj> Pierre Curie <rel> is_research_partner_of>","<subj> radioactivity <obj> Marie Curie <rel> is_researched_by>","<subj> radioactivity <obj> Pierre Curie <rel> is_researched_by>"]
}
```

这样就完成了使用 DataFlow 批量推理一组内容的最简操作。

## 详解：LLMServing类

如果你没有 API，但是有自己的显卡，我们更推荐你使用本地 LLMServing 进行推理。DataFlow 中可用的 Serving 类主要位于 `dataflow/serving/`。

本地模型主要是 `local_model_llm_serving.py` 里的 `LocalModelLLMServing_vllm` 和 `LocalModelLLMServing_sglang` 两个类，它们分别使用 vLLM 和 SGLang 作为推理后端。以 vLLM 为例：

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

带 `hf_` 前缀的参数主要描述模型名、缓存路径等 Hugging Face 相关设置；带 `vllm_` 前缀的参数则是 vLLM 引擎自己的参数。你只需要按显卡数量和模型需求填入相关参数，就可以实现本地模型推理，SGLang 也是同理。

使用时，直接在 Python 脚本顶部引入对应的本地 Serving 类，再把上面示例里的 API Serving 替换掉即可。

## 详解：Storage类

`dataflow.utils.storage` 中存放着 DataFlow 的 Storage 类，主要包括：

- `FileStorage`
- `LazyFileStorage`

`FileStorage` 内部使用 Pandas 的 `DataFrame` 来组织数据。算子通过在 `run` 函数中传入 storage 完成数据读写，storage 是串联算子、传递数据的桥梁，所有算子都需要和 storage 交互。

默认的 `FileStorage` 会在每一个算子 step 后把当前 `DataFrame` 的所有数据输出到文件系统。它提供了如下参数：

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

各参数的含义如下：

- `first_entry_file_name`：输入入口文件路径。如果这里传入空字符串，则默认给算子提供一个空的 `DataFrame`。
- `cache_path`：每个算子 step 输出数据的目录，也就是整个 pipeline 临时文件的保存路径。
- `file_name_prefix`：每个算子 step 输出中间文件时使用的文件名前缀。
- `cache_type`：每个算子 step 输出的中间文件类型，支持 `"json"`、`"jsonl"`、`"csv"`、`"parquet"` 和 `"pickle"`。

如果你的场景里每一步都落一个中间文件会给存储带来较大压力，可以改用 `LazyFileStorage`，它只会保存最终输出文件。
