---
title: TKGTuplePathQAGeneration
createTime: 2026/03/18 00:00:00
icon: material-symbols:bolt
permalink: /zh/kg_operators/temporal_kg/generate/tkgtuplepathqageneration/
---

## 📚 概述

[TKGTuplePathQAGeneration](https://github.com/ZhP-Li197/DataFlow-KG/tree/main/dataflow/operators/temporal_kg/generate/tkg_rel_4tuple_path_qa_generator.py) 是一个基于大语言模型（LLM）从时序知识图谱关系四元组多跳路径生成问答对的算子。它接收多跳路径数据，通过 LLM 生成结构化的时序问答对。该算子支持四种问答生成模式：时间点问答、事件顺序问答、时间先后比较问答和时间区间问答。与子图问答算子不同，本算子的输入和输出列名会根据跳数参数动态生成，适用于基于路径推理的时序问答场景。

## ✒️ `__init__` 函数

```python
def __init__(self, llm_serving: LLMServingABC, seed: int = 0, lang: str = "en", hop: int = 2, qa_type: str = "time_point", num_q: int = 5):
```

### 参数

| 参数名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| **llm_serving** | LLMServingABC | 必需 | 大语言模型服务实例。 |
| **seed** | int | 0 | 随机种子。 |
| **lang** | str | "en" | 语言设置，支持 "en" 或 "zh"。 |
| **hop** | int | 2 | 跳数。影响输入/输出列名：当 hop > 1 时输入列为 `{hop}_{input_key_meta}`，hop == 1 时输入列为 `"tuple"`。输出列始终为 `{hop}_{output_key_meta}`。 |
| **qa_type** | str | "time_point" | QA 类型，可选值：`"time_point"`、`"event_order"`、`"time_order"`、`"time_interval"`。 |
| **num_q** | int | 5 | 预期生成的 QA 对数量。 |

### Prompt 模板说明

根据 `qa_type` 自动选择 prompt 模板（与 TKGTupleSubgraphQAGeneration 共用同一组关系四元组 prompt）：

| qa_type | Prompt 类 | 主要用途 |
| --- | --- | --- |
| time_point | TKGTupleTimePointQAGenerationPrompt | 问具体时间，答案为四元组中的时间值 |
| event_order | TKGTupleEventOrderQAGenerationPrompt | 问事件之后发生了什么，答案为后续事件 |
| time_order | TKGTupleTimeOrderQAGenerationPrompt | 两两事件比较先后，答案为更早的事件 |
| time_interval | TKGTupleTimeIntervalQAGenerationPrompt | 问时间区间内发生了什么，答案为区间内事件 |

默认 prompt（qa_type="time_point"）与 TKGTupleSubgraphQAGeneration 相同，详见该算子文档。

## 💡 `run` 函数

```python
def run(self, storage: DataFlowStorage = None, input_key_meta: str = "hop_paths", output_key_meta: str = "QA_pairs"):
```

实际读取的输入列名：当 `hop > 1` 时为 `{hop}_{input_key_meta}`（如 `2_hop_paths`），当 `hop == 1` 时为 `"tuple"`。输出列名始终为 `{hop}_{output_key_meta}`（如 `2_QA_pairs`）。

#### 参数

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| **storage** | DataFlowStorage | None | 数据流存储实例，负责读取与写入数据。 |
| **input_key_meta** | str | "hop_paths" | 输入列名元信息。 |
| **output_key_meta** | str | "QA_pairs" | 输出列名元信息。 |

## 🤖 示例用法

```python
from dataflow.operators.temporal_kg.generate import TKGTuplePathQAGeneration
from dataflow.utils.storage import FileStorage
from dataflow.utils.llm_serving import APILLMServing_request

storage = FileStorage(first_entry_file_name="tkg_rel_qa.json")

llm_serving = APILLMServing_request(
    api_url="http://<your_llm_api_endpoint>",
    model_name="<your_model_name>",
)

generator = TKGTuplePathQAGeneration(
    llm_serving=llm_serving,
    hop=2,
    qa_type="time_point",
    lang="en",
)
generator.run(
    storage.step(),
    input_key_meta="hop_paths",
    output_key_meta="QA_pairs",
)
```

#### 默认输出格式

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| **2_hop_paths** | str | 输入的多跳路径字符串（保留，列名随 hop 变化）。 |
| **2_QA_pairs** | List[Dict] | 生成的 QA 对列表，每个元素包含 `question` 和 `answer`（列名随 hop 变化）。 |

**示例输入：**

```json
{
  "2_hop_paths": "⟨subj⟩ Elon Musk ⟨obj⟩ SpaceX ⟨rel⟩ founded ⟨time⟩ 2002 || ⟨subj⟩ SpaceX ⟨obj⟩ ISS ⟨rel⟩ first commercial spacecraft docking with ⟨time⟩ 2012"
}
```

**示例输出（hop=2, qa_type="time_point"）：**

```json
{
  "2_hop_paths": "...",
  "2_QA_pairs": [
    {
      "question": "When did Elon Musk found SpaceX?",
      "answer": "2002"
    },
    {
      "question": "When did SpaceX first dock a commercial spacecraft with the ISS?",
      "answer": "2012"
    }
  ]
}
```