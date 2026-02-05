import { X } from 'lucide-react';

interface TagChipProps {
  username: string;
  onRemove?: () => void;
}

export default function TagChip({ username, onRemove }: TagChipProps) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-sm group animate-in fade-in zoom-in duration-200 bg-white/5 border-white/10 text-zinc-200 hover:bg-white/10 hover:border-white/20 backdrop-blur-sm">
      <span className="font-medium text-primary">@</span>
      {username}
      {onRemove && (
        <button 
          onClick={onRemove}
          className="ml-2 p-0.5 rounded-full hover:bg-white/20 text-zinc-500 hover:text-white transition-colors"
          aria-label={`Remove tag ${username}`}
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
