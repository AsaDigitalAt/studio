import { Loader2, Sparkles } from 'lucide-react';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <div className="relative mb-4">
        <div className="absolute inset-0 bg-primary/50 -m-4 rounded-full blur-2xl opacity-50 animate-pulse"></div>
        <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center border border-primary/30 shadow-[0_0_25px_-5px_hsl(var(--primary))] relative">
           <Sparkles size={40} className="text-primary animate-pulse duration-1500" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground animate-pulse tracking-widest">INITIALIZING INTERFACE...</p>
    </div>
  );
}
