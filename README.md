# Course Pilot - AI Course Planner

Course Pilot is a Chrome extension that helps students plan their courses using an AI-powered assistant. It integrates with the **Groq API** (Llama 3) to provide fast and intelligent course recommendations, scheduling assistance, and review analysis.

## Demo

[Watch the Demo Video](demo.MOV)

## Prerequisites

Before you begin, ensure you have the following installed on your system:

-   **Git**: [Download Git](https://git-scm.com/downloads)
-   **Python 3.10+**: [Download Python](https://www.python.org/downloads/)
-   **Node.js & npm** (for building the frontend): [Download Node.js](https://nodejs.org/)
-   **Groq API Key**: You need a valid API key from [Groq Cloud](https://console.groq.com/).

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/kaitongg-bit/course_pilot.git
cd course_pilot
```

### 2. Backend Setup

The backend runs a local Flask server that proxies requests to the Groq API and handles vector search using a local ChromaDB instance.

1.  **Create and Activate Virtual Environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: .\venv\Scripts\activate
    ```

2.  **Install Dependencies:**
    ```bash
    pip install -r backend/requirements.txt
    ```

3.  **Set up Environment Variables:**
    Create a `.env` file in the `backend` directory (or root) and add your Groq API key:
    ```bash
    GROQ_API_KEY=your_groq_api_key_here
    ```

4.  **Start the Backend Server:**
    You can use the provided script which loads environment variables automatically:
    ```bash
    ./start_backend.sh
    ```
    Or run manually:
    ```bash
    python backend/llm-proxy.py
    ```
    The server will start on `http://localhost:3002`.

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
4.  Select the **root** `course_pilot` folder (the one containing `manifest.json`).
5.  The **Course Pilot** extension should now appear in your browser.

---

## Usage

1.  Ensure the **Backend Server** is running (`python backend/llm-proxy.py`).
2.  Click the **Course Pilot** icon in your Chrome toolbar.
3.  Open the side panel to access the AI Course Planner.
4.  **Features:**
    -   **Chat:** Ask for course recommendations based on your goals and skills (Powered by Groq Llama 3).
    -   **Time Selector:** Filter courses by your available schedule.
    -   **Reviews:** View and contribute course reviews.

## Documentation

For more detailed documentation, architecture diagrams, and legacy instructions, please check the `docs/` folder.