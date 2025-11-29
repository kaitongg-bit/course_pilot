# Course Pilot - AI Course Planner

Course Pilot is a Chrome extension that helps students plan their courses using an AI-powered assistant. It integrates with a local LLM to provide course recommendations, scheduling assistance, and review analysis.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

-   **Git**: [Download Git](https://git-scm.com/downloads)
-   **Python 3.10+**: [Download Python](https://www.python.org/downloads/)
-   **Node.js & npm** (for building the frontend): [Download Node.js](https://nodejs.org/)

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone -b enhanced-ui-csv-data https://github.com/kaitongg-bit/course_pilot.git
cd course_pilot
```

### 2. Backend Setup (Local LLM Server)

The backend runs a local Flask server that interfaces with a quantized LLM (Qwen2.5-3B).

#### **Mac / Linux**

1.  **Run the setup script:**
    This script will create a virtual environment, install dependencies, and download the necessary LLM model.
    ```bash
    chmod +x install_local_llm.sh
    ./install_local_llm.sh
    ```

2.  **Start the Backend Server:**
    ```bash
    chmod +x start_llm_server.sh
    ./start_llm_server.sh
    ```
    The server will start on `http://127.0.0.1:3002`.

#### **Windows**

1.  **Create a virtual environment:**
    ```powershell
    python -m venv venv
    .\venv\Scripts\activate
    ```

2.  **Install dependencies:**
    ```powershell
    pip install -r requirements.txt
    ```

3.  **Download the Model:**
    Download `qwen2.5-3b-instruct-q4_k_m.gguf` and place it in a `models/` directory in the root of the project.
    *Note: The `install_local_llm.sh` script automates this on Unix systems. You may need to manually download it from HuggingFace.*

4.  **Start the Backend Server:**
    You can simply double-click `start_llm_server.bat` or run:
    ```powershell
    .\start_llm_server.bat
    ```

---

### 3. Frontend Setup (React Extension)

The frontend is built with React and Vite.

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend/react_ui
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Build the project:**
    ```bash
    npm run build
    ```
    This will generate the production assets in `frontend/react_ui/build`.

---

## Loading the Chrome Extension

1.  Open Google Chrome and navigate to `chrome://extensions/`.
2.  Enable **Developer mode** in the top right corner.
3.  Click **Load unpacked**.
4.  Select the `frontend` folder inside the `course_pilot` directory (ensure you select the folder containing `manifest.json`).
5.  The **Course Pilot** extension should now appear in your browser.

---

## Usage

1.  Ensure the **Backend Server** is running (`./start_llm_server.sh`).
2.  Click the **Course Pilot** icon in your Chrome toolbar.
3.  Open the side panel to access the AI Course Planner.
4.  **Features:**
    -   **Chat:** Ask for course recommendations based on your goals and skills.
    -   **Time Selector:** Filter courses by your available schedule.
    -   **Reviews:** View and contribute course reviews (validated by AI).

## Troubleshooting

-   **Backend not starting?** Ensure port `3002` is free.
-   **Extension not loading?** Make sure you selected the correct folder (`frontend`) and that the build was successful.
-   **LLM errors?** Verify that the `.gguf` model file exists in the `models/` directory.

## Updating to the Latest Version

If you already have the repository cloned and want to get the latest changes:

1.  **Stash any local changes** (if you have modified files):
    ```bash
    git stash
    ```
2.  **Pull the latest updates:**
    ```bash
    git pull origin enhanced-ui-csv-data
    ```
3.  **Rebuild the frontend** (if there were UI changes):
    ```bash
    cd frontend/react_ui
    npm install
    npm run build
    ```