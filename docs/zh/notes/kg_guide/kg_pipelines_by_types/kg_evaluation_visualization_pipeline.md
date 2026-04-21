---
title: 知识图谱评测与可视化流水线
createTime: 2026/04/12 17:00:00
permalink: /zh/kg_guide/kg_evaluation_visualization_pipeline/
icon: solar:chart-2-broken
---

# 知识图谱评测与可视化流水线

## 1. 概述

**知识图谱评测与可视化流水线**面向通用知识图谱（General KG）的质量分析与结果展示场景，支持对抽取得到的关系三元组图谱进行多维度评测，并进一步生成可交互的 HTML 图谱可视化结果。该流水线适用于图谱构建质量检查、图谱清洗前的统计分析、图谱结构诊断和结果展示等任务。

我们支持以下应用场景：

- 通用知识图谱抽取结果的质量评测
- 图谱结构连通性与规模分析
- 基于大模型的三元组逻辑一致性与语义强度评测
- 交互式知识图谱可视化展示

该流水线的主要流程包括：

1. **拓扑结构评测**：`KGRelationTripleTopologyEvaluator` 分析图谱整体拓扑特征，如连通分量、平均度和碎片化程度等。
2. **子图规模评测**：`KGSubgraphScaleEvaluator` 统计节点数、边数和图密度等规模指标。
3. **子图连通性评测**：`KGSubgraphConnectivityEvaluator` 计算点连通度、边连通度和全局效率等连通性指标。
4. **三元组一致性评测**：`KGRelationTripleConsistencyEvaluator` 基于大模型判断三元组是否符合基本逻辑与语义一致性。
5. **三元组语义强度评分**：`KGRelationStrengthScoring` 结合原始文本和三元组内容，评估关系表达强度。
6. **知识图谱可视化**：`KGRelationTripleVisualization` 将三元组渲染为交互式图结构，并导出为 HTML 文件。

## 2. 快速开始

### 步骤 1：安装 DataFlow-KG

```bash
pip install dataflow-kg
```

### 步骤 2：创建新的 DataFlow 工作目录

```bash
mkdir run_kg_evaluation_visualization_pipeline
cd run_kg_evaluation_visualization_pipeline
```

### 步骤 3：初始化 DataFlow

```bash
dfkg init
```

初始化完成后，当前目录下会自动生成流水线脚本和默认样例数据：

```shell
api_pipelines/kg_evaluation_visualization_pipeline.py
example_data/kg_evaluation_visualization_pipeline/input.json
```

其中，`api_pipelines/kg_evaluation_visualization_pipeline.py` 是可直接运行的流水线代码，`example_data/kg_evaluation_visualization_pipeline/input.json` 是默认输入数据。用户不需要从文档中复制代码或手动新建流水线脚本。

### 步骤 4：配置 API Key 和 API URL

Linux 和 macOS：

```shell
export DF_API_KEY="sk-xxxxx"
```

Windows PowerShell：

```powershell
$env:DF_API_KEY = "sk-xxxxx"
```

在 `api_pipelines/kg_evaluation_visualization_pipeline.py` 中配置 `api_url`：

```python
self.llm_serving = APILLMServing_request(
    api_url="https://api.openai.com/v1/chat/completions",
    key_name_of_api_key=api_key_env,
    model_name=model_name,
    max_workers=max_workers,
    temperature=0.0,
)
```

如果需要修改输入文件、缓存路径、模型名称或并发数，可以调整 `KGEvaluationVisualizationPipeline` 的初始化参数：

```python
pipeline = KGEvaluationVisualizationPipeline(
    input_file="your_kg_data.json",
    cache_path="./cache_kg_eval",
    api_url="https://api.openai.com/v1/chat/completions",
    model_name="gpt-4o-mini",
    api_key_env="DF_API_KEY",
    max_workers=10,
    lang="en",
)
```

### 步骤 5：检查默认输入数据

初始化后的默认输入文件为：

```shell
example_data/kg_evaluation_visualization_pipeline/input.json
```

该文件至少包含以下字段：

- `raw_chunk`：原始文本片段，用于语义强度评分等需要上下文的评测算子。
- `triple`：关系三元组字符串列表，是结构评测和可视化的核心输入。

示例：

```json
[
  {
    "raw_chunk": "Henry, a musician from Canada, trained under conductor Maria Rodriguez. He later formed the band The Maple Leaves.",
    "triple": [
      "<subj> Henry <obj> Canada <rel> comes_from",
      "<subj> Henry <obj> Maria Rodriguez <rel> trained_under",
      "<subj> Henry <obj> The Maple Leaves <rel> formed"
    ]
  }
]
```

### 步骤 6：一键执行

```bash
python api_pipelines/kg_evaluation_visualization_pipeline.py
```

运行完成后，评测结果会保存在 `cache_kg_eval/` 目录中，同时生成交互式图谱可视化文件：

```shell
cache_kg_eval/kg_visualization.html
```

## 3. 数据流和流水线逻辑

### 3.1 输入数据

该流水线的输入数据主要包含以下字段：

- **raw_chunk**：原始文本片段，可以来自通用语料、网页文本、文档段落或上游知识图谱抽取结果。
- **triple**：关系三元组字符串列表，格式为 `"<subj> 主体 <obj> 客体 <rel> 关系"`。

输入数据通过 `FileStorage` 读取。初始化后，默认路径会指向 `example_data/kg_evaluation_visualization_pipeline/input.json`：

```python
self.storage = FileStorage(
    first_entry_file_name=input_file,
    cache_path=cache_path,
    file_name_prefix="kg_eval",
    cache_type="json",
)
```

### 3.2 拓扑结构评测

第一步使用 `KGRelationTripleTopologyEvaluator` 分析关系三元组构成的图结构：

- 输入：`triple`
- 输出：`lcc_ratio`、`structure_avg_degree`、`fragmentation_score`、`num_components`、`node_count`、`edge_count`

这些指标用于描述图谱是否形成较大的连通区域、平均连接程度以及碎片化程度。

### 3.3 子图规模评测

第二步使用 `KGSubgraphScaleEvaluator` 统计图谱规模：

- 输入：`triple`
- 输出：`num_nodes`、`num_edges`、`density`

该步骤用于快速判断当前图谱的节点规模、边规模和稠密程度。

### 3.4 子图连通性评测

第三步使用 `KGSubgraphConnectivityEvaluator` 评估图谱连通性：

- 输入：`triple`
- 输出：`vertex_connectivity`、`edge_connectivity`、`global_efficiency`

这些指标可以辅助判断图谱是否过于稀疏、是否存在明显断裂结构，以及节点之间的信息传播效率。

### 3.5 三元组逻辑一致性评测

第四步使用 `KGRelationTripleConsistencyEvaluator` 基于大模型判断三元组是否具有基本逻辑一致性：

- 输入：`triple`
- 输出：`logical_consistency_score`
- 关键参数：`sample_rate=1.0`、`max_samples=10`

该步骤适合发现明显的语义冲突、关系异常或抽取错误。由于该算子需要调用大模型，请确保已配置 `DF_API_KEY` 和可用的 `api_url`。

### 3.6 三元组语义强度评分

第五步使用 `KGRelationStrengthScoring` 结合原始文本上下文和三元组内容，对关系表达强度进行评分：

- 输入：`raw_chunk`
- 元信息输入：`triple`
- 输出：`triple_strength_score`

该步骤用于判断某条关系是否被原始文本充分支持，适合图谱清洗和质量筛选场景。

### 3.7 知识图谱可视化

第六步使用 `KGRelationTripleVisualization` 将三元组渲染为交互式 HTML 图谱：

- 输入：`triple`
- 输出：`kg_visualization`
- HTML 文件：`cache_kg_eval/kg_visualization.html`

生成的 HTML 文件可以直接用浏览器打开，查看实体节点、关系边和图谱整体结构。

### 3.8 输出数据

最终输出通常包含以下字段：

- **triple**：原始知识图谱三元组
- **lcc_ratio / structure_avg_degree / fragmentation_score / num_components**：拓扑结构指标
- **num_nodes / num_edges / density**：规模评测指标
- **vertex_connectivity / edge_connectivity / global_efficiency**：连通性评测指标
- **logical_consistency_score**：三元组逻辑一致性评分
- **triple_strength_score**：三元组语义强度评分
- **kg_visualization**：可视化 HTML 文件路径

输出结果示例：

```json
{
  "triple": [
    "<subj> Henry <obj> Canada <rel> comes_from",
    "<subj> Henry <obj> The Maple Leaves <rel> formed"
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

## 4. 流水线实例

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
        api_url: str = "https://api.openai.com/v1/chat/completions",
        model_name: str = "gpt-4o-mini",
        api_key_env: str = "DF_API_KEY",
        max_workers: int = 10,
        lang: str = "en",
    ):
        if not input_file:
            pipeline_dir = os.path.dirname(os.path.abspath(__file__))
            input_file = os.path.abspath(
                os.path.join(
                    pipeline_dir,
                    "..",
                    "example_data",
                    "kg_evaluation_visualization_pipeline/input.json",
                )
            )

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
