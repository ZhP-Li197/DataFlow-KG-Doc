---
title: Knowledge Graph Evaluation and Visualization Pipeline
createTime: 2026/04/12 17:00:00
permalink: /en/kg_guide/kg_evaluation_visualization_pipeline/
icon: solar:chart-2-broken
---

# Knowledge Graph Evaluation and Visualization Pipeline

## 1. Overview

The **Knowledge Graph Evaluation and Visualization Pipeline** is designed for quality analysis and result presentation of General Knowledge Graphs. It supports multi-dimensional evaluation of extracted relation-triple graphs and generates an interactive HTML visualization. This pipeline is suitable for graph construction quality inspection, statistical analysis before graph cleaning, graph structure diagnosis, and result presentation.

Supported use cases include:

- Quality evaluation of general knowledge graph extraction results
- Graph connectivity and scale analysis
- LLM-based triple logical consistency and semantic strength evaluation
- Interactive knowledge graph visualization

The main stages of this pipeline are:

1. **Topology Evaluation**: `KGRelationTripleTopologyEvaluator` analyzes graph topology features such as connected components, average degree, and fragmentation.
2. **Subgraph Scale Evaluation**: `KGSubgraphScaleEvaluator` computes the number of nodes, number of edges, and graph density.
3. **Subgraph Connectivity Evaluation**: `KGSubgraphConnectivityEvaluator` computes vertex connectivity, edge connectivity, and global efficiency.
4. **Triple Consistency Evaluation**: `KGRelationTripleConsistencyEvaluator` uses an LLM to determine whether triples satisfy basic logical and semantic consistency.
5. **Triple Semantic Strength Scoring**: `KGRelationStrengthScoring` evaluates relation strength based on the original text and triple content.
6. **Knowledge Graph Visualization**: `KGRelationTripleVisualization` renders triples as an interactive graph and exports an HTML file.

## 2. Quick Start

### Step 1: Install DataFlow-KG

```bash
pip install dataflow-kg
```

### Step 2: Create a new DataFlow workspace

```bash
mkdir run_kg_evaluation_visualization_pipeline
cd run_kg_evaluation_visualization_pipeline
```

### Step 3: Initialize DataFlow

```bash
dfkg init
```

After initialization, the pipeline script and default sample data will be generated automatically:

```shell
api_pipelines/kg_evaluation_visualization_pipeline.py
example_data/KGEvaluationPipeline/input.json
```

`api_pipelines/kg_evaluation_visualization_pipeline.py` is the runnable pipeline script, and `example_data/KGEvaluationPipeline/input.json` is the default input data. Users do not need to copy code from this document or manually create the pipeline script.

### Step 4: Configure the API Key and API URL

Linux and macOS:

```shell
export DF_API_KEY="sk-xxxxx"
```

Windows PowerShell:

```powershell
$env:DF_API_KEY = "sk-xxxxx"
```

Configure `api_url` in `api_pipelines/kg_evaluation_visualization_pipeline.py`:

```python
self.llm_serving = APILLMServing_request(
    api_url="https://api.openai.com/v1/chat/completions",
    key_name_of_api_key=api_key_env,
    model_name=model_name,
    max_workers=max_workers,
    temperature=0.0,
)
```

If you need to modify the input file, cache path, model name, or concurrency, adjust the initialization parameters of `KGEvaluationVisualizationPipeline`:

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

### Step 5: Check the default input data

The default input file after initialization is:

```shell
example_data/KGEvaluationPipeline/input.json
```

This file contains at least the following fields:

- `raw_chunk`: the original text chunk, used by context-aware evaluation operators such as semantic strength scoring.
- `triple`: a list of relation-triple strings, used as the core input for structure evaluation and visualization.

Example:

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

### Step 6: Run the pipeline

```bash
python api_pipelines/kg_evaluation_visualization_pipeline.py
```

After execution, the evaluation results will be saved in `cache_kg_eval/`, and the interactive graph visualization file will be generated:

```shell
cache_kg_eval/kg_visualization.html
```

## 3. Data Flow and Pipeline Logic

### 3.1 Input Data

The pipeline input mainly contains the following fields:

- **raw_chunk**: the original text chunk, which can come from general corpora, web text, document passages, or upstream KG extraction results.
- **triple**: a list of relation-triple strings in the format `"<subj> subject <obj> object <rel> relation"`.

The input data is loaded through `FileStorage`. After initialization, the default path points to `example_data/KGEvaluationPipeline/input.json`:

```python
self.storage = FileStorage(
    first_entry_file_name=input_file,
    cache_path=cache_path,
    file_name_prefix="kg_eval",
    cache_type="json",
)
```

### 3.2 Topology Evaluation

The first step uses `KGRelationTripleTopologyEvaluator` to analyze the graph structure formed by relation triples:

- Input: `triple`
- Output: `lcc_ratio`, `structure_avg_degree`, `fragmentation_score`, `num_components`, `node_count`, `edge_count`

These metrics describe whether the graph forms a large connected region, how densely entities are connected, and how fragmented the graph is.

### 3.3 Subgraph Scale Evaluation

The second step uses `KGSubgraphScaleEvaluator` to compute graph scale metrics:

- Input: `triple`
- Output: `num_nodes`, `num_edges`, `density`

This step quickly measures the number of nodes, number of edges, and density of the current graph.

### 3.4 Subgraph Connectivity Evaluation

The third step uses `KGSubgraphConnectivityEvaluator` to evaluate graph connectivity:

- Input: `triple`
- Output: `vertex_connectivity`, `edge_connectivity`, `global_efficiency`

These metrics help identify sparse graphs, disconnected structures, and information propagation efficiency between nodes.

### 3.5 Triple Logical Consistency Evaluation

The fourth step uses `KGRelationTripleConsistencyEvaluator` to determine whether triples are logically consistent based on an LLM:

- Input: `triple`
- Output: `logical_consistency_score`, `evaluated_sample_indices`
- Key parameters: `sample_rate=1.0`, `max_samples=10`

This step is useful for discovering obvious semantic conflicts, abnormal relations, or extraction errors. `evaluated_sample_indices` records the sampled triple indices used for evaluation. Because this operator calls an LLM, make sure `DF_API_KEY` and a valid `api_url` are configured.

### 3.6 Triple Semantic Strength Scoring

The fifth step uses `KGRelationStrengthScoring` to score relation strength based on the original text context and triple content:

- Input: `raw_chunk`
- Metadata input: `triple`
- Output: `triple_strength_score`

This step determines whether a relation is sufficiently supported by the original text and is useful for graph cleaning and quality filtering.

### 3.7 Knowledge Graph Visualization

The sixth step uses `KGRelationTripleVisualization` to render triples into an interactive HTML graph:

- Input: `triple`
- Output: `kg_visualization`
- HTML file: `cache_kg_eval/kg_visualization.html`

The generated HTML file can be opened directly in a browser to inspect entity nodes, relation edges, and the overall graph structure.

### 3.8 Output Data

The final output usually contains the following fields:

- **triple**: original knowledge graph triples
- **lcc_ratio / structure_avg_degree / fragmentation_score / num_components / node_count / edge_count**: topology metrics
- **num_nodes / num_edges / density**: scale evaluation metrics
- **vertex_connectivity / edge_connectivity / global_efficiency**: connectivity evaluation metrics
- **logical_consistency_score**: triple logical consistency score
- **evaluated_sample_indices**: sampled triple indices used by the consistency evaluator
- **triple_strength_score**: triple semantic strength score
- **kg_visualization**: visualization HTML file path

Output example:

```json
{
  "triple": [
    "<subj> Henry <obj> Canada <rel> comes_from",
    "<subj> Henry <obj> The Maple Leaves <rel> formed"
  ],
  "lcc_ratio": 1.0,
  "structure_avg_degree": 1.33,
  "fragmentation_score": 0.0,
  "num_components": 1,
  "node_count": 3,
  "edge_count": 2,
  "num_nodes": 3,
  "num_edges": 2,
  "density": 0.3333,
  "vertex_connectivity": 1,
  "edge_connectivity": 1,
  "global_efficiency": 0.8333,
  "logical_consistency_score": 0.95,
  "evaluated_sample_indices": [0, 1],
  "triple_strength_score": [0.91, 0.93],
  "kg_visualization": "./cache_kg_eval/kg_visualization.html"
}
```

## 4. Pipeline Instance

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
                    "KGEvaluationPipeline",
                    "input.json",
                )
            )

        # -------- Storage --------
        self.storage = FileStorage(
            first_entry_file_name=input_file,
            cache_path=cache_path,
            file_name_prefix="kg_eval",
            cache_type="json",
        )

        # -------- LLM Serving --------
        self.llm_serving = APILLMServing_request(
            api_url=api_url,
            key_name_of_api_key=api_key_env,
            model_name=model_name,
            max_workers=max_workers,
            temperature=0.0,
        )

        # -------- 无需 LLM 的评测算子 --------
        self.topology_eval = KGRelationTripleTopologyEvaluator()
        self.scale_eval = KGSubgraphScaleEvaluator()
        self.connectivity_eval = KGSubgraphConnectivityEvaluator()

        # -------- 需要 LLM 的评测算子 --------
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

        # -------- 可视化算子 --------
        self.visualization = KGRelationTripleVisualization(lang=lang)

    def forward(self):
        """依次执行所有评测算子和可视化算子"""

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

        # -------- 打印结果摘要 --------
        self._print_summary()

    def _print_summary(self):
        """读取最终结果并打印评测摘要"""
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

        # 拓扑指标
        topo_keys = ["lcc_ratio", "structure_avg_degree", "fragmentation_score",
                     "num_components", "node_count", "edge_count"]
        print("\n[拓扑结构指标]")
        for key in topo_keys:
            if key in df.columns:
                print(f"  {key}: {df[key].tolist()}")

        # 规模指标
        scale_keys = ["num_nodes", "num_edges", "density"]
        print("\n[子图规模指标]")
        for key in scale_keys:
            if key in df.columns:
                print(f"  {key}: {df[key].tolist()}")

        # 连通性指标
        conn_keys = ["vertex_connectivity", "edge_connectivity", "global_efficiency"]
        print("\n[子图连通性指标]")
        for key in conn_keys:
            if key in df.columns:
                print(f"  {key}: {df[key].tolist()}")

        # LLM 评测指标
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
