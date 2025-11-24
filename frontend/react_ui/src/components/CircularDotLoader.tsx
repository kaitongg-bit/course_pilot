export function CircularDotLoader() {
  return (
    <div className="relative w-5 h-5" style={{ animation: 'spin 1.75s linear infinite' }}>
      {/* 8 small dots positioned in a circle */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#D00000]" />
      <div className="absolute top-[14.65%] right-[14.65%] w-1.5 h-1.5 rounded-full bg-[#D00000]" />
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#D00000]" />
      <div className="absolute bottom-[14.65%] right-[14.65%] w-1.5 h-1.5 rounded-full bg-[#D00000]" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#D00000]" />
      <div className="absolute bottom-[14.65%] left-[14.65%] w-1.5 h-1.5 rounded-full bg-[#D00000]" />
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#D00000]" />
      <div className="absolute top-[14.65%] left-[14.65%] w-1.5 h-1.5 rounded-full bg-[#D00000]" />
      
      {/* 1 larger dot at the top as focal point */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[#A6192E]" />
    </div>
  );
}