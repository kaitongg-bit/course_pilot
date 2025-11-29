#!/bin/bash

echo "🚀 启动本地LLM服务器..."

# Always run relative to this script's directory
cd "$(dirname "$0")" || exit 1

# Ensure venv exists
if [ ! -d "venv" ]; then
    echo "❌ 未找到虚拟环境 venv，请先运行 install_local_llm.sh"
    exit 1
fi

# Activate venv
echo "📦 正在激活虚拟环境..."
source venv/bin/activate

# Check llama-cpp-python availability
python3 - << 'EOF'
import sys
try:
    import llama_cpp
except Exception as e:
    print("❌ 错误：llama-cpp-python 未安装在 venv 中，请运行 install_local_llm.sh")
    sys.exit(1)
EOF

echo "✨ 启动 Python 后端..."

# Use the correct backend filename (with hyphen)
python3 backend/llm-proxy.py

