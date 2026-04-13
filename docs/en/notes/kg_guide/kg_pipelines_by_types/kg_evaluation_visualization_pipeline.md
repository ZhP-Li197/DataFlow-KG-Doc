---
title: Knowledge Graph Evaluation and Visualization Pipeline
createTime: 2026/04/12 17:00:00
permalink: /en/kg_guide/kg_evaluation_visualization_pipeline/
icon: carbon:chart-network
---

# Knowledge Graph Evaluation and Visualization Pipeline

## 1. Overview

The **Knowledge Graph Evaluation and Visualization Pipeline** is designed for quality analysis and result presentation of General Knowledge Graphs (General KG). It supports multi-dimensional evaluation of extracted triple-based graphs and further generates interactive graph visualization results. This pipeline is suitable for tasks such as graph construction quality inspection, statistical analysis before graph cleaning, graph structure diagnosis, and result presentation.

We support the following use cases:

- Quality evaluation of general knowledge graph extraction results
- Graph structure connectivity and scale analysis
- Triple consistency and semantic strength evaluation based on large language models
- Interactive knowledge graph visualization

The main stages of the pipeline include:

1. **Topology Evaluation**: Analyze overall graph topology features such as connected components, average degree, and fragmentation.
2. **Subgraph Scale Evaluation**: Measure scale-related metrics such as the number of nodes, number of edges, and density.
3. **Subgraph Connectivity Evaluation**: Compute connectivity indicators including vertex connectivity, edge connectivity, and global efficiency.
4. **Triple Consistency Evaluation**: Use a large language model to determine whether triples satisfy basic logical and semantic consistency.
5. **Triple Semantic Strength Scoring**: Evaluate the strength of relation expressions based on the original text and triple content.
6. **Knowledge Graph Visualization**: Render triples into an interactive graph structure and export it as an HTML file.

---

## 2. Quick Start

### Step 1: Create a new DataFlow workspace

```bash
mkdir run_dataflow_kg
cd run_dataflow_kg
```

### Step 2: Prepare the script

Save the code from the "Pipeline Example" section below as `kg_evaluation_visualization_pipeline.py`.

### Step 3: Configure the API Key and runtime parameters

Before running the pipeline, configure the API key for the large model:

```bash
export DF_API_KEY=sk-xxxx
```

If you need to modify the input file, cache path, model name, or service endpoint, you can adjust the following parameters in `kg_evaluation_visualization_pipeline.py`:

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

### Step 4: One-click run

```bash
python kg_evaluation_visualization_pipeline.py
```

After execution, the evaluation results will be saved in the cache directory, and the interactive graph visualization file `kg_visualization.html` will also be generated. Next, we will introduce each step and configuration item in the pipeline in detail.

---

## 3. Data Flow and Pipeline Logic

### 1. **Input Data**

The input data for this pipeline mainly includes the following fields:

- **triple**: A list of knowledge graph triples. This is the core input for both evaluation and visualization.
- **raw_chunk**: The original text chunk, used by evaluation operators that require context, such as semantic strength scoring.

These input fields can be stored in a `json` file and managed and read through the `FileStorage` object:

```python
self.storage = FileStorage(
    first_entry_file_name=input_file,
    cache_path=cache_path,
    file_name_prefix="kg_eval",
    cache_type="json",
)
```

When `input_file` is not explicitly specified, the pipeline reads the following file by default:

```python
dataflow/data_for_operator_testing/knowledge_extraction.json
```

**Input Data Example**:

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

### 2. **Knowledge Graph Evaluation and Visualization Pipeline (KGEvaluationVisualizationPipeline)**

The core of this workflow is **KGEvaluationVisualizationPipeline**, which chains together 6 evaluation and visualization operators. The first 3 structural evaluation operators do not require a large language model, steps 4 and 5 depend on an LLM, and step 6 generates the final graph visualization result.

#### Step 1: Topology Evaluation (KGRelationTripleTopologyEvaluator)

**Functionality:**

- Analyze the basic topological structure of the graph
- Output indicators such as largest connected component ratio, average degree, fragmentation score, and number of connected components

**Input**: `triple`  
**Output**: Topology evaluation result fields such as `lcc_ratio`, `structure_avg_degree`, and `fragmentation_score`

**Operator Initialization**:

```python
self.topology_eval = KGRelationTripleTopologyEvaluator()
```

**Operator Execution**:

```python
self.topology_eval.run(
    storage=self.storage.step(),
    input_key="triple",
)
```

#### Step 2: Subgraph Scale Evaluation (KGSubgraphScaleEvaluator)

**Functionality:**

- Measure scale-related characteristics of the graph
- Output metrics such as the number of nodes, number of edges, and graph density

**Input**: `triple`  
**Output**: Scale evaluation result fields such as `num_nodes`, `num_edges`, and `density`

**Operator Initialization**:

```python
self.scale_eval = KGSubgraphScaleEvaluator()
```

**Operator Execution**:

```python
self.scale_eval.run(
    storage=self.storage.step(),
    input_key="triple",
)
```

#### Step 3: Subgraph Connectivity Evaluation (KGSubgraphConnectivityEvaluator)

**Functionality:**

- Evaluate graph connectivity characteristics
- Output indicators such as vertex connectivity, edge connectivity, and global efficiency

**Input**: `triple`  
**Output**: Connectivity evaluation result fields such as `vertex_connectivity`, `edge_connectivity`, and `global_efficiency`

**Operator Initialization**:

```python
self.connectivity_eval = KGSubgraphConnectivityEvaluator()
```

**Operator Execution**:

```python
self.connectivity_eval.run(
    storage=self.storage.step(),
    input_key="triple",
)
```

#### Step 4: Triple Logical Consistency Evaluation (KGRelationTripleConsistencyEvaluator)

**Functionality:**

- Use a large language model to determine whether triples satisfy basic logical consistency
- Suitable for discovering obvious semantic conflicts, abnormal relations, or extraction errors

**Input**: `triple`  
**Output**: Logical consistency scoring result such as `logical_consistency_score`

**Operator Initialization**:

```python
self.consistency_eval = KGRelationTripleConsistencyEvaluator(
    llm_serving=self.llm_serving,
    sample_rate=1.0,
    max_samples=10,
    lang=lang,
)
```

**Operator Execution**:

```python
self.consistency_eval.run(
    storage=self.storage.step(),
    input_key="triple",
)
```

#### Step 5: Triple Semantic Strength Scoring (KGRelationStrengthScoring)

**Functionality:**

- Score the strength of relation expressions by combining the original text context and triple content
- Useful for determining whether a relation is sufficiently supported by the source text

**Input**: `raw_chunk`, `triple`  
**Output**: Semantic strength scoring field `triple_strength_score`

**Operator Initialization**:

```python
self.strength_eval = KGRelationStrengthScoring(
    llm_serving=self.llm_serving,
    lang=lang,
)
```

**Operator Execution**:

```python
self.strength_eval.run(
    storage=self.storage.step(),
    input_key="raw_chunk",
    input_key_meta="triple",
    output_key="triple_strength_score",
)
```

#### Step 6: Knowledge Graph Visualization (KGRelationTripleVisualization)

**Functionality:**

- Render triples into an interactive graph visualization result
- Export an HTML file for direct viewing in a browser

**Input**: `triple`  
**Output**: Visualization result field `kg_visualization` and the HTML file `kg_visualization.html`

**Operator Initialization**:

```python
self.visualization = KGRelationTripleVisualization(lang=lang)
```

**Operator Execution**:

```python
visual_html = os.path.join(self.storage.cache_path, "kg_visualization.html")
self.visualization.run(
    storage=self.storage.step(),
    input_key="triple",
    output_key="kg_visualization",
    output_html=visual_html,
)
```

### 3. **Output Data**

In the end, the pipeline output usually contains the following fields:

- **triple**: Original knowledge graph triples
- **lcc_ratio / structure_avg_degree / fragmentation_score / num_components**: Topology metrics
- **num_nodes / num_edges / density**: Scale evaluation metrics
- **vertex_connectivity / edge_connectivity / global_efficiency**: Connectivity evaluation metrics
- **logical_consistency_score**: Triple logical consistency score
- **triple_strength_score**: Triple semantic strength score
- **kg_visualization**: Visualization result field

In addition, the cache directory will contain an interactive HTML file:

- **kg_visualization.html**: Knowledge graph visualization page

**Output Example**:

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

## 4. Pipeline Example

Below is the complete implementation of `KGEvaluationVisualizationPipeline`.

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
    """General knowledge graph evaluation and visualization pipeline."""

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
        print("Step 1/6: Topology Evaluation")
        print("=" * 60)
        self.topology_eval.run(
            storage=self.storage.step(),
            input_key="triple",
        )

        print("\n" + "=" * 60)
        print("Step 2/6: Subgraph Scale Evaluation")
        print("=" * 60)
        self.scale_eval.run(
            storage=self.storage.step(),
            input_key="triple",
        )

        print("\n" + "=" * 60)
        print("Step 3/6: Subgraph Connectivity Evaluation")
        print("=" * 60)
        self.connectivity_eval.run(
            storage=self.storage.step(),
            input_key="triple",
        )

        print("\n" + "=" * 60)
        print("Step 4/6: Triple Logical Consistency Evaluation [LLM]")
        print("=" * 60)
        self.consistency_eval.run(
            storage=self.storage.step(),
            input_key="triple",
        )

        print("\n" + "=" * 60)
        print("Step 5/6: Triple Semantic Strength Scoring [LLM]")
        print("=" * 60)
        self.strength_eval.run(
            storage=self.storage.step(),
            input_key="raw_chunk",
            input_key_meta="triple",
            output_key="triple_strength_score",
        )

        print("\n" + "=" * 60)
        print("Step 6/6: Knowledge Graph Visualization")
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
            print(f"\n[Warning] Failed to read the final result: {e}")
            return

        print("\n" + "=" * 60)
        print("Evaluation Summary")
        print("=" * 60)

        topo_keys = ["lcc_ratio", "structure_avg_degree", "fragmentation_score",
                     "num_components", "node_count", "edge_count"]
        print("\n[Topology Metrics]")
        for key in topo_keys:
            if key in df.columns:
                print(f"  {key}: {df[key].tolist()}")

        scale_keys = ["num_nodes", "num_edges", "density"]
        print("\n[Subgraph Scale Metrics]")
        for key in scale_keys:
            if key in df.columns:
                print(f"  {key}: {df[key].tolist()}")

        conn_keys = ["vertex_connectivity", "edge_connectivity", "global_efficiency"]
        print("\n[Subgraph Connectivity Metrics]")
        for key in conn_keys:
            if key in df.columns:
                print(f"  {key}: {df[key].tolist()}")

        print("\n[LLM Evaluation Metrics]")
        if "logical_consistency_score" in df.columns:
            print(f"  logical_consistency_score: {df['logical_consistency_score'].tolist()}")
        if "triple_strength_score" in df.columns:
            print(f"  triple_strength_score: {df['triple_strength_score'].tolist()}")
        if "kg_visualization" in df.columns:
            print(f"  kg_visualization: {df['kg_visualization'].iloc[0]}")

        print("\n" + "=" * 60)
        print(f"Cache directory: {self.storage.cache_path}")
        print("=" * 60)


if __name__ == "__main__":
    pipeline = KGEvaluationVisualizationPipeline()
    pipeline.forward()
```
