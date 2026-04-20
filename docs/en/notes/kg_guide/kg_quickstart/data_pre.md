---
title: Data Preparation
createTime: 2026/04/20 18:07:41
permalink: /en/kg_guide/data_pre/
icon: solar:clapperboard-open-bold-duotone
---
# Data Preparation: From Raw PDF Documents to Text Processable by DataFlow-KG Operators

This section introduces how to convert raw PDF documents into a **data format that can be used by DataFlow-KG operators**. In other words, when facing PDFs with complex structures and inconsistent formatting, we need to perform text extraction, content normalization, and chunking so as to obtain **standardized input** suitable for downstream knowledge cleaning, QA construction, or training data generation. We inherit DataFlow’s PDF processing pipeline.

## 1. Overall Workflow

When using DataFlow-KG operators in practice, raw PDF files usually cannot be directly processed. Common reasons include:

- Documents contain multiple types of content, such as titles, main text, headers and footers, tables, and image captions;
- Different PDFs have very different layouts, and directly extracted text often contains substantial noise;
- A single document is usually too long to be fed directly into downstream operators;
- There is no unified data format, making it difficult to chain cleaning, extraction, graph construction, or QA workflows.

We inherit DataFlow’s processing pipeline for PDF documents. Here, PDF processing is typically divided into two steps:
1. **Information Extraction**: Use `FileOrURLToMarkdownConverterLocal` to call MinerU and convert the raw PDF into Markdown.
2. **Text Chunking**: Use `KBCChunkGenerator` to split long text into smaller segments and output them in JSON format for subsequent processing.

The advantage of this approach is that it first converts heterogeneous PDFs into relatively well-structured Markdown, and then chunks the text by token, character, sentence, or semantic unit, making downstream retrieval and knowledge base construction more convenient.

**Raw PDF -> Unified Text Representation -> Processable Text Chunks**

## 2. Installation and Environment Setup

PDF extraction in this system depends on the MinerU model, which needs to be installed separately as follows:

```bash
conda create -n dfkg python=3.10
conda activate dfkg
git clone https://github.com/OpenDCAI/DataFlow-KG.git
cd DataFlow-KG
pip install -e .
pip install 'mineru[all]'
```

You can also run the MinerU model locally using the following commands:

```bash
mineru-models-download --help
mineru-models-download
```

After installation, MinerU can be called locally to recognize and parse PDF files.

Notes:

#### 2.1 Select a Download Source

Available sources include:
- `huggingface`
- `modelscope`

The documentation recommends `modelscope`, since the download experience is usually more stable.

#### 2.2 Select a MinerU Version

The documentation distinguishes between two types of models:

- **MinerU1 / pipeline**: A traditional pipeline-based approach, relatively slower but with lower GPU memory requirements.
- **MinerU2.5 / vlm**: A VLM-based approach, faster in parsing but requiring more GPU memory.

If hardware resources allow, the `vlm` route is usually preferred; if local GPU memory is limited, `pipeline` is a better choice. After the model is downloaded, the model path will be written into the `mineru.json` file under the user directory and can then be directly referenced by the operator.

## 3. PDF Processing

### 3.1 From PDF to Markdown

In DataFlow-KG, the `FileOrURLToMarkdownConverterLocal` operator can be used to invoke MinerU. Its function is:
- Input: local PDF file or URL
- Output: parsed Markdown text

This is a very important step in the pipeline, because subsequent cleaning, chunking, and knowledge base construction are all based on the unified Markdown result.

Example code:

```python
self.knowledge_cleaning_step1 = FileOrURLToMarkdownConverterLocal(
    intermediate_dir="intermediate",
    mineru_backend="vlm-auto-engine",
    mineru_source="local",
    mineru_model_path="<path_to_local>/MinerU2.5-2509-1.2B",
    mineru_download_model_type="vlm"
)

self.knowledge_cleaning_step1.run(
    storage=self.storage.step(),
    # input_key=,
    # output_key=,
)
```

Parameter description:
- `intermediate_dir`: directory for saving intermediate results
- `mineru_backend`: MinerU parsing backend
- `mineru_source`: model source; for a local model, this is usually set to `local`
- `mineru_model_path`: local model directory
- `mineru_download_model_type`: model type

### 3.2 From Markdown to Chunks

After PDF recognition is completed, the next step is chunking. In DataFlow-KG, the operator used for this is `KBCChunkGenerator`. Its input and output are:
- Input: extracted Markdown text
- Output: chunked JSON file

It supports multiple splitting dimensions:
- `token`
- `character`
- `sentence`
- `semantic`

If the goal is downstream LLM training, RAG retrieval, or knowledge cleaning, it is usually recommended to start with token-based chunking.

Example code:

```python
text_splitter = KBCChunkGenerator(
    split_method="token",
    chunk_size=512,
    tokenizer_name="Qwen/Qwen2.5-7B-Instruct",
)

text_splitter.run(
    storage=self.storage.step(),
    input_file=extracted,
    output_key="raw_content",
)
```

Parameter description:
- `split_method`: chunking method, e.g., `token`
- `chunk_size`: size of each chunk, e.g., `512`
- `tokenizer_name`: tokenizer used for token-based splitting
- `input_file`: the Markdown text generated by MinerU in the previous step
- `output_key`: output field name
