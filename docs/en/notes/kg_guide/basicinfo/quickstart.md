---
title: quickstart
createTime: 2026/04/02 15:51:20
permalink: /en/kg_guide/basicinfo/quickstart/
---
# Quick Start - dfkg init

DataFlow-KG adopts a usage pattern of code generation + custom modification + running scripts. That is, by calling via the command line, it automatically generates default execution scripts and entry Python files. After user-customized modifications (such as changing datasets, using different LLM APIs, rearranging operators, or adding your own personalized pipeline), running this Python file will execute the corresponding functions.

You only need three steps to run our provided Pipeline.

## 1. Initialize the Project

Run the following in an empty directory:

```shell
dfkg init
```

This will generate the following folders in your current working directory:

```shell
$ tree -L 1
.
|-- api_pipelines
|-- core_text
|-- cpu_pipelines
|-- example_data
|-- gpu_pipelines
|-- playground
`-- simple_text_pipelines
```

**Directory Purposes:**
* `cpu_pipelines`: Pipelines that only use CPU
* `core_text`: Examples of the most basic operators in DataFlow-KG
* `api_pipelines`: Uses online LLM APIs (Recommended for beginners)
* `gpu_pipelines`: Uses local GPU models
* `example_data`: Default input data for all example Pipelines
* `playground`: Lightweight examples, not constituting a complete Pipeline
* `simple_text_pipelines`: Examples related to basic text processing

## 2. Pipeline Classification (Choose one)

Pipelines with the same name in different directories have an inclusive relationship:

| Directory | Dependent Resources |
| :--- | :--- |
| `cpu_pipelines` | CPU only |
| `api_pipelines` | CPU + LLM API |
| `gpu_pipelines` | CPU + API + Local GPU |

> **Note:** For beginners, it is highly recommended to start directly from `api_pipelines`! Later, if you have a GPU, you only need to change `LLMServing` to a local model.

## 3. Run Your First Pipeline

Enter any Pipeline directory, for example:

```shell
cd api_pipelines
```

Open the Python file within it. You typically only need to focus on two configurations:

### (1) Input Data Path

```python
self.storage = FileStorage(
    first_entry_file_name="<path_to_dataset>"
)
```

This defaults to the sample dataset we provide and can be run directly. You can change it to your own dataset path to infer your own data.

### (2) LLM Serving

If you are using an API, you first need to set the environment variable:

**Linux / macOS**
```shell
export DF_API_KEY=sk-xxxxx
```

**Windows CMD**
```cmd
set DF_API_KEY=sk-xxxxx
```

**PowerShell**
```powershell
$env:DF_API_KEY="sk-xxxxx"
```

Then simply run the script directly:

```shell
python xxx_pipeline.py
```

## 4. Multi-API Serving (Optional)

If you need to use multiple LLM APIs simultaneously, you can specify different environment variable names for each Serving:

```python
llm_serving_openai = APILLMServing_request(
    api_url="[https://api.openai.com/v1/chat/completions](https://api.openai.com/v1/chat/completions)",
    key_name_of_api_key="OPENAI_API_KEY",
    model_name="gpt-4o"
)

llm_serving_deepseek = APILLMServing_request(
    api_url="[https://api.deepseek.com/v1/chat/completions](https://api.deepseek.com/v1/chat/completions)",
    key_name_of_api_key="DEEPSEEK_API_KEY",
    model_name="deepseek-chat"
)
```

Then, simply export the corresponding field names in your environment variables (e.g., `export OPENAI_API_KEY=sk-xxxxx`) to achieve Multi-API Serving coexistence.

## 5. Add Custom Pipeline Templates (Optional)

If you wish to solidify your own Pipeline into a standard template that generates automatically every time you execute the initialization operation, you can do so by modifying the static folder in the source code:

1. **Enter the template directory**: In the DataFlow-KG source code repository, find and enter the `dataflow/statics/pipelines/api_pipelines` folder.
2. **Insert custom script**: Place your own `your_custom_pipeline.py` file into this directory.
3. **Update local installation**: Return to the root directory of the DataFlow-KG repository and execute the following command to make the modifications take effect in your local environment:
   ```shell
   pip install -e .
   ```
4. **Re-initialize**: Run `dfkg init` again in the new directory where you want to work, and your custom Pipeline script will be automatically generated in the corresponding initialization folder, just like a pre-packaged meal.