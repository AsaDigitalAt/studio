'use client';

import { Sparkles } from 'lucide-react';

export default function AppHeader() {
  return (
    <header className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-3xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center border border-primary/30 shadow-[0_0_15px_-3px_hsl(var(--primary))]">
            <Sparkles size={20} className="text-primary animate-pulse duration-1500" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-white leading-none">M.I.A.</h1>
            <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-medium">Extração Orbital</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="text-[10px] font-bold text-emerald-400 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5 shadow-[0_0_10px_-5px_rgba(16,185,129,0.3)]">
             <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
             ONLINE
           </div>
        </div>
      </div>
    </header>
  );
}
