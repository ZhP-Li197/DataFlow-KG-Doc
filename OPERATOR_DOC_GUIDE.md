# 算子文档编写与并入指南

这份文档用于批量编写 `kg_operators` 下的算子文档。目标是把“怎么写”和“怎么并入站点”放到一处，写一篇就能按同样流程继续写下一篇。

## 1. 写之前先确定 4 个信息

每新增一个算子文档，先把下面 4 个信息定下来：

| 项目 | 示例 | 说明 |
| :-- | :-- | :-- |
| 模态目录 | `image_understanding` | 可选值参考当前仓库目录结构 |
| 算子分类 | `generate` | 常见有 `generate`、`eval`、`filter`、`refine` |
| 文件名 | `image_caption.md` | 建议和算子名、代码文件保持一致 |
| 类名/标题 | `ImageCaptionGenerator` | 文档标题建议直接写算子类名 |

当前仓库里常见的放置路径如下：

| 模态 | 中文目录 | 英文目录 | 常见分类 |
| :-- | :-- | :-- | :-- |
| 图像理解 | `docs/zh/notes/kg_operators/image_understanding/` | `docs/en/notes/kg_operators/image_understanding/` | `generate` / `eval` / `filter` / `refine` |
| 视频理解 | `docs/zh/notes/kg_operators/video_understanding/` | `docs/en/notes/kg_operators/video_understanding/` | `generate` / `eval` / `filter` |
| 音频理解 | `docs/zh/notes/kg_operators/audio_understanding/` | `docs/en/notes/kg_operators/audio_understanding/` | `generate` / `eval` / `filter` / `generaterow` |
| 图像/视频生成 | `docs/zh/notes/kg_operators/image_video_generation/` | `docs/en/notes/kg_operators/image_video_generation/` | 当前以单页为主 |

## 2. 推荐写法

一篇算子文档尽量固定包含这些部分：

1. 概述
2. `__init__` 函数
3. `__init__` 参数说明
4. `run` 函数
5. `run` 参数说明
6. 示例用法
7. 默认输出格式
8. 示例输入
9. 示例输出
10. 可选补充：自定义 Prompt、注意事项、相关链接

这样做的好处是：

1. 不同算子的文档结构统一，读者更容易横向对比。
2. 后面批量补文档时，只改类名、参数和示例即可。
3. 中英文文档可以一一对应，维护成本最低。

## 3. 中文模板

下面这个模板可以直接复制到对应的中文目录里。

```md
---
title: 算子类名
createTime: 2026/04/01 16:00:00
permalink: /zh/mm_operators/模态目录/算子分类/文件名去掉md/
---

## 概述

`算子类名` 是一个用于说明算子用途的算子。
它的输入是什么，输出是什么，适合什么场景。

可补充的要点：

- 是否依赖某类模型服务
- 是否支持批处理
- 是否会读写某些字段
- 典型应用场景是什么

---

## `__init__` 函数

```python
def __init__(
    self,
    ...
):
    ...
```

## `__init__` 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `xxx` | `str` | `None` | 参数说明 |

---

## `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage,
    ...
):
    ...
```

`run` 是算子主逻辑，建议用一句话或一小段话说明执行流程。

例如：
读取输入 -> 校验字段 -> 调用模型/规则 -> 生成结果 -> 写回输出字段。

## `run` 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow 数据存储对象 |

---

## 示例用法

```python
from your_package import YourOperator

# Step 1: 准备模型服务或依赖

# Step 2: 准备输入数据

# Step 3: 初始化并运行算子
operator = YourOperator(...)
operator.run(
    storage=storage,
    ...
)
```

---

## 默认输出格式

| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `input` | `str` | 输入字段 |
| `output` | `str` | 输出字段 |

---

### 示例输入

```json
{"input": "demo"}
```

### 示例输出

```json
{"input": "demo", "output": "result"}
```

---

## 可选补充

### 自定义 Prompt

如果算子支持 prompt、模板或可插拔策略，可以单独补这一节。

### 注意事项

- 输入字段必须存在
- 输出字段不要与已有关键字段冲突
- 如果依赖模型服务，注明模型版本或依赖条件

### 相关链接

- 代码链接
- 测试脚本链接
- 相关 pipeline 文档链接
```

## 4. 英文模板

英文文档建议和中文结构完全对应，只翻译内容，不改章节顺序。

```md
---
title: OperatorClassName
createTime: 2026/04/01 16:00:00
permalink: /en/mm_operators/modality/category/file_name_without_md/
---

## Overview

`OperatorClassName` is an operator used to describe the operator purpose.
Explain the input, the output, and the target use cases here.

Suggested points:

- whether it depends on a model serving component
- whether it supports batch processing
- which fields it reads and writes
- typical usage scenarios

---

## `__init__` Function

```python
def __init__(
    self,
    ...
):
    ...
```

## `__init__` Parameters

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `xxx` | `str` | `None` | parameter description |

---

## `run` Function

```python
def run(
    self,
    storage: DataFlowStorage,
    ...
):
    ...
```

Describe the execution flow of `run` in one short paragraph.

For example:
read input -> validate fields -> call model/rules -> generate result -> write back output.

## `run` Parameters

| Parameter | Type | Default | Description |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow storage object |

---

## Example Usage

```python
from your_package import YourOperator

# Step 1: Prepare model serving or dependencies

# Step 2: Prepare input data

# Step 3: Initialize and run the operator
operator = YourOperator(...)
operator.run(
    storage=storage,
    ...
)
```

---

## Default Output Format

| Field | Type | Description |
| :-- | :-- | :-- |
| `input` | `str` | input field |
| `output` | `str` | output field |

---

### Example Input

```json
{"input": "demo"}
```

### Example Output

```json
{"input": "demo", "output": "result"}
```

---

## Optional Sections

### Custom Prompt

Add this section when the operator supports prompt customization or strategy injection.

### Notes

- make sure required input fields exist
- avoid conflicting output field names
- if model serving is required, document the dependency clearly

### Related Links

- source code
- test script
- related pipeline docs
```

## 5. 并入站点的流程

每新增一个算子文档，按下面顺序做：

### 第一步：选目录并创建中英文文件

例如要新增一个图像 `generate` 类算子：

- 中文文件：`docs/zh/notes/kg_operators/image_understanding/generate/xxx.md`
- 英文文件：`docs/en/notes/kg_operators/image_understanding/generate/xxx.md`

建议中英文文件名保持一致。

### 第二步：补 frontmatter

最少保留这几个字段：

```yaml
---
title: 算子类名
createTime: 2026/04/01 16:00:00
permalink: /zh/mm_operators/模态目录/算子分类/文件名去掉md/
---
```

英文文档把 `/zh/` 换成 `/en/`。

### 第三步：补正文

优先把下面内容补完整：

1. 算子用途
2. 初始化参数
3. `run` 参数
4. 最小可运行示例
5. 输入输出格式

如果某个算子支持自定义 prompt、阈值、规则配置，再补“可选补充”。

### 第四步：把新文档加入 sidebar

中文 sidebar 文件：

- `docs/.vuepress/notes/zh/kg_operators.ts`

英文 sidebar 文件：

- `docs/.vuepress/notes/en/kg_operators.ts`

你需要把新文件名加入对应的 `items` 列表中。例如新增图像 `generate` 算子：

```ts
{
    text: "generate",
    collapsed: false,
    prefix: 'generate/',
    items: [
        'image_caption',
        'your_new_operator'
    ]
}
```

注意：

1. `items` 里写的是文件名，不带 `.md`
2. 中文和英文两边都要加
3. 要放到正确的模态和分类下面

### 第五步：本地预览

在项目根目录执行：

```bash
npm run docs:dev
```

重点检查：

1. 新页面能否正常打开
2. 左侧 sidebar 是否出现新文档
3. 中英文跳转是否正常
4. 代码块、表格、示例 JSON 是否渲染正常

### 第六步：构建检查

提交前执行：

```bash
npm run docs:build
```

如果构建不过，优先检查：

1. 文件路径是否写错
2. sidebar 中的文件名是否和真实文件一致
3. permalink 是否重复
4. Markdown 代码块是否闭合

## 6. 批量写算子时的推荐节奏

如果你接下来要连续写很多算子，建议每篇都按下面节奏推进：

1. 先补中文版本，确认结构和示例正确
2. 复制成英文版本，再做翻译
3. 同步加入中英文 sidebar
4. 本地预览确认
5. 多写几篇后统一跑一次 `npm run docs:build`

## 7. 自检清单

每篇算子文档完成后，过一遍下面这份清单：

- 文件放在正确目录下
- 中英文文件都已创建
- 文件名一致
- `title` 已填写
- `permalink` 已填写且不重复
- `__init__` 和 `run` 参数表已补全
- 示例代码可读
- 输入输出样例完整
- sidebar 已加入中文配置
- sidebar 已加入英文配置
- `docs:dev` 页面显示正常
- `docs:build` 构建通过

## 8. 一个可直接替换的最小示例

把下面内容整体复制后，替换占位符即可开始写第一篇。

```md
---
title: YourOperatorName
createTime: 2026/04/01 16:00:00
permalink: /zh/mm_operators/image_understanding/generate/your_operator_name/
---

## 概述

`YourOperatorName` 是一个用于......

---

## `__init__` 函数

```python
def __init__(
    self,
    dependency: SomeDependency
):
    ...
```

## `__init__` 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `dependency` | `SomeDependency` | - | 依赖说明 |

---

## `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage,
    input_key: str = "input",
    output_key: str = "output"
):
    ...
```

## `run` 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
| :-- | :-- | :-- | :-- |
| `storage` | `DataFlowStorage` | - | Dataflow 数据存储对象 |
| `input_key` | `str` | `"input"` | 输入字段名 |
| `output_key` | `str` | `"output"` | 输出字段名 |

---

## 示例用法

```python
operator = YourOperatorName(...)
operator.run(
    storage=storage,
    input_key="input",
    output_key="output"
)
```

---

## 默认输出格式

| 字段 | 类型 | 说明 |
| :-- | :-- | :-- |
| `input` | `str` | 输入字段 |
| `output` | `str` | 输出字段 |

---

### 示例输入

```json
{"input": "demo"}
```

### 示例输出

```json
{"input": "demo", "output": "result"}
```
```
