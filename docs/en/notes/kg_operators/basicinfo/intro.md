---
title: Introduction
icon: mdi:tooltip-text-outline
createTime: 2025/06/13 14:51:34
permalink: /en/kg_operators/intro/basicinfo/intro/

---

## Operator System in DataFlow-KG

`DataFlow-KG` provides a structured, extensible, and reusable operator system for knowledge graph construction, processing, refinement, and evaluation across different graph types. The overall organization, design principles, and naming conventions of the operators are described below.

### 1. Organization by Knowledge Graph Type

In `DataFlow-KG`, operators are organized according to different knowledge graph types. Each graph type corresponds to an independent folder, and the operators inside each folder are further divided into four functional categories:

* `generate`: for graph construction and data generation
* `filter`: for data screening and quality filtering
* `refine`: for graph refinement, completion, and normalization
* `eval`: for quality evaluation and performance assessment

This organization keeps the operator structure consistent across different graph types, making the framework easier to develop, maintain, and extend.

Currently, `DataFlow-KG` supports, but is not limited to, the following graph types:

* General Knowledge Graphs
* Commonsense Knowledge Graphs
* Temporal Knowledge Graphs
* Multimodal Knowledge Graphs
* Hyper-relational Knowledge Graphs

### 2. Design Principle: High Reusability, Low Redundancy

The operator design in `DataFlow-KG` follows the principle of **high reusability with low redundancy**.

Among all graph types, the **general knowledge graph (`general_kg / kg`)** represents the most common knowledge graph structures, such as:

* entity–relation–entity triples
* entity–attribute–attribute-value triples

The operator set for general knowledge graphs serves as the **foundational capability layer** of the entire `DataFlow-KG` framework. In particular, many `filter` and `refine` operators are sufficiently general to be reused across most other graph types. Therefore, when designing operators for commonsense, temporal, multimodal, and hyper-relational knowledge graphs, we reuse the existing operators in `general_kg` whenever possible. This reduces duplicated development effort while improving consistency and maintainability across the framework.

### 3. Operator Naming Convention

All operator files in `DataFlow-KG` follow the naming format below:

```text
[graph_type]_[object]_[specific_function]
```

Examples:

```text
kg_entity_extract
tkg_tuple_filter
mmkg_qa_generate
hrkg_subgraph_refine
```

This naming convention clearly reflects the applicable graph type, the target object, and the core functionality of each operator, making the codebase easier to understand and navigate.

#### 3.1 Graph Type Abbreviations

| Graph Type          | Abbreviation | Description                                                                                  |
| ------------------- | ------------ | -------------------------------------------------------------------------------------------- |
| General KG          | `kg`         | The foundational graph type for generic entity-relation and entity-attribute representations |
| Commonsense KG      | `ckg`        | Knowledge graphs for commonsense representation and reasoning                                |
| Temporal KG         | `tkg`        | Knowledge graphs with temporal or dynamic information                                        |
| Multimodal KG       | `mmkg`       | Knowledge graphs that integrate text, images, and other modalities                           |
| Hyper-relational KG | `hrkg`       | Knowledge graphs for higher-order relations and complex semantic structures                  |

#### 3.2 Object Types

| Object     | Meaning            | Description                                                     |
| ---------- | ------------------ | --------------------------------------------------------------- |
| `entity`   | Entity             | Operators that directly process entities                        |
| `rel`      | Relation tuple     | Data in the entity–relation–entity format                       |
| `attri`    | Attribute tuple    | Data in the entity–attribute–attribute-value format             |
| `triple`   | Triple             | Generic three-element structured data                           |
| `tuple`    | Tuple              | Four-element or higher-order structured data                    |
| `qa`       | Question answering | Operators for KG-based QA generation, processing, or evaluation |
| `subgraph` | Subgraph           | Operators for local graph structures                            |
| `path`     | Path               | Operators for graph path mining, reasoning, or analysis         |


### 4. Domain-specific Knowledge Graph Operators

In addition to graph-type-oriented operators, `DataFlow-KG` also provides operators for **domain-specific knowledge graphs (`domain_kg`)**.

Similar to other graph types, operators in each domain are also organized into the following four categories:

* `generate`
* `filter`
* `refine`
* `eval`

Domain-specific knowledge graphs focus more on practical applications in particular scenarios, with greater emphasis on task-oriented design and application adaptability. At the same time, we recognize that real-world domain applications are highly diverse, and the current operator ecosystem still has significant room for expansion. Therefore, we warmly welcome contributions from the community to enrich the repository with more domain-oriented operators and application-specific modules.

### 5. Summary of the Design Philosophy

Overall, the operator system in `DataFlow-KG` has the following characteristics:

* **Well-structured**: organized by graph type and functional stage
* **Consistent**: unified naming conventions and directory design
* **Highly reusable**: built upon the foundational operators in general knowledge graphs
* **Extensible**: easy to expand for new graph types and new domain applications
* **Application-oriented**: designed to support both general capabilities and practical deployment needs

