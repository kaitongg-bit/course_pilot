#!/bin/bash
# 启动 Course Pilot 后端服务器

echo "🚀 启动 Course Pilot 混合 RAG 后端"
echo "=================================="
echo ""

# 检查是否在 backend 目录
if [ ! -f "llm-proxy.py" ]; then
    echo "📁 切换到 backend 目录..."
    cd backend
fi

# 从 .env 文件加载环境变量
if [ -f ".env" ]; then
    echo "🔑 从 .env 文件加载配置..."
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "⚠️  警告: 未找到 .env 文件"
    echo "请在 backend/.env 中设置必要的环境变量"
    exit 1
fi

# 检查依赖是否已安装
if ! python3 -c "import chromadb" 2>/dev/null; then
    echo "📦 首次运行 - 安装依赖..."
    pip install -r requirements.txt
    echo ""
fi

echo "✅ 配置已加载"
echo "🔧 启动服务器..."
echo ""

# 启动服务器
python3 llm-proxy.py
