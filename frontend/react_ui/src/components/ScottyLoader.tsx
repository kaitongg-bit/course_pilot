export function ScottyLoader() {
  // Path is relative to the extension root
  const scottyImage = chrome.runtime.getURL(
    "frontend/react_ui/public/scotty.png"
  );
  console.log("ScottyLoader using image:", scottyImage);

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Scotty with tail wag animation */}
      <div className="relative w-8 h-8">
        <img
          src={scottyImage}
          alt="Loading"
          className="w-full h-full object-contain"
          style={{ animation: "tailWag 0.5s ease-in-out infinite" }}
        />

        {/* Multi-bar spinner */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-10 h-10 relative"
            style={{ animation: "spin 1s linear infinite" }}
          >
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute left-1/2 top-1/2 w-0.5 h-2 rounded-full bg-[#D00000]"
                style={{
                  transform: `translate(-50%, -50%) rotate(${
                    i * 30
                  }deg) translateY(-14px)`,
                  opacity: 1 - i * 0.08,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes tailWag {
          0%, 100% { transform: rotate(-4deg); }
          50% { transform: rotate(4deg); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

