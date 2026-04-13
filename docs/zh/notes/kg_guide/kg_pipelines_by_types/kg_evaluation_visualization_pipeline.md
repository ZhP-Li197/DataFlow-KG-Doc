---
title: 知识图谱评测与可视化流水线
createTime: 2026/04/12 17:00:00
permalink: /zh/kg_guide/kg_evaluation_visualization_pipeline/
icon: carbon:chart-network
---

# 知识图谱评测与可视化流水线

## 1. 概述

**知识图谱评测与可视化流水线**面向通用知识图谱（General KG）的质量分析与结果展示场景，支持对抽取得到的三元组图谱进行多维度评测，并进一步生成可交互的图谱可视化结果。该流水线适用于图谱构建质量检查、图谱清洗前的统计分析、图谱结构诊断与展示等任务。

我们支持以下应用场景：

- 通用知识图谱抽取结果的质量评测
- 图谱结构连通性与规模分析
- 基于大模型的三元组一致性与语义强度评测
- 交互式知识图谱可视化展示

流水线的主要流程包括：

1. **拓扑结构评测**：分析图谱整体拓扑特征，如连通分量、平均度、碎片化程度等。
2. **子图规模评测**：统计图谱的节点数、边数与稠密度等规模指标。
3. **子图连通性评测**：计算点连通度、边连通度和全局效率等连通性指标。
4. **三元组一致性评测**：基于大模型判断三元组是否符合基本逻辑与语义一致性。
5. **三元组语义强度评分**：结合原始文本和三元组内容，评估关系表达强度。
6. **知识图谱可视化**：将三元组渲染为交互式图结构，并导出为 HTML 文件。

---

## 2. 快速开始

### 第一步：创建新的 DataFlow 工作文件夹

```bash
mkdir run_dataflow_kg
cd run_dataflow_kg
```

### 第二步：准备脚本

将下文“流水线示例”中的代码保存为 `kg_evaluation_visualization_pipeline.py`。

### 第三步：配置 API Key 和运行参数

在运行前，请先配置大模型 API Key：

```bash
export DF_API_KEY=sk-xxxx
```

如果你需要修改输入文件、缓存路径、模型名称或服务地址，可以在 `kg_evaluation_visualization_pipeline.py` 中调整以下参数：

```python
pipeline = KGEvaluationVisualizationPipeline(
    input_file="your_kg_data.json",
    cache_path="./cache_kg_eval",
    api_url="http://172.96.141.132:3001/v1/chat/completions",
    model_name="gpt-4o-mini",
    api_key_env="DF_API_KEY",
    max_workers=10,
    lang="en",
)
```

### 第四步：一键运行

```bash
python kg_evaluation_visualization_pipeline.py
```

运行完成后，评测结果会保存在缓存目录中，同时输出交互式图谱可视化文件 `kg_visualization.html`。接下来，我们会详细介绍流水线中的各个步骤和参数配置。

---

## 3. 数据流与流水线逻辑

### 1. **输入数据**

该流程的输入数据主要包括以下字段：

- **triple**：知识图谱三元组列表，是评测与可视化的核心输入。
- **raw_chunk**：原始文本片段，用于语义强度评分等需要结合上下文的评测算子。

这些输入数据可以存储在 `json` 文件中，并通过 `FileStorage` 对象进行管理和读取：

```python
self.storage = FileStorage(
    first_entry_file_name=input_file,
    cache_path=cache_path,
    file_name_prefix="kg_eval",
    cache_type="json",
)
```

当未显式指定 `input_file` 时，流水线默认读取：

```python
dataflow/data_for_operator_testing/knowledge_extraction.json
```

**输入数据示例**：

```json
[
    {
        "raw_chunk": "Marie Curie discovered polonium and radium during her pioneering research on radioactivity.",
        "triple": [
            ["Marie Curie", "discovered", "polonium"],
            ["Marie Curie", "discovered", "radium"],
            ["Marie Curie", "researched", "radioactivity"]
        ]
    }
]
```

### 2. **知识图谱评测与可视化流水线（KGEvaluationVisualizationPipeline）**

该流程的核心是 **KGEvaluationVisualizationPipeline**，它串联了 6 个评测与可视化算子，其中前 3 个结构评测算子无需大模型，第 4、5 步依赖 LLM，第 6 步生成最终的图谱可视化结果。

#### 步骤 1：拓扑结构评测（KGRelationTripleTopologyEvaluator）

**功能：**

- 分析图谱的基础拓扑结构
- 输出最大连通分量占比、平均度、碎片化程度、连通分量数量等指标

**输入**：`triple`  
**输出**：拓扑评测结果字段，如 `lcc_ratio`、`structure_avg_degree`、`fragmentation_score`

**算子初始化**：

```python
self.topology_eval = KGRelationTripleTopologyEvaluator()
```

**算子运行**：

```python
self.topology_eval.run(
    storage=self.storage.step(),
    input_key="triple",
)
```

#### 步骤 2：子图规模评测（KGSubgraphScaleEvaluator）

**功能：**

- 统计图谱规模特征
- 输出节点数、边数和图密度等指标

**输入**：`triple`  
**输出**：规模评测结果字段，如 `num_nodes`、`num_edges`、`density`

**算子初始化**：

```python
self.scale_eval = KGSubgraphScaleEvaluator()
```

**算子运行**：

```python
self.scale_eval.run(
    storage=self.storage.step(),
    input_key="triple",
)
```

#### 步骤 3：子图连通性评测（KGSubgraphConnectivityEvaluator）

**功能：**

- 评估图谱的连通性特征
- 输出点连通度、边连通度和全局效率等指标

**输入**：`triple`  
**输出**：连通性评测结果字段，如 `vertex_connectivity`、`edge_connectivity`、`global_efficiency`

**算子初始化**：

```python
self.connectivity_eval = KGSubgraphConnectivityEvaluator()
```

**算子运行**：

```python
self.connectivity_eval.run(
    storage=self.storage.step(),
    input_key="triple",
)
```

#### 步骤 4：三元组逻辑一致性评测（KGRelationTripleConsistencyEvaluator）

**功能：**

- 基于大模型判断三元组是否具有基本逻辑一致性
- 适合用于发现明显的语义冲突、关系异常或抽取错误

**输入**：`triple`  
**输出**：逻辑一致性评分结果，如 `logical_consistency_score`

**算子初始化**：

```python
self.consistency_eval = KGRelationTripleConsistencyEvaluator(
    llm_serving=self.llm_serving,
    sample_rate=1.0,
    max_samples=10,
    lang=lang,
)
```

**算子运行**：

```python
self.consistency_eval.run(
    storage=self.storage.step(),
    input_key="triple",
)
```

#### 步骤 5：三元组语义强度评分（KGRelationStrengthScoring）

**功能：**

- 结合原始文本上下文和三元组内容，对关系表达强度进行评分
- 可用于判断某条关系是否被文本充分支持

**输入**：`raw_chunk`、`triple`  
**输出**：语义强度评分字段 `triple_strength_score`

**算子初始化**：

```python
self.strength_eval = KGRelationStrengthScoring(
    llm_serving=self.llm_serving,
    lang=lang,
)
```

**算子运行**：

```python
self.strength_eval.run(
    storage=self.storage.step(),
    input_key="raw_chunk",
    input_key_meta="triple",
    output_key="triple_strength_score",
)
```

#### 步骤 6：知识图谱可视化（KGRelationTripleVisualization）

**功能：**

- 将三元组渲染为可交互的图谱可视化结果
- 导出 HTML 文件，便于浏览器直接查看

**输入**：`triple`  
**输出**：可视化结果字段 `kg_visualization` 和 HTML 文件 `kg_visualization.html`

**算子初始化**：

```python
self.visualization = KGRelationTripleVisualization(lang=lang)
```

**算子运行**：

```python
visual_html = os.path.join(self.storage.cache_path, "kg_visualization.html")
self.visualization.run(
    storage=self.storage.step(),
    input_key="triple",
    output_key="kg_visualization",
    output_html=visual_html,
)
```

### 3. **输出数据**

最终，流水线输出的数据通常将包含以下内容：

- **triple**：原始知识图谱三元组
- **lcc_ratio / structure_avg_degree / fragmentation_score / num_components**：拓扑结构指标
- **num_nodes / num_edges / density**：规模评测指标
- **vertex_connectivity / edge_connectivity / global_efficiency**：连通性评测指标
- **logical_consistency_score**：三元组逻辑一致性评分
- **triple_strength_score**：三元组语义强度评分
- **kg_visualization**：可视化结果字段

此外，缓存目录下还会生成交互式 HTML 文件：

- **kg_visualization.html**：知识图谱可视化页面

**输出结果示例**：

```json
{
    "triple": [
        ["Marie Curie", "discovered", "polonium"],
        ["Marie Curie", "discovered", "radium"]
    ],
    "lcc_ratio": 1.0,
    "structure_avg_degree": 1.33,
    "fragmentation_score": 0.0,
    "num_nodes": 3,
    "num_edges": 2,
    "density": 0.3333,
    "vertex_connectivity": 1,
    "edge_connectivity": 1,
    "global_efficiency": 0.8333,
    "logical_consistency_score": 0.95,
    "triple_strength_score": [0.91, 0.93],
    "kg_visualization": "./cache_kg_eval/kg_visualization.html"
}
```

---

## 4. 流水线示例

以下是完整的`KGEvaluationVisualizationPipeline`代码实现。

```python
import os
from dataflow.operators.general_kg.eval.kg_rel_triple_topology_eval import KGRelationTripleTopologyEvaluator
from dataflow.operators.general_kg.eval.kg_subgraph_scale_eval import KGSubgraphScaleEvaluator
from dataflow.operators.general_kg.eval.kg_subgraph_connectivity_eval import KGSubgraphConnectivityEvaluator
from dataflow.operators.general_kg.eval.kg_rel_triple_consistency_eval import KGRelationTripleConsistencyEvaluator
from dataflow.operators.general_kg.eval.kg_rel_triple_strength_eval import KGRelationStrengthScoring
from dataflow.operators.general_kg.eval.kg_rel_triple_nx_visual import KGRelationTripleVisualization
from dataflow.utils.storage import FileStorage
from dataflow.serving import APILLMServing_request


class KGEvaluationVisualizationPipeline:
    """通用知识图谱评测与可视化流水线"""

    def __init__(
        self,
        input_file: str = "",
        cache_path: str = "./cache_kg_eval",
        api_url: str = "http://172.96.141.132:3001/v1/chat/completions",
        model_name: str = "gpt-4o-mini",
        api_key_env: str = "DF_API_KEY",
        max_workers: int = 10,
        lang: str = "en",
    ):
        if not input_file:
            repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
            input_file = os.path.join(repo_root, "dataflow", "data_for_operator_testing", "knowledge_extraction.json")

        self.storage = FileStorage(
            first_entry_file_name=input_file,
            cache_path=cache_path,
            file_name_prefix="kg_eval",
            cache_type="json",
        )

        self.llm_serving = APILLMServing_request(
            api_url=api_url,
            key_name_of_api_key=api_key_env,
            model_name=model_name,
            max_workers=max_workers,
            temperature=0.0,
        )

        self.topology_eval = KGRelationTripleTopologyEvaluator()
        self.scale_eval = KGSubgraphScaleEvaluator()
        self.connectivity_eval = KGSubgraphConnectivityEvaluator()

        self.consistency_eval = KGRelationTripleConsistencyEvaluator(
            llm_serving=self.llm_serving,
            sample_rate=1.0,
            max_samples=10,
            lang=lang,
        )
        self.strength_eval = KGRelationStrengthScoring(
            llm_serving=self.llm_serving,
            lang=lang,
        )

        self.visualization = KGRelationTripleVisualization(lang=lang)

    def forward(self):
        print("=" * 60)
        print("Step 1/6: 拓扑结构评测 (Topology Evaluation)")
        print("=" * 60)
        self.topology_eval.run(
            storage=self.storage.step(),
            input_key="triple",
        )

        print("\n" + "=" * 60)
        print("Step 2/6: 子图规模评测 (Subgraph Scale Evaluation)")
        print("=" * 60)
        self.scale_eval.run(
            storage=self.storage.step(),
            input_key="triple",
        )

        print("\n" + "=" * 60)
        print("Step 3/6: 子图连通性评测 (Subgraph Connectivity Evaluation)")
        print("=" * 60)
        self.connectivity_eval.run(
            storage=self.storage.step(),
            input_key="triple",
        )

        print("\n" + "=" * 60)
        print("Step 4/6: 三元组逻辑一致性评测 (Consistency Evaluation) [LLM]")
        print("=" * 60)
        self.consistency_eval.run(
            storage=self.storage.step(),
            input_key="triple",
        )

        print("\n" + "=" * 60)
        print("Step 5/6: 三元组语义强度评分 (Strength Scoring) [LLM]")
        print("=" * 60)
        self.strength_eval.run(
            storage=self.storage.step(),
            input_key="raw_chunk",
            input_key_meta="triple",
            output_key="triple_strength_score",
        )

        print("\n" + "=" * 60)
        print("Step 6/6: 知识图谱可视化 (KG Visualization)")
        print("=" * 60)
        visual_html = os.path.join(self.storage.cache_path, "kg_visualization.html")
        self.visualization.run(
            storage=self.storage.step(),
            input_key="triple",
            output_key="kg_visualization",
            output_html=visual_html,
        )

        self._print_summary()

    def _print_summary(self):
        step6_file = os.path.join(self.storage.cache_path, "kg_eval_step6.json")
        try:
            if os.path.exists(step6_file):
                df = self.storage.read("dataframe", file_path=step6_file)
            else:
                df = self.storage.read("dataframe")
        except Exception as e:
            print(f"\n[Warning] 无法读取最终结果: {e}")
            return

        print("\n" + "=" * 60)
        print("评测结果摘要 (Evaluation Summary)")
        print("=" * 60)

        topo_keys = ["lcc_ratio", "structure_avg_degree", "fragmentation_score",
                     "num_components", "node_count", "edge_count"]
        print("\n[拓扑结构指标]")
        for key in topo_keys:
            if key in df.columns:
                print(f"  {key}: {df[key].tolist()}")

        scale_keys = ["num_nodes", "num_edges", "density"]
        print("\n[子图规模指标]")
        for key in scale_keys:
            if key in df.columns:
                print(f"  {key}: {df[key].tolist()}")

        conn_keys = ["vertex_connectivity", "edge_connectivity", "global_efficiency"]
        print("\n[子图连通性指标]")
        for key in conn_keys:
            if key in df.columns:
                print(f"  {key}: {df[key].tolist()}")

        print("\n[LLM 评测指标]")
        if "logical_consistency_score" in df.columns:
            print(f"  logical_consistency_score: {df['logical_consistency_score'].tolist()}")
        if "triple_strength_score" in df.columns:
            print(f"  triple_strength_score: {df['triple_strength_score'].tolist()}")
        if "kg_visualization" in df.columns:
            print(f"  kg_visualization: {df['kg_visualization'].iloc[0]}")

        print("\n" + "=" * 60)
        print(f"缓存文件目录: {self.storage.cache_path}")
        print("=" * 60)


if __name__ == "__main__":
    pipeline = KGEvaluationVisualizationPipeline()
    pipeline.forward()
```
