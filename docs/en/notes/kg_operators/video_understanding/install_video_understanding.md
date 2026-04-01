---
title: Video Environment Installation
createTime: 2025/06/09 10:29:31
permalink: /en/mm_operators/install_video_understanding/
---

## 📦 Installing Dependencies

Video-related operator dependencies in DataFlow-MM are included in the base installation.

### Basic Installation

```bash
cd DataFlow-MM
conda create -n Dataflow-MM python=3.12
conda activate Dataflow-MM
pip install -e .
```

Running `pip install -e .` automatically installs all dependencies from `requirements.txt`, including core libraries for video processing:
- `opencv-python` - Video reading and processing
- `scenedetect` - Video scene detection
- `av` - PyAV video codec
- `imageio-ffmpeg` - Video IO
- `ffmpeg-python` - FFmpeg Python wrapper
- `clip` - CLIP model (aesthetic evaluation)
- `cpbd` - Blur detection
- `paddleocr` - OCR text detection
- And other video processing dependencies

---

## 🎯 VLM Model Support (Recommended)

If you need to use VLM models for video understanding (e.g., video caption generation, video QA), install additional packages:

```bash
pip install -e ".[vllm,vqa]"
```

---

## 🔧 System Dependencies

### FFmpeg (Required)

FFmpeg is required for video cutting and other operations:

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Verify Installation:**
```bash
ffmpeg -version
```

---

## 🚀 PaddlePaddle GPU Installation (Required for OCR)

If you need to use OCR-related operators (e.g., VideoOCREvaluator), you must install PaddlePaddle GPU version separately:

```bash
# Choose the version matching your CUDA version
# Example for CUDA 12.6:
pip install paddlepaddle-gpu==3.0.0 --index-url https://www.paddlepaddle.org.cn/packages/stable/cu126/

# For other CUDA versions, see: https://www.paddlepaddle.org.cn/
```
