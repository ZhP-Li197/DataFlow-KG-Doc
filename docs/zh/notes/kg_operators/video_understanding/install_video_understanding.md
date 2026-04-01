---
title: Video环境安装
createTime: 2025/06/09 10:29:31
permalink: /zh/mm_operators/install_video_understanding/
---

## 📦 安装依赖

DataFlow-MM 的视频相关算子依赖已包含在基础安装中。

### 基础安装

```bash
cd DataFlow-MM
conda create -n Dataflow-MM python=3.12
conda activate Dataflow-MM
pip install -e .
```

执行 `pip install -e .` 会自动安装 `requirements.txt` 中的所有依赖，包括视频处理所需的核心库：
- `opencv-python` - 视频读取和处理
- `scenedetect` - 视频场景检测
- `av` - PyAV 视频编解码
- `imageio-ffmpeg` - 视频IO
- `ffmpeg-python` - FFmpeg Python封装
- `clip` - CLIP模型（美学评估）
- `cpbd` - 模糊度检测
- `paddleocr` - OCR文字检测
- 以及其他视频处理相关依赖

---

## 🎯 VLM 模型支持（推荐）

如果需要使用 VLM 模型进行视频理解（如视频描述生成、视频问答等），需要额外安装：

```bash
pip install -e ".[vllm,vqa]"
```

---

## 🔧 系统依赖

### FFmpeg（必需）

视频切割等操作需要系统安装 FFmpeg：

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**验证安装:**
```bash
ffmpeg -version
```

---

## 🚀 PaddlePaddle GPU 安装（OCR 必需）

如果需要使用 OCR 相关算子（如 VideoOCREvaluator），必须单独安装 PaddlePaddle GPU 版本：

```bash
# 根据您的 CUDA 版本选择对应的 PaddlePaddle
# CUDA 12.6 示例：
pip install paddlepaddle-gpu==3.0.0 --index-url https://www.paddlepaddle.org.cn/packages/stable/cu126/

# 其他 CUDA 版本请参考：https://www.paddlepaddle.org.cn/
```
