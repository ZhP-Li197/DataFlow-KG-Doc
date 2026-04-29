---
title: How to Store Knowledge Graphs
icon: material-symbols:storage-rounded
createTime: 2026/04/29 12:00:00
permalink: /en/kg_guide/kg_quickstart/kg_storage/
---

# How to Store Knowledge Graphs

## 1. Overview

In DataFlow-KG, we mainly use `json` files to store knowledge graphs.

Here, "storing a knowledge graph" does not mean that all entities and relations must first be imported into a graph database and then processed around that database. A more common approach is to store each text sample, record, or task unit as a JSON object, and write the extracted entities, triples, tuples, events, and other results into that same object. Multiple objects then form a complete JSON file.

A minimal example is shown below:

```json
[
  {
    "text": "Henry was trained by Maria Rodriguez in 2021.",
    "triple": [
      "<subj> Henry <obj> Maria Rodriguez <rel> is_trained_by"
    ]
  }
]
```

We do not use Neo4j as the default storage method because the primary focus of DataFlow-KG is **data preparation**. During the data preparation stage, a knowledge graph dataset usually goes through the following processes:

- Extracting entities, relations, attributes, and events from raw text
- Cleaning, completing, filtering, and normalizing the extracted results
- Repeatedly adjusting sample formats to fit different graph types

At this stage, the data format is often not fully stable and may change frequently. In comparison, `json` files have several clear advantages:

- Better for batch processing: one batch of samples can be stored in one file and sent directly into a Pipeline
- Better for data preparation: adding, removing, or changing fields is straightforward
- Easier for version control: format changes and sample changes can be tracked with Git
- Easier to migrate: no extra database service is required, and files can be copied directly for reproduction

Neo4j is more suitable after the graph structure has become relatively stable, especially for online retrieval, complex path queries, and graph analysis. In our data preparation workflow, what matters more is that graph results can be generated, revised, and reused quickly. Therefore, we choose `json` files as the default storage format.

We provide the `KGRelationTripleVisualization` operator to output HTML files for graph visualization.

## 2. Concrete Storage Formats

For different types of knowledge graphs, we define different string formats and then store these strings as lists in JSON fields.

### 2.1 Entity-Relation-Entity

Relational triples use the following format:

```text
<subj> ... <obj> ... <rel> ...
```

For example:

```text
<subj> Henry <obj> Maria Rodriguez <rel> is_trained_by
```

In a JSON file, this is typically stored as:

```json
{
  "triple": [
    "<subj> Henry <obj> Maria Rodriguez <rel> is_trained_by"
  ]
}
```

### 2.2 Entity-Attribute-Value

Attribute triples use the following format:

```text
<entity> ... <attribute> ... <value> ...
```

For example:

```text
<entity> Henry <attribute> nationality <value> British
```

In a JSON file, this is typically stored as:

```json
{
  "triple": [
    "<entity> Henry <attribute> nationality <value> British"
  ]
}
```

### 2.3 Temporal Entity-Relation-Entity

Temporal relational quadruples use the following format:

```text
<subj> ... <obj> ... <rel> ... <time> ...
```

For example:

```text
<subj> Henry <obj> Maria Rodriguez <rel> is_trained_by <time> 2021
```

In a JSON file, this is typically stored as:

```json
{
  "tuple": [
    "<subj> Henry <obj> Maria Rodriguez <rel> is_trained_by <time> 2021"
  ]
}
```

### 2.4 Temporal Entity-Attribute-Value

Temporal attribute quadruples use the following format:

```text
<entity> ... <attribute> ... <value> ... <time> ...
```

For example:

```text
<entity> Henry <attribute> job_title <value> Research Assistant <time> 2021
```

In a JSON file, this is typically stored as:

```json
{
  "tuple": [
    "<entity> Henry <attribute> job_title <value> Research Assistant <time> 2021"
  ]
}
```

### 2.5 Hyper-Relational Knowledge Graphs

A hyper-relational knowledge graph extends a basic relation by attaching additional attributes to that relation. One common form is:

```text
<subj> ... <obj> ... <rel> ... <rel_attribute> ...
```

If a relation has multiple attributes, the structure can be further extended. For example:

```text
<subj> Berlin Gigafactory <obj> European Union <rel> mainly_supplies <time> 2024 <location> Germany
```

In a JSON file, this is typically stored as:

```json
{
  "tuple": [
    "<subj> Berlin Gigafactory <obj> European Union <rel> mainly_supplies <time> 2024 <location> Germany"
  ]
}
```

From this perspective, **temporal entity-relation-entity can also be regarded as a special kind of hyper-relational knowledge graph**, because it extends the basic relation `<subj> - <obj> - <rel>` with an additional relation attribute `<time>`.

### 2.6 Event Knowledge Graphs

In addition to the common graph forms above, we also support event knowledge graphs. The core of an event knowledge graph is not to directly describe a relation between two entities, but to describe an event and its attributes. A common format is:

```text
<event> ... <event_attribute> ...
```

For example:

```text
<event> Berlin Gigafactory expansion <event_attribute> start_time 2024
```

Or:

```text
<event> Berlin Gigafactory expansion <event_attribute> location Germany
```

In a JSON file, these can be stored in a separate `event` field:

```json
{
  "event": [
    "<event> Berlin Gigafactory expansion <event_attribute> start_time 2024",
    "<event> Berlin Gigafactory expansion <event_attribute> location Germany"
  ]
}
```

## 3. A Complete Storage Example

In practice, one sample often contains more than one type of graph result. For example, the same text can simultaneously store relational triples, attribute triples, temporal quadruples, and event information:

```json
[
  {
    "doc_id": "demo-2",
    "text": "In 2024, the Berlin Gigafactory mainly supplied the European Union and started a new expansion project in Germany.",
    "triple": [
      "<subj> Berlin Gigafactory <obj> European Union <rel> mainly_supplies",
      "<entity> Berlin Gigafactory <attribute> country <value> Germany"
    ],
    "tuple": [
      "<subj> Berlin Gigafactory <obj> European Union <rel> mainly_supplies <time> 2024",
      "<subj> Berlin Gigafactory <obj> European Union <rel> mainly_supplies <time> 2024 <location> Germany"
    ],
    "event": [
      "<event> Berlin Gigafactory expansion <event_attribute> start_time 2024",
      "<event> Berlin Gigafactory expansion <event_attribute> location Germany"
    ]
  }
]
```

The advantage of this design is that the source text, graph results, and downstream task inputs can all be kept in the same JSON object. Later, whether you want to do filtering, evaluation, QA generation, or path reasoning, you can continue processing directly from the same file.

## 4. Principles for Storage

To make graph data easier to reuse in later stages, it is recommended to follow these principles:

- Keep the same kind of structure in the same field, for example, use `triple` mainly for triples and `tuple` mainly for quadruples and higher-order tuples
- Let one sample correspond to one JSON object, so it can stay aligned with the original text, QA pairs, and evaluation results
- Keep the format readable, searchable, and easy to process in batches, so it works smoothly in automated Pipelines

## 5. Summary

We use `json` files to store knowledge graphs because this format is better suited for batch processing, format iteration, manual inspection, and workflow reuse during the data preparation stage. For the graph content itself, we define unified string formats for different graph types, such as relational triples, attribute triples, temporal quadruples, hyper-relational knowledge graphs, and event knowledge graphs, and then store these results as lists in JSON fields. In this way, we preserve graph structure information while keeping the overall data processing workflow lightweight, flexible, and maintainable.
