// chrome/background.js
// --------------------------------------------------
// Simple background service worker for Course Pilot
// Bridges messages from the side panel to the local
// Flask backend running on http://127.0.0.1:3002
// --------------------------------------------------

console.log("Course Pilot background service worker loaded");

// Open the side panel when the extension icon is clicked
chrome.runtime.onInstalled.addListener(() => {
  console.log("Course Pilot installed");

  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }
});

// (Optional) log when the side panel is shown
if (chrome.sidePanel && chrome.sidePanel.onShown) {
  chrome.sidePanel.onShown.addListener(() => {
    console.log("Side panel opened");
  });
}

// Helper: POST JSON to the local backend and return parsed payload
async function postJson(path, body) {
  const url = `http://127.0.0.1:3002${path}`;
  console.log("[Background] POST", url, "payload:", body);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });

  let payload = null;
  try {
    payload = await res.json();
  } catch (e) {
    console.warn("[Background] Response is not valid JSON", e);
  }

  if (!res.ok) {
    const msg =
      (payload && payload.error) || `HTTP ${res.status} while calling ${path}`;
    throw new Error(msg);
  }

  return payload;
}

// Listen for messages from the side panel UI
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) {
    return; // ignore unknown messages
  }

  // -------------------------------------------
  // MATCH_COURSES: return normalized course list
  // -------------------------------------------
  if (message.type === "MATCH_COURSES") {
    console.log("Background received: MATCH_COURSES");

    postJson("/api/courses/match", message.payload)
      .then((payload) => {
        console.log("[Background] MATCH_COURSES payload:", payload);

        // Normalize to an array of courses no matter what shape the backend uses
        let courses = [];

        if (Array.isArray(payload?.courses)) {
          courses = payload.courses;
        } else if (Array.isArray(payload?.matches)) {
          courses = payload.matches;
        } else if (Array.isArray(payload)) {
          courses = payload;
        } else if (payload && Array.isArray(payload.results)) {
          courses = payload.results;
        }

        // Always send both a top-level `courses` AND a nested `data.courses`
        // so the React UI can safely do either `resp.courses.map` or
        // `resp.data.courses.map` without crashing.
        sendResponse({
          ok: true,
          courses,
          data: { courses },
        });
      })
      .catch((err) => {
        console.error("[Background] MATCH_COURSES backend error:", err);
        sendResponse({
          ok: false,
          error: String(err && err.message ? err.message : err),
        });
      });

    // Keep the message channel open for the async response
    return true;
  }

  // -------------------------------------------
  // SUMMARIZE_COURSE: proxy to backend summarizer
  // -------------------------------------------
  if (message.type === "SUMMARIZE_COURSE") {
    console.log("Background received: SUMMARIZE_COURSE");

    postJson("/api/courses/summarize", message.payload)
      .then((payload) => {
        console.log("[Background] SUMMARIZE_COURSE payload:", payload);
        sendResponse({
          ok: true,
          data: payload,
        });
      })
      .catch((err) => {
        console.error("[Background] SUMMARIZE_COURSE backend error:", err);
        sendResponse({
          ok: false,
          error: String(err && err.message ? err.message : err),
        });
      });

    return true;
  }

  // Unknown message type – ignore
  console.warn("[Background] Unknown message type:", message.type);
});

