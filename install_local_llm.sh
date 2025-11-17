#!/bin/bash

# 本地LLM环境安装脚本
# 适用于Ubuntu/WSL环境

# 切换到你的项目根目录 (仅用 Linux 路径！)
cd ~/course_pilot || exit 1
echo "当前目录: $(pwd)"

echo "📦 开始安装本地LLM环境..."

# 检查模型文件
MODEL_PATH="models/Qwen_Qwen3-4B-Instruct-2507-Q4_K_M.gguf"
if [ ! -f "$MODEL_PATH" ]; then
    echo "⚠️  警告：模型文件不存在，请手动下载模型文件"
else
    echo "✅ 检测到模型文件: $MODEL_PATH"
fi

# 检查Python版本
python3 --version
echo "✅ Python环境检查完成"

# 安装依赖（只需要一次 cd，不要切换路径了！）
pip3 install --upgrade pip setuptools wheel
pip3 install -r backend/requirements.txt

# 检查llama-cpp-python
if ! python3 -c "import llama_cpp" 2>/dev/null; then
    echo "🔧 安装llama-cpp-python..."
    pip3 install llama-cpp-python
fi

echo "✅ 安装完成！"
echo ""
echo "🚀 启动本地LLM服务器："
echo "source venv/bin/activate"
echo "python3 backend/llm-proxy.py"
echo ""
echo "🌐 前端服务（新终端）："
echo "cd ~/course_pilot"
echo "npm run dev"

echo "📖 使用说明："
echo "1. 先启动本地LLM服务器（端口5001）"
echo "2. 再启动前端服务"
echo "3. 访问 http://localhost:3000 使用课程推荐系统"
