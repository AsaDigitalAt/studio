import { type LinkType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  type: LinkType;
}

export default function StatusBadge({ type }: StatusBadgeProps) {
  const colors = {
    post: 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_-5px_rgba(59,130,246,0.5)]',
    reel: 'bg-pink-500/10 text-pink-400 border-pink-500/20 shadow-[0_0_10px_-5px_rgba(236,72,153,0.5)]',
    profile: 'bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_10px_-5px_rgba(168,85,247,0.5)]',
    story: 'bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-[0_0_10px_-5px_rgba(249,115,22,0.5)]',
    unknown: 'bg-zinc-800 text-zinc-400 border-zinc-700',
  };

  const labels = {
    post: 'Post',
    reel: 'Reel',
    profile: 'Perfil',
    story: 'Story',
    unknown: 'Desconhecido',
  };

  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-widest backdrop-blur-md shrink-0", 
      colors[type]
    )}>
      {labels[type]}
    </span>
  );
};
