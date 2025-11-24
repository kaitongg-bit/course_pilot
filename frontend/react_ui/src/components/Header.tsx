export function Header() {
  return (
    <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-[#E5E7EB]">
      <h1 className="text-[#CC0033] tracking-tight text-2xl">AI Course Planner</h1>
      <button 
        onClick={() => {
          const event = new CustomEvent('openContribute');
          window.dispatchEvent(event);
        }}
        className="bg-[#CC0033] hover:bg-[#A60000] text-white px-4 py-2 rounded-xl transition-colors text-sm flex items-center gap-2"
      >
        <span>✨</span>
        <span>Contribute</span>
      </button>
    </div>
  );
}