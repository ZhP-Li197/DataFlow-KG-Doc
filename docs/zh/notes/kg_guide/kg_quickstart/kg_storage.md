---
title: 如何存储图谱
icon: material-symbols:storage-rounded
createTime: 2026/04/29 12:00:00
permalink: /zh/kg_guide/kg_quickstart/kg_storage/
---

# 如何存储图谱

## 1. 总体介绍

在 DataFlow-KG 中，我们主要采用 `json` 文件来存储知识图谱。 一个最简单的例子如下：

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

我们没有将 Neo4j 作为默认存储方式，是由于DataFlow-KG的工作重点首先是**数据准备**。 在数据准备阶段，一份知识图谱数据往往会经历下面这些过程：

- 从原始文本中抽取实体、关系、属性、事件
- 对抽取结果进行清洗、补全、过滤和规范化
- 反复修改样本格式，适配不同图谱类型

在这个阶段，数据通常还没有完全稳定，格式也经常会变化。相比之下，`json` 文件有几个明显优势：

- 更适合批处理：一批样本就是一个文件，便于直接送入 Pipeline
- 更适合数据准备：新增字段、删减字段、改动格式都很方便
- 更容易版本管理：配合 Git 就能追踪数据格式和样本内容的变化
- 更容易迁移：不依赖额外数据库服务，拷贝文件即可复现

Neo4j 更适合在图结构已经比较稳定之后，承担在线检索、复杂路径查询、图分析等任务；而在我们的数据准备流程中，更重要的是让图谱结果能够被快速生成、快速修改、快速复用。因此，我们优先选择 `json` 文件作为默认存储方式。

我们提供 `KGRelationTripleVisualization` 算子来输出 html 文件，对图谱进行可视化。

## 2. 具体存储格式

不同类型的知识图谱，我们会定义不同的字符串格式，再把这些字符串以列表形式存入 JSON 字段中。

### 2.1 实体关系实体

关系三元组采用下面的格式：

```text
<subj> ... <obj> ... <rel> ...
```

例如：

```text
<subj> Henry <obj> Maria Rodriguez <rel> is_trained_by
```

在 JSON 文件中通常写成：

```json
{
  "triple": [
    "<subj> Henry <obj> Maria Rodriguez <rel> is_trained_by"
  ]
}
```

### 2.2 实体属性属性值

属性三元组采用下面的格式：

```text
<entity> ... <attribute> ... <value> ...
```

例如：

```text
<entity> Henry <attribute> nationality <value> British
```

在 JSON 文件中通常写成：

```json
{
  "triple": [
    "<entity> Henry <attribute> nationality <value> British"
  ]
}
```

### 2.3 时序实体关系实体

时序关系四元组采用下面的格式：

```text
<subj> ... <obj> ... <rel> ... <time> ...
```

例如：

```text
<subj> Henry <obj> Maria Rodriguez <rel> is_trained_by <time> 2021
```

在 JSON 文件中通常写成：

```json
{
  "tuple": [
    "<subj> Henry <obj> Maria Rodriguez <rel> is_trained_by <time> 2021"
  ]
}
```

### 2.4 时序实体属性属性值

时序属性四元组采用下面的格式：

```text
<entity> ... <attribute> ... <value> ... <time> ...
```

例如：

```text
<entity> Henry <attribute> job_title <value> Research Assistant <time> 2021
```

在 JSON 文件中通常写成：

```json
{
  "tuple": [
    "<entity> Henry <attribute> job_title <value> Research Assistant <time> 2021"
  ]
}
```

### 2.5 超关系图谱

超关系图谱会在基本关系之外，继续给关系附加额外属性。一个常见形式是：

```text
<subj> ... <obj> ... <rel> ... <rel_attribute> ...
```

如果关系带有多个属性，也可以继续向后扩展。例如：

```text
<subj> Berlin Gigafactory <obj> European Union <rel> mainly_supplies <time> 2024 <location> Germany
```

在 JSON 文件中通常写成：

```json
{
  "tuple": [
    "<subj> Berlin Gigafactory <obj> European Union <rel> mainly_supplies <time> 2024 <location> Germany"
  ]
}
```

从这个角度看，**时序实体关系实体本质上也可以看成一种特殊的超关系图谱**，因为它是在基础关系 `<subj> - <obj> - <rel>` 之外，又补充了一个关系属性 `<time>`。

### 2.6 事件图谱

除了上面几类常见图谱，我们还支持事件图谱。事件图谱的核心不是直接描述两个实体之间的关系，而是描述一个事件及其属性。一个常见形式是：

```text
<event> ... <event_attribute> ...
```

例如：

```text
<event> Berlin Gigafactory expansion <event_attribute> start_time 2024
```

或者：

```text
<event> Berlin Gigafactory expansion <event_attribute> location Germany
```

在 JSON 文件中，可以单独放在 `event` 字段中：

```json
{
  "event": [
    "<event> Berlin Gigafactory expansion <event_attribute> start_time 2024",
    "<event> Berlin Gigafactory expansion <event_attribute> location Germany"
  ]
}
```

## 3. 一个完整的存储示例

实际使用时，一个样本里往往不只包含一种图谱结果。比如同一条文本，既可以保存关系三元组，也可以保存属性三元组、时序四元组和事件信息：

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

这种方式的好处是，一个样本的原文、图谱结果和后续任务输入都可以放在同一个 JSON 对象里，后续无论是做过滤、评估、问答生成，还是做路径推理，都可以直接基于这个文件继续处理。

## 4. 存储时的几个原则

为了让图谱数据在后续流程中更容易复用，通常建议遵循下面几个原则：

- 同一个字段内尽量保存同一类结构，例如 `triple` 主要存三元组，`tuple` 主要存四元组和更高元组
- 一条样本对应一个 JSON 对象，方便和原始文本、问答、评测结果对齐
- 尽量让格式可读、可检索、可批量处理，便于后续自动化 Pipeline 使用
