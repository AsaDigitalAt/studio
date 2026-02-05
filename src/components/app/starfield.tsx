export default function StarField() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div>
      
      {/* Stars / Particles */}
      <div className="absolute top-[10%] left-[20%] w-1 h-1 bg-white rounded-full opacity-40 animate-pulse duration-[3000ms]"></div>
      <div className="absolute top-[30%] left-[60%] w-0.5 h-0.5 bg-blue-300 rounded-full opacity-60 animate-pulse duration-[5000ms]"></div>
      <div className="absolute top-[70%] left-[10%] w-1 h-1 bg-purple-300 rounded-full opacity-30 animate-pulse duration-[4000ms]"></div>
      <div className="absolute top-[50%] left-[80%] w-1 h-1 bg-white rounded-full opacity-50 animate-pulse duration-[7000ms]"></div>
      <div className="absolute top-[15%] left-[90%] w-0.5 h-0.5 bg-white rounded-full opacity-70"></div>
      <div className="absolute top-[85%] left-[30%] w-1 h-1 bg-white rounded-full opacity-20"></div>
      
      {/* Ambient Glows */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
    </div>
  );
}
