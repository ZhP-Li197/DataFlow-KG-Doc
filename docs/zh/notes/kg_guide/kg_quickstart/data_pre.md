---
title: 数据准备
createTime: 2026/04/20 18:07:41
permalink: /zh/kg_guide/data_pre/
icon: solar:clapperboard-open-bold-duotone
---
# 数据准备：从原始PDF文档到可供 DataFlow-KG 算子处理的文本

本节介绍如何将原始 PDF 整理成 **可接入 DataFlow-KG 算子的数据形式**，即面对结构复杂、格式不统一的 PDF，应该如何完成文本提取、内容规整与分块，最终得到适合后续知识清洗、问答构建或训练数据生成的**标准化输入**。我们继承了 DataFlow 对于PDF的处理。

## 1. 整体思路

在实际使用 DataFlow-KG 算子时，原始 PDF 往往不能直接拿来处理，常见原因包括：

- 文档内部混有标题、正文、页眉页脚、表格、图片说明等多种内容；
- 不同 PDF 的版式差异很大，直接抽取出的文本噪声较多；
- 单篇文档通常过长，不适合直接进入后续算子；
- 缺少统一的数据格式，不利于串联清洗、抽取、构图或问答流程。

我们继承了 DataFlow 对于PDF 文档的处理。这里，PDF 文档处理通常分成两步： 
1. **信息提取**：使用 FileOrURLToMarkdownConverterLocal 调用 MinerU，将原始 PDF 转成 Markdown。 
2. **文本分块**：使用 KBCChunkGenerator 将长文本切成较小片段，输出为 JSON，供后续流程继续使用。 这种做法的优势是：先把异构 PDF 统一成结构化较强的 Markdown，再按 token、字符、句子或语义等方式切块，便于后续检索与建库。

**原始 PDF -> 统一文本表示 -> 可处理的文本块**


## 2. 安装与环境准备 

本系统中对PDF的提取依赖MinerU模型，需要通过以下方式额外安装

```bash
conda create -n dfkg python=3.10
conda activate dfkg
git clone https://github.com/OpenDCAI/DataFlow-KG.git
cd DataFlow-KG
pip install -e .
pip install 'mineru[all]'
```

你也可以通过以下命令在本地运行MinerU模型：
```bash
mineru-models-download --help
mineru-models-download
```

安装完成后，即可在本地调用 MinerU 对 PDF 做识别解析。

注意事项： 
#### 2.1 选择下载源 
可选来源包括： - huggingface - modelscope 文档更推荐使用 modelscope，因为下载体验通常更稳定。 
#### 2.2 选择 MinerU 版本 
文档中区分了两类模型： 
- **MinerU1 / pipeline**：传统流水线方式，速度相对较慢，但显存要求较低。 
- **MinerU2.5 / vlm**：基于 VLM 的方式，解析速度更快，但显存要求更高。 如果机器资源允许，通常优先考虑 vlm 路线；如果本地显存有限，则可以选 pipeline。 模型下载完成后，模型路径会写入用户目录下的 mineru.json，后续可以直接在算子中引用。 


## 3. PDF处理

### 3.1 从PDF到Markdown

在 DataFlow-KG 中，可使用 FileOrURLToMarkdownConverterLocal 算子完成对MinerU的调用。该算子的作用是： 
- 输入：本地 PDF 文件或 URL 
- 输出：解析后的 Markdown 文本 

这是流程里非常关键的一步，因为后续清洗、切块、构建知识库，都是围绕统一的 Markdown 结果展开。 

示例代码

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
参数说明：
- intermediate_dir：中间结果保存目录 
- mineru_backend：选择 MinerU 的解析后端 -
- mineru_source：模型来源；本地模型一般设为 local 
- mineru_model_path：本地模型目录 
- mineru_download_model_type：模型类型 
 
### 3.2 从Markdown到Chunk 

完成 PDF 识别后，下一步是分块。DataFlow-KG 中使用的算子是 KBCChunkGenerator。 该算子的输入与输出为： 
- 输入：提取后的 Markdown 文本 
- 输出：分块后的 JSON 文件 

它支持多种切分维度： - token - character - sentence - semantic 如果目标是后续做大模型训练、RAG 检索或知识清洗，通常可以先从 token 分块开始。 
示例代码
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
参数说明：
- split_method：分块方式，例如 token
- chunk_size：每块大小，例如 512 
- tokenizer_name：用于 token 切分的分词器 
- input_file：上一步 MinerU 生成的 Markdown 文本 
- output_key：输出字段名