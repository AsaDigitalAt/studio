import { Smile, Meh, Frown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SentimentBadgeProps {
    sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    confidence?: number;
    className?: string;
}

export default function SentimentBadge({ sentiment, confidence, className }: SentimentBadgeProps) {
  const baseClasses = "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide";
  
  if (sentiment === 'POSITIVE') {
    return (
      <div className={cn(baseClasses, "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400", className)}>
        <Smile size={12} /> Positivo {confidence && <span className="opacity-60 text-[9px]">| {confidence}%</span>}
      </div>
    );
  }
  if (sentiment === 'NEGATIVE') {
    return (
      <div className={cn(baseClasses, "bg-red-500/10 border border-red-500/20 text-red-400", className)}>
        <Frown size={12} /> Negativo {confidence && <span className="opacity-60 text-[9px]">| {confidence}%</span>}
      </div>
    );
  }
  return (
    <div className={cn(baseClasses, "bg-zinc-500/10 border border-zinc-500/20 text-zinc-400", className)}>
      <Meh size={12} /> Neutro {confidence && <span className="opacity-60 text-[9px]">| {confidence}%</span>}
    </div>
  );
};
