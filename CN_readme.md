
# 本地LLM课程推荐系统（AI Course Pilot）——全流程新手友好版


***

## 0. 环境要求与操作系统建议

- **强烈建议使用 Ubuntu（含WSL子系统）或 Mac OS 环境开发/运行本项目。**
- **请勿在 Windows 原生环境运行本项目！不建议在 Windows 原生命令下任何操作。**
- 如必须在 Windows 下开发，请先用 Microsoft Store 安装 WSL，并安装 Ubuntu 子系统，所有操作都在 Ubuntu 终端完成。

***

## 1. 推荐编辑器与AI助手

- 推荐配合 AI 编辑器与工具（如 CodeBuddy、Cursor、VSCode+AI助手、Perplexity、Claude等）开发，更高效排错。
- 任何AI代码生成建议请优先用“对话模式”或“小块代码补全”，不要批量自动重写文件。
- 遇到环境或命令报错及时 Google。

***

## 2. 项目克隆（私有仓库Token设置）

- 仓库地址为：https://github.com/kaitongg-bit/course_pilot.git
- **本仓库为私有，克隆时需GitHub账号和个人Token授权，具体如下：**

1. 在终端输入以下命令：

```
git clone https://github.com/kaitongg-bit/course_pilot.git
```

2. 若提示输入用户名和密码：
    - 用户名：你的GitHub账号名
    - 密码：你的 [GitHub Personal Access Token]
3. Token获取流程：
    - 打开GitHub主页（右上角头像） → Settings → Developer settings → Personal access tokens → Generate new token
    - 选择repo相关权限后生成，复制保存（仅显示一次，请务必妥善保存！）
    - 详细过程请Google“GitHub personal access token克隆私有仓库”

***

## 3. Node.js依赖安装（提前安装）

- 前端如用到打包/构建（如tailwind、js工具），务必在前端目录先安装 node_modules 依赖。
- 在前端目录下，打开终端执行：

```
npm install
```

自动拉取所有前端依赖，生成node_modules文件夹。**不要手动下载或编辑 node_modules 文件夹。**

***

## 4. 后端环境配置及依赖安装（每次都必须激活虚拟环境！）

1. **创建并激活Python虚拟环境（每次新终端都要先执行激活！）**

```
python3 -m venv venv
source venv/bin/activate
```

激活成功后命令行前面会出现(venv)标志。
2. **安装依赖（在项目根目录终端输入）：**

```
pip install -r requirements.txt
```

pip或依赖包报错请多尝试几次，并Google错误信息查解决方法。

***

## 5. 下载/配置LLM模型文件

1. **在终端运行模型下载脚本（项目根目录）：**

```
python download.py
```

2. 若卡住或下载失败，可直接Google模型文件手动下载并放入models/文件夹。

***

## 6. 启动后端服务（说明“直接在终端输入”如果使用Ubuntu务必注意你开启新终端的时候选中的就是这个Ubuntu的环境而不是powershell，有关Ubuntu最好咨询AI我也不是很会但我记得是要设置密码输入密码用户名什么的）

- 每次启动前都要先 source venv/bin/activate（虚拟环境），否则无法运行，强烈提醒队友不要忽略！
- 在项目根目录终端输入：

```
python llm-proxy.py
```

- 出现“本地LLM代理服务器启动在端口”即为成功。端口冲突/路径报错请根据终端报错Google解决。

***

## 7. 前端启动与开发说明

- 主文件为 sidepanel.html（页面）、sidepanel.js（逻辑）、tailwind.css（样式）。
- 前端扩展模式开发：Chrome扩展 → “开发者模式” → “加载已解压的扩展” → 勾选项目前端目录即可，如：\\wsl.localhost\Ubuntu-24.04\home\kita\course_pilot。
- 修改页面/功能主要在 sidepanel.js、sidepanel.html 文件中。

***

## 8. 项目结构与无用文件说明

- 项目目录下如有 agents、test、script 等文件夹，多为实验代码或遗留文件，团队成员不用关心。
- 不要随意删除 backend、frontend、models 三个主文件夹，其余如无明确用处可忽略。

***

## 9. 团队协作与分支开发规范

- 新功能/修bug请先新建分支，在分支上开发。

```
git checkout -b feat-你的分支名
```

- 提交代码时务必写明 commit 说明（中英文可），避免update类型无备注commit。

```
git add .
git commit -m "优化推荐逻辑、修复路径兼容问题"
git push origin feat-你的分支名
```

- 合并到主分支需发pull request并团队审核。
- AI编辑器批量改代码出错请立刻用 git log/git checkout/git reflog 指令恢复历史。

***

## 10. 常见问题/解决方法

- **依赖安装失败**：多用命令行pip install，多激活虚拟环境，Google报错信息找类似解决方案。
- **模型下载慢或卡死**：Google相关模型地址手动下载到 models/ 文件夹中。
- **端口冲突**：修改 llm-proxy.py 和前端API端口同步一致，遇报错先查报错关键字Google。
- **前端扩展加载失败**：Google Chrome插件开发、检查manifest权限、开发者模式勾选。
- **Windows相关兼容问题**：请全部用Ubuntu或Mac环境，无需任何Windows命令。

***

## 11. 终端与Git新手必备命令

- cd 文件夹名：进入指定目录
- ls/dir：显示当前目录文件
- pwd：打印当前路径
- Ctrl+C：终止当前程序
- git branch/status/checkout/log：版本管理、代码恢复必备命令
- 遇到不懂的命令及任何报错，强烈建议问AI
***


