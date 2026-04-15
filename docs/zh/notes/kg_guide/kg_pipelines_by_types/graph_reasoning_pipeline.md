---
title: 图推理流水线
createTime: 2026/04/15 18:05:00
permalink: /zh/kg_guide/graph_reasoning_pipeline/
icon: carbon:chart-network
---

# 图推理流水线

## 1. 概述

**图推理流水线**面向“给定目标实体对，从知识图谱中搜索多跳路径并推断潜在关系”的场景。它会先在图谱中搜索连接目标实体对的多跳路径，再对路径长度做评估和过滤，最后基于保留下来的路径调用大模型生成新的关系推断结果。

该流水线适合以下任务：

- 多跳路径推理与关系补全
- 为实体对构造可解释的证据链
- 对路径长度做约束，控制推理复杂度
- 在知识图谱问答前生成关系候选

流水线的主要阶段包括：

1. **多跳路径搜索**：在 `triplet` 上搜索连接目标实体对的路径。
2. **路径长度评估**：计算每条路径的 hop 数。
3. **路径长度过滤**：保留指定长度区间的路径。
4. **关系生成**：基于过滤后的路径推断实体对之间的潜在关系。

---

## 2. 快速开始

### 第一步：创建新的 DataFlow 工作目录

```bash
mkdir run_dataflow_kg
cd run_dataflow_kg
```

### 第二步：准备脚本

将下方“流水线实例”中的代码保存为 `graph_reasoning_pipeline.py`。

脚本默认读取仓库中的测试文件：

```python
dataflow/data_for_operator_testing/graphreasoning.json
```

### 第三步：配置 API Key 与模型服务

```bash
export DF_API_KEY=sk-xxxx
```

如果需要修改最大跳数、路径长度过滤区间或模型参数，可以调整：

```python
llm_serving = APILLMServing_request(
    api_url="https://api.openai.com/v1/chat/completions",
    key_name_of_api_key="DF_API_KEY",
    model_name="gpt-4o-mini",
    max_workers=8,
    temperature=0.0,
)

pipeline = GraphReasoningPipeline(
    first_entry_file_name="dataflow/data_for_operator_testing/graphreasoning.json",
    llm_serving=llm_serving,
    cache_path="./cache_graph_reasoning",
    max_hop=4,
    min_length=2,
    max_length=3,
    lang="en",
)
```

### 第四步：一键运行

```bash
python graph_reasoning_pipeline.py
```

---

## 3. 数据流和流水线逻辑

### 1. 输入数据

该流水线至少需要以下字段：

- **triplet**：图谱三元组列表，格式为 `"<subj> ... <obj> ... <rel> ..."`。
- **target_entity**：目标实体对列表。当前实现推荐使用嵌套格式，例如 `[["Henry, Berlin"], ["Henry, Rome"]]`。

这里有一个实现细节需要注意：`KGReasoningPathSearch` 的 DataFrame 校验使用的是 `triplet` 列名，因此在流水线中也应显式传入 `input_key="triplet"`，不要写成 `triple`。

输入示例如下：

```json
[
  {
    "triplet": [
      "<subj> Henry <obj> Maria Rodriguez <rel> is_trained_by",
      "<subj> Henry <obj> Maple Leaves <rel> forms",
      "<subj> Lucy <obj> University Toronto <rel> studies_at",
      "<subj> Henry <obj> Lucy <rel> is_inspired_by",
      "<subj> Maple Leaves <obj> Berlin <rel> performs_in",
      "<subj> Maple Leaves <obj> Rome <rel> performs_in"
    ],
    "target_entity": [
      ["Henry, Berlin"],
      ["Henry, Rome"]
    ]
  }
]
```

### 2. 图推理流水线逻辑（GraphReasoningPipeline）

#### 步骤 1：多跳路径搜索（KGReasoningPathSearch）

**功能：**

- 在无向图视角下搜索连接目标实体对的所有简单路径
- 输出按“实体对 -> 路径列表”组织的 `mpath`

**输入**：`triplet`、`target_entity`  
**输出**：`mpath`

**算子运行：**

```python
self.path_search_step1.run(
    storage=self.storage.step(),
    input_key="triplet",
    output_key="mpath",
)
```

#### 步骤 2：路径长度评估（KGReasoningPathLengthEvaluator）

**功能：**

- 对每条路径计算 hop 长度
- 保留与 `mpath` 完全对齐的嵌套结构

**输入**：`mpath`  
**输出**：`mpath_length`

#### 步骤 3：路径长度过滤（KGReasoningPathLengthFilter）

**功能：**

- 过滤过短或过长的路径
- 控制后续关系推断只基于目标长度区间内的证据链

**输入**：`mpath`、`mpath_length`  
**输出**：`filtered_mpath`

#### 步骤 4：关系生成（KGReasoningRelationGeneration）

**功能：**

- 结合目标实体对和保留路径，调用 LLM 推断新关系
- 支持把候选关系约束在路径中已出现的关系集合内

**输入**：`target_entity`、`filtered_mpath`  
**输出**：`inferred_triplets`

### 3. 输出数据

常见输出字段包括：

- **mpath**：每个实体对对应的多跳路径集合
- **mpath_length**：路径长度集合
- **filtered_mpath**：过滤后的路径集合
- **inferred_triplets**：模型推断出的潜在关系

示例输出如下：

```json
{
  "mpath": [
    [
      [
        "<subj> Henry <obj> Maple Leaves <rel> forms",
        "<subj> Maple Leaves <obj> Berlin <rel> performs_in"
      ]
    ],
    [
      [
        "<subj> Henry <obj> Maple Leaves <rel> forms",
        "<subj> Maple Leaves <obj> Rome <rel> performs_in"
      ]
    ]
  ],
  "mpath_length": [
    [2],
    [2]
  ],
  "filtered_mpath": [
    [
      [
        "<subj> Henry <obj> Maple Leaves <rel> forms",
        "<subj> Maple Leaves <obj> Berlin <rel> performs_in"
      ]
    ],
    [
      [
        "<subj> Henry <obj> Maple Leaves <rel> forms",
        "<subj> Maple Leaves <obj> Rome <rel> performs_in"
      ]
    ]
  ],
  "inferred_triplets": [
    [
      [
        "<subj> Henry <obj> Berlin <rel> performs_inferred_via_band>"
      ]
    ],
    [
      [
        "<subj> Henry <obj> Rome <rel> performs_inferred_via_band>"
      ]
    ]
  ]
}
```

其中 `inferred_triplets` 的关系名称由模型生成，实际输出可能不同，上例仅用于说明结果结构。

---

## 4. 流水线实例

以下是完整的 `GraphReasoningPipeline` 代码实现。

```python
import os

from dataflow.core import LLMServingABC
from dataflow.operators.graph_reasoning import (
    KGReasoningPathLengthEvaluator,
    KGReasoningPathLengthFilter,
    KGReasoningPathSearch,
    KGReasoningRelationGeneration,
)
from dataflow.pipeline import PipelineABC
from dataflow.serving import APILLMServing_request
from dataflow.utils.storage import FileStorage


class GraphReasoningPipeline(PipelineABC):
    """Graph reasoning pipeline: target pairs -> multi-hop paths -> inferred relations."""

    def __init__(
        self,
        first_entry_file_name: str,
        llm_serving: LLMServingABC,
        cache_path: str = "./cache_local",
        file_name_prefix: str = "graph_reasoning_pipeline_step",
        cache_type: str = "json",
        lang: str = "en",
        max_hop: int = 4,
        min_length: int = 2,
        max_length: int = 4,
        restrict_to_path_rel: bool = True,
    ):
        super().__init__()
        if llm_serving is None:
            raise ValueError("llm_serving is required for GraphReasoningPipeline")

        self.storage = FileStorage(
            first_entry_file_name=first_entry_file_name,
            cache_path=cache_path,
            file_name_prefix=file_name_prefix,
            cache_type=cache_type,
        )

        self.path_search_step1 = KGReasoningPathSearch(max_hop=max_hop)
        self.path_length_step2 = KGReasoningPathLengthEvaluator()
        self.path_filter_step3 = KGReasoningPathLengthFilter(
            min_length=min_length,
            max_length=max_length,
        )
        self.relation_generation_step4 = KGReasoningRelationGeneration(
            llm_serving=llm_serving,
            restrict_to_path_rel=restrict_to_path_rel,
            lang=lang,
        )

    def forward(self):
        self.path_search_step1.run(
            storage=self.storage.step(),
            input_key="triplet",
            output_key="mpath",
        )
        self.path_length_step2.run(
            storage=self.storage.step(),
            input_key="mpath",
            output_key="mpath_length",
        )
        self.path_filter_step3.run(
            storage=self.storage.step(),
            mpath_key="mpath",
            length_key="mpath_length",
            output_path_key="filtered_mpath",
        )
        self.relation_generation_step4.run(
            storage=self.storage.step(),
            target_key="target_entity",
            path_key="filtered_mpath",
            output_key="inferred_triplets",
        )


if __name__ == "__main__":
    repo_root = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "..")
    )
    input_file = os.path.join(
        repo_root,
        "dataflow",
        "data_for_operator_testing",
        "graphreasoning.json",
    )

    llm_serving = APILLMServing_request(
        api_url="https://api.openai.com/v1/chat/completions",
        key_name_of_api_key="DF_API_KEY",
        model_name="gpt-4o-mini",
        max_workers=8,
        temperature=0.0,
    )

    pipeline = GraphReasoningPipeline(
        first_entry_file_name=input_file,
        llm_serving=llm_serving,
        cache_path="./cache_graph_reasoning",
        lang="en",
        max_hop=4,
        min_length=2,
        max_length=3,
    )
    pipeline.forward()
```
