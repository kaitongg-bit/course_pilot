

# ARCHITECTURE.md

## Overview

**CMU Course Assistant** is a Chrome Extension designed to assist students in selecting and reviewing CMU courses through an extensible multi-agent system. It fuses local static data, fully modular AI/ML agents (powered by user-configured LLMs—e.g. Google Gemini), anonymous user data, and privacy-first review sharing via Google Sheets (Apps Script) — all while requiring zero backend.

***

## File \& Directory Structure

```plaintext
cmu-course-assistant/
│
├── manifest.json
├── frontend/
│   ├── sidepanel.html
│   ├── frontend_example.html
│   ├── styles.css
│   ├── sidepanel.js
│   ├── settingsModal.html     # UI for LLM API key/user config
│
├── data/
│   ├── courses.json
│
├── agents/
│   ├── index.js              # Main dispatcher/agent hub
│   ├── matchAgent.js
│   ├── summarizeAgent.js
│   ├── reviewAuditAgent.js
│   ├── agentUtils.js
│
├── storage/
│   ├── chromeStorage.js
│   ├── sheetApi.js
│
├── scripts/
│   ├── background.js
│
├── utils/
│   ├── idUtils.js
│   ├── auth.js
│   ├── llmConfig.js
│
├── package.json
├── ARCHITECTURE.md
├── README.md
└── ...
```


***

## Modular Agent System

Each “agent” module is a focused, reusable, and testable component dedicated to an AI/logic-powered task.

### Agent Overview Table

| Agent Name | Responsibility | Input | Output | Implementation Highlights |
| :-- | :-- | :-- | :-- | :-- |
| `matchAgent` | Personalized course matching based on user profile, skills, and goals | User profile, skills, goals, course catalog | Ranked list of suggested courses | Runs a hybrid of TF-IDF \& cosine similarity or dense retrieval; entirely local, customizable match rules |
| `summarizeAgent` | Produces single/two-sentence, user-customized, context-aware course summaries | Course desc, user goal/profile, user name | Friendly, tailored summary | Calls user-supplied LLM (e.g. Gemini API key), dynamically builds prompt for unique, live result |
| `reviewAuditAgent` | Audits submitted reviews for quality, toxicity, spam, and other rule/compliance issues | Review text | Status + feedback | Can use an LLM for moderation or a local filter; outputs rationale as well as pass/fail |
| `careerExpandAgent` | (optional) Expands vague user career goals into actionable skills for better matching | User goal text | Enriched skill/keyword list | Uses keyword mining/templates or LLM magic to enhance intent understanding |
| `feedbackAgent` | (optional/UI) Composes automated, human-like responses when submitting or updating reviews | Review/match/summarize outputs | User-facing feedback | May call LLM or use local templates; for “copilot”-like interactions |


***

### Example Agent Detail

#### **summarizeAgent**

- **Goal:** For every course and user, generate a concise, reader-friendly recommendation sentence that explicitly incorporates user context (e.g., career goal, name).
- **How it works:**
    - Endpoint (or agent config) is set by the user—Google Gemini by default, but modular.
    - Reads config via `/utils/llmConfig.js` (API key, endpoint).
    - For each course, builds prompts like:
        - `"As a student wanting to become a product manager, how would you sum up the following course for Max: <CourseDesc>"`
    - Sends prompt to Gemini (or user’s LLM) using their key (stored only locally).
    - Renders the response as the summary — always user/context-unique, never static.
- **Privacy:** No key or request data is ever shared; all LLM traffic is under user’s own account.
- **Extensibility:** Easily supports other LLMs or local inference if user code/config changes.


#### **matchAgent**

- **Goal:** Given user profile, resume, and skills/interests, surface the most relevant subset of courses.
- **How it works:**
    - Loads catalog from `/data/courses.json`
    - Calculates text similarity (TF-IDF/cosine or semantic embedding if desired; MVP can use keywords)
    - Outputs ranked array of course objects
- **Extensibility:** Can be upgraded to NN/embedding matchers per agent modularity.


#### **reviewAuditAgent**

- **Goal:** Modal/automatic review audit for profanity, length, redundancy, and other “toxicity” markers.
- **How it works:**
    - On review submit, passes text to agent (local OR LLM via user’s API key)
    - Returns status: “approved”, or “rejected” (+ reason, e.g., “contains banned words”)
    - Optionally can suggest improvements or auto-correct minor issues
- **Privacy:** Review never leaves browser unless uploading (user-approved/explicit)

***

## LLM API Key and Agent Config

- **Onboarding:**
    - User clones project, loads extension, and is guided (UI in `settingsModal.html`) to paste their own LLM API key (e.g., Gemini)
    - API key held in local browser storage, never distributed/collected
    - Configurable endpoint/provider via `/utils/llmConfig.js`
- **Agent integration:**
    - Every agent that needs LLM power (e.g., summarizeAgent, reviewAuditAgent) uses helper in `llmConfig.js` to fetch the current API key/endpoint
    - If no key set, agent returns clear error to UI
- **README instructions:**
    - “Before using, you must supply your own Gemini API key in Settings!”

***

## Data and Privacy

- **Static data:** Courses loaded from local JSON, read-only, bundled
- **All user IDs:** Anonymized UUID generated and stored locally; never linked to real identity
- **Reviews:** Can be uploaded as anonymous to Google Sheets (via Apps Script endpoint), with only UUID/email-hash for removal logic (never the plain email)
- **No backend:** All AI, review storage and matching is client-driven, except uplink to user-owned Google Sheet or public LLM endpoint with user’s config

***

## State \& Flow Table

| State | Location | Access | Persistence | Notes |
| :-- | :-- | :-- | :-- | :-- |
| Course data | `/data/courses.json` | All agents/UI | Static | Bundled, read-only |
| User profile/UUID | `chrome.storage.local` | Agents, UI | Local | Generated per-user, never leaves machine |
| LLM API key | `chrome.storage.local` | Agents | Local | User-pasted, never leaves browser |
| Reviews (pending/local) | `chrome.storage.local` | Agents, UI | Local | Local cache until upload |
| Reviews (shared) | Google Sheet | read: public | Cloud | Only through Apps Script endpoint |


***

## Component Interactions

```mermaid
graph TD
    UA[User Input: Resume, Goals] --> MA[matchAgent]
    MA --> SC[SummarizeAgent (user LLM)]
    SC --> UI[Frontend: Personalized summary display]
    UI --> RV[Review submission]
    RV --> RA[reviewAuditAgent (optional LLM)]
    RA --> UP[sheetApi: Upload (anon UUID + hash)]
    UP --> GS[Google Sheet Review Storage]
```


***

## How To Extend

- **Add new agents:** Drop into `/agents/`, export via `index.js`, and call from UI or other agents
- **Change LLM provider:** Create a config in `/utils/llmConfig.js` and switch endpoint in UI/config
- **Upgrade matching logic:** Swap out `matchAgent.js` for local vector DB, or introduce new retrieval agent

***

## Security \& Professional Practices

- Zero trust: API keys stay in user browser, never checked in code or sent to developer
- Clear agent encapsulation boundaries — modular rules, easy auditing, reusable in any JS/TS system
- All user-facing features provide error feedback if config is missing/invalid

***

## Setup Changelog

- [2025-11-13] Modular agent structure established; all LLMs use user-supplied API
- [2025-11-13] Summarize agent now context/dynamic, embedded in user LLM
- [2025-11-13] Sheet review storage, privacy, anonymized review deletion policy documented

***
##Data Sources
###Course Data

Source: Distributed with extension as courses.json, loaded locally from the user's installation.

Structure: All necessary fields (course_id, name, term, prerequisites, description, ...).

###Review Data

Source: Cloud-based, stored on Google Sheet.

Access: Via Apps Script Web API endpoint—
https://script.google.com/macros/s/AKfycbzSK-r_07kUIi26xWSBUOf2c3JwdPLXVJK5RajPkM_uj2jZCzjQqp5F-xh8iQ28gNsD7Q/exec

Supported actions:

Submit new review (POST, with all review fields)

Query all reviews (GET)

Delete own review (POST to specialized endpoint)

###Integration Notes
Users download all course info as JSON and load via the extension frontend.

User reviews are stored and managed centrally via the Google Sheet API; link is public and fixed in code/config.

All other user data is kept locally, except what is explicitly submitted to the review sheet.


