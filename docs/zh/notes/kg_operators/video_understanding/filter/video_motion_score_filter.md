---
title: 视频运动分数过滤（VideoMotionScoreFilter）
createTime: 2025/01/20 10:00:00
permalink: /zh/mm_operators/video_understanding/filter/video_motion_score_filter/
---

## 📘 概述

`VideoMotionScoreFilter` 是一个基于**视频运动分数**的过滤算子。使用 Farneback 光流算法计算视频运动分数（光流幅度均值），保留运动分数在指定范围内的样本。支持帧大小调整、相对归一化、可配置采样帧率等参数。

---

## 🏗️ `__init__` 函数

```python
def __init__(
    self,
    min_score: float = 0.25,
    max_score: float = sys.float_info.max,
    sampling_fps: float = 2.0,
    size: Union[int, Tuple[int], Tuple[int, int], None] = None,
    max_size: Optional[int] = None,
    divisible: int = 1,
    relative: bool = False,
    any_or_all: str = "any",
    **kwargs
):
    ...
```

## 🧾 `__init__` 参数说明

| 参数名            | 类型                                    | 默认值                  | 说明                                    |
| :------------- | :------------------------------------ | :------------------- | :------------------------------------ |
| `min_score`    | `float`                               | `0.25`               | 保留样本的最小运动分数                              |
| `max_score`    | `float`                               | `sys.float_info.max` | 保留样本的最大运动分数                              |
| `sampling_fps` | `float`                               | `2.0`                | 光流计算的采样帧率（帧/秒）                           |
| `size`         | `int` \| `Tuple[int]` \| `Tuple[int, int]` \| `None` | `None` | 计算光流前调整帧大小，可为单个整数（短边）或 (height, width) |
| `max_size`     | `Optional[int]`                      | `None`               | 调整后较长边的最大允许值                             |
| `divisible`    | `int`                                 | `1`                  | 尺寸必须能被该数整除                               |
| `relative`     | `bool`                                | `False`              | 是否归一化光流幅度（相对于帧对角线长度）                      |
| `any_or_all`   | `str`                                 | `"any"`              | 多视频保留策略：`"any"` 或 `"all"`                  |
| `**kwargs`     | -                                     | -                    | Farneback 算法的额外参数（pyr_scale, levels, winsize 等） |

---

## ⚡ `run` 函数

```python
def run(
    self,
    storage: DataFlowStorage,
    video_key: str = "video_path"
):
    ...
```

执行算子主逻辑：从 storage 读取数据表，按行计算视频运动分数，仅保留运动分数在指定范围内的样本行，并写回存储。

## 🧾 `run` 参数说明

| 参数名         | 类型                | 默认值           | 说明              |
| :---------- | :---------------- | :------------ | :-------------- |
| `storage`   | `DataFlowStorage` | -             | Dataflow 数据存储对象 |
| `video_key` | `str`             | `"video_path"` | 视频路径列名          |

---

## 🧠 示例用法

```python
from dataflow.utils.storage import FileStorage
from dataflow.operators.core_vision import VideoMotionScoreFilter

# Step 1: 准备 FileStorage（至少包含 video_path 列）
storage = FileStorage(
    first_entry_file_name="data/video_motion_input.jsonl",
    cache_path="./cache_local",
    file_name_prefix="video_motion_filter",
    cache_type="jsonl"
)

# Step 2: 初始化算子
filter_op = VideoMotionScoreFilter(
    min_score=2.0,
    max_score=14.0,
    sampling_fps=2.0,
    size=None,  # 不调整大小
    relative=False,  # 不归一化
    any_or_all="any"
)

# Step 3: 执行过滤（将只保留运动分数在指定范围内的样本）
output_cols = filter_op.run(
    storage=storage.step(),
    video_key="video_path"
)
print(output_cols)  # ["video_motion_score", "passed_filter"]
```

---

### 🧾 默认输出格式（Output Format）

| 字段                  | 类型      | 说明                    |
| :----------------- | :------ | :-------------------- |
| `video_motion_score` | `float` | 视频运动分数（光流幅度均值），失败时为 -1.0 |
| `passed_filter`     | `bool`  | 是否通过过滤（运动分数在指定范围内）    |

示例输入：

```jsonl
{"video_path": "./test/video1.mp4"}
{"video_path": "./test/video2.mp4"}
```

示例输出：

```jsonl
{"video_path": "./test/video1.mp4", "video_motion_score": 5.2, "passed_filter": true}
{"video_path": "./test/video2.mp4", "video_motion_score": 0.1, "passed_filter": false}
```

---

## 🔗 相关链接

- **代码:** [VideoMotionScoreFilter](https://github.com/OpenDCAI/DataFlow-MM/blob/main/dataflow/operators/core_vision/filter/video_motion_score_filter.py)
