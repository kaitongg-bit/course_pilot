# 本地LLM课程推荐系统

## 项目概述

本项目已从Gemini API迁移到本地LLM（千问模型 + llama.cpp），提供完全离线的课程推荐服务。

## 技术栈

- **前端**: HTML/CSS/JavaScript, Tailwind CSS
- **后端**: Python Flask + llama-cpp-python
- **AI模型**: Qwen2.5-7B-Instruct (千问模型)
- **本地推理**: llama.cpp

## 快速开始

### 1. 安装依赖

```bash
# 运行安装脚本
chmod +x install_local_llm.sh
./install_local_llm.sh

# 或手动安装
pip3 install -r backend/requirements.txt
```

### 2. 下载模型文件

下载Qwen2.5-7B-Instruct模型文件：

```bash
# 创建模型目录
mkdir -p models

# 下载模型（选择其中一个）
# 方式1：使用wget（如果链接可用）
wget -O models/qwen2.5-7b-instruct-q4_0.gguf "https://huggingface.co/Qwen/Qwen2.5-7B-Instruct-GGUF/resolve/main/qwen2.5-7b-instruct-q4_0.gguf"

# 方式2：手动下载后放入models目录
```

### 3. 启动服务

```bash
# 终端1：启动本地LLM服务器
chmod +x start_llm_server.sh
./start_llm_server.sh

# 终端2：启动前端服务
npm run dev
# 或直接打开 frontend_example.html
```

### 4. 访问系统

打开浏览器访问：http://localhost:3000

## 系统架构

```
前端 (HTML/JS) → 本地LLM代理 (Flask) → Qwen模型 (llama.cpp)
    ↓
课程推荐结果 ← 智能分析 ← 模型推理
```

## 功能特性

✅ **完全离线**: 无需互联网连接，保护隐私
✅ **智能推荐**: 基于用户职业目标和技能匹配
✅ **个性化摘要**: 为每门课程生成专属推荐理由
✅ **评价审核**: AI智能审核用户评价内容
✅ **多模态支持**: 支持文本分析、摘要生成等

## 文件结构

```
course_pilot/
├── backend/
│   ├── llm-proxy.py          # 本地LLM代理服务器
│   └── requirements.txt      # Python依赖
├── frontend/
│   ├── sidepanel.js          # 更新后的前端逻辑
│   └── sidepanel.html        # 主界面
├── agents/
│   ├── index.js              # Agent调度总线
│   ├── matchAgent.js         # 课程匹配Agent
│   ├── summarizeAgent.js     # 摘要生成Agent
│   └── reviewAuditAgent.js   # 评价审核Agent
├── models/
│   └── qwen2.5-7b-instruct-q4_0.gguf  # 模型文件
└── 脚本文件
    ├── install_local_llm.sh  # 安装脚本
    └── start_llm_server.sh  # 启动脚本
```

## 模型配置

当前系统使用Qwen2.5-7B-Instruct模型，支持以下配置：

- **模型大小**: 7B参数（量化版）
- **推理速度**: 约10-20 tokens/秒（取决于硬件）
- **内存占用**: ~4GB RAM
- **支持功能**: 文本生成、对话、分析等

## 故障排除

### 常见问题

1. **模型下载失败**
   - 手动从HuggingFace下载模型文件
   - 确保文件名为 `qwen2.5-7b-instruct-q4_0.gguf`

2. **Python依赖问题**
   ```bash
   pip3 install --upgrade pip
   pip3 install -r backend/requirements.txt
   ```

3. **端口冲突**
   - 修改 `backend/llm-proxy.py` 中的端口号
   - 同时更新前端调用地址

4. **内存不足**
   - 使用更小的量化版本（如Q2、Q3）
   - 增加系统交换空间

## 性能优化

### 硬件要求
- **最低**: 8GB RAM, 4核CPU
- **推荐**: 16GB+ RAM, 8核CPU
- **最佳**: 32GB RAM, GPU加速

### 模型优化
- 使用量化版本减少内存占用
- 调整上下文长度限制
- 优化批处理大小

## 开发说明

### 添加新功能
1. 在 `backend/llm-proxy.py` 中添加新的API端点
2. 在前端相应文件中调用新API
3. 在Agent中添加相应的处理逻辑

### 模型替换
如果要使用其他模型，只需：
1. 下载新的GGUF格式模型文件
2. 修改 `backend/llm-proxy.py` 中的模型路径
3. 确保模型格式兼容llama.cpp

## 许可证

本项目基于MIT许可证开源。