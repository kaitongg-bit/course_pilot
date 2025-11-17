#!/bin/bash

# 启动本地LLM服务器脚本

echo "🚀 启动本地LLM服务器..."

# 检查后端目录是否存在
if [ ! -d "backend" ]; then
    echo "❌ 错误：backend目录不存在"
    exit 1
fi

# 检查Python依赖
if ! python3 -c "import flask" 2>/dev/null; then
    echo "❌ 错误：Flask未安装，请先运行 install_local_llm.sh"
    exit 1
fi

if ! python3 -c "import llama_cpp" 2>/dev/null; then
    echo "❌ 错误：llama-cpp-python未安装，请先运行 install_local_llm.sh"
    exit 1
fi

# 检查模型文件
MODEL_PATH="models/Qwen_Qwen3-4B-Instruct-2507-Q4_K_M.gguf"
if [ ! -f "$MODEL_PATH" ]; then
    echo "⚠️  警告：模型文件不存在，将使用备用方式"
    echo "请在启动后手动下载模型或使用在线服务"
fi

# 启动服务器
cd //wsl.localhost/Ubuntu-24.04/home/kita/course_pilot
python3 backend/llm-proxy.py

echo "✅ 服务器已启动，访问 http://localhost:5001"