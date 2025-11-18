
# Local LLM Course Recommendation System (AI Course Pilot) — Complete Beginner Guide

***

## 0. Environment Requirements & OS Recommendations

- **Strongly recommended: Use Ubuntu (including WSL) or Mac OS to develop/run this project.**
- **Do NOT run this project directly in a native Windows environment! Avoid using Windows commands.**
- If you must use Windows, please install WSL from the Microsoft Store, set up an Ubuntu subsystem, and perform all operations in the Ubuntu terminal.

***

## 1. Recommended Editors & AI Assistants

- It is highly recommended to use AI-supported editors or tools (such as CodeBuddy, Cursor, VSCode with AI plugins, Perplexity, Claude, etc.) for more efficient development and troubleshooting.
- For AI code suggestions, always use “chat mode” or “small snippet completion” — do NOT perform bulk auto-rewrites of files.
- If you encounter errors with your environment or commands, promptly Google for solutions.

***

## 2. Project Cloning (Private Repo Token Setup)

- Repo address: https://github.com/kaitongg-bit/course_pilot.git
- **This is a private repository; you need a GitHub account and a Personal Access Token to clone it, as follows:**

1. In the terminal, enter the command:

```
git clone https://github.com/kaitongg-bit/course_pilot.git
```

2. If prompted for username and password:
    - Username: your GitHub account name
    - Password: your [GitHub Personal Access Token]
3. Token generation process:
    - Go to your GitHub homepage (top-right avatar) → Settings → Developer settings → Personal access tokens → Generate new token
    - Select permissions for "repo", create the token, and copy/save it (it will only be shown once!)
    - For a step-by-step guide, Google “How to clone a private GitHub repo with a personal access token”

***

## 3. Node.js Dependency Installation (Install Early)

- If your frontend uses build tools (e.g., tailwind, js tools), install node_modules dependencies first in your frontend directory.
- In your frontend directory, open a terminal and run:

```
npm install
```

This will automatically pull all frontend dependencies and create the node_modules folder. **Do NOT manually download or edit the node_modules folder.**

***

## 4. Backend Environment & Dependency Setup (Always Activate Virtualenv!)

1. **Create and activate a Python virtual environment (Always activate in every new terminal!):**

```
python3 -m venv venv
source venv/bin/activate
```

Once activated, your prompt will show a (venv) prefix.

2. **Install dependencies (in the project root directory’s terminal):**

```
pip install -r requirements.txt
```

If you see pip or dependency errors, try several times and Google the error info for solutions.

***

## 5. LLM Model File Download/Configuration

1. **Run the model download script in the terminal (project root):**

```
python download.py
```

2. If it stalls or fails, Google the model file for manual download and place it in the models/ folder.

***

## 6. Starting the Backend Service  
(“Run directly in the terminal.” If using Ubuntu, make sure you are **really** running in Ubuntu, not a PowerShell window; if unsure about setting up Ubuntu/WSL, please consult AI tools, as you’ll need to set username/password the first time.)

- Always activate the virtual environment with source venv/bin/activate *before* starting! Remind teammates not to skip this step!
- In the project’s root directory, run in terminal:

```
python llm-proxy.py
```

- Once you see “Local LLM proxy server running on port ...”, you’re good! For port/path errors, Google the terminal message for solutions.

***

## 7. Frontend Launch & Development

- Main frontend files: sidepanel.html (UI design), sidepanel.js (interaction logic), tailwind.css (styles).
- For development as a Chrome extension: Chrome → Extensions → Developer Mode → Load Unpacked Extension → select your frontend directory, e.g. \wsl.localhost\Ubuntu-24.04\home\kita\course_pilot.
- Main modifications for UI and features are in sidepanel.js and sidepanel.html.

***

## 8. Project Structure & Useless Files

- You may see folders like agents, test, script — these are experimental or legacy and not needed for general development.
- Do not delete backend, frontend, or models — if in doubt, check with a maintainer before deleting anything else.

***

## 9. Team Collaboration & Branch Workflow

- Always develop new features or fixes in a new git branch:

```
git checkout -b feat-your-branch-name
```

- When committing, always use clear messages (in English or Chinese, but be specific) — never “update” with no notes:

```
git add .
git commit -m "Refined recommendation logic; fixed path compatibility"
git push origin feat-your-branch-name
```

- Merging to the main branch requires a pull request and team review.
- If a bulk AI code edit goes wrong, use git log/git checkout/git reflog to recover previous versions immediately.

***

## 10. Common Issues & Solutions

- **Dependency install failure:** Always use pip in the terminal, activate virtualenv, and Google the exact error message for similar solutions.
- **Model download is slow or stuck:** Google the relevant model and manually add it to the models/ folder.
- **Port conflicts:** Adjust the port in llm-proxy.py and match it on the frontend; always Google for conflict errors.
- **Frontend extension load fails:** Google “Chrome extension development” and check for manifest permissions and Developer Mode.
- **Windows compatibility issues:** Always use Ubuntu or Mac; no Windows commands are needed.

***

## 11. Terminal & Git Newbie Essentials

- cd folder-name: go into the directory  
- ls/dir: show files in current folder  
- pwd: print working directory  
- Ctrl+C: terminate the running program  
- git branch/status/checkout/log: version control and code recovery  
- For any unknown command or error, ALWAYS try asking AI

***