'use client';

import { useState } from 'react';
import { History, CloudLightning, RefreshCw } from 'lucide-react';
import { type TaggingRun } from '@/lib/types';
import StatusBadge from './status-badge';
import { cn } from '@/lib/utils';

interface HistorySectionProps {
  history: TaggingRun[];
  onRestore: (run: TaggingRun) => void;
}

export default function HistorySection({ history, onRestore }: HistorySectionProps) {
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <div className="border-t border-white/10 pt-8">
      <button 
        onClick={() => setHistoryOpen(!historyOpen)}
        className="flex items-center justify-between w-full text-zinc-500 hover:text-white transition-colors group px-2"
      >
        <div className="flex items-center gap-3">
          <History size={18} />
          <span className="text-sm font-bold uppercase tracking-widest">Registro de Missões</span>
        </div>
        <span className={cn(
          "text-[10px] font-bold px-2 py-1 rounded transition-colors",
          historyOpen ? "bg-primary/50 text-white" : "bg-white/10 text-zinc-300 group-hover:bg-white/20"
        )}>
          {history.length}
        </span>
      </button>

      {historyOpen && (
        <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          {history.length === 0 ? (
            <div className="text-center py-12 text-zinc-800 text-sm font-mono border border-white/5 rounded-2xl bg-black/20">
              Nenhum registro no diário de bordo.
            </div>
          ) : (
            history.map((run) => (
              <div key={run.id} className="bg-black/40 border border-white/5 p-5 rounded-2xl flex items-center justify-between hover:bg-white/5 hover:border-white/10 transition-all group backdrop-blur-sm">
                 <div className="flex flex-col gap-2 overflow-hidden w-full">
                    <div className="flex items-center gap-3 flex-wrap">
                       <StatusBadge type={run.sourceType} />
                       <span className="text-[10px] text-zinc-600 font-mono flex items-center gap-1">
                         <CloudLightning size={10} />
                         {run.createdAt?.seconds ? new Date(run.createdAt.seconds * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'}) : 'Processando...'}
                       </span>
                       {run.commentCount && run.commentCount > 0 && (
                         <span className="text-[10px] text-zinc-600 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                           {run.commentCount} com.
                         </span>
                       )}
                    </div>
                    <p className="truncate text-zinc-500 font-mono text-xs pr-4">{run.sourceUrl}</p>
                    {run.sentimentSummary && (
                      <div className="mt-2 text-[11px] text-zinc-500 italic border-l-2 border-white/10 pl-2 line-clamp-2">
                         "{run.sentimentSummary}"
                      </div>
                    )}
                    {run.confirmedUsernames.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {run.confirmedUsernames.slice(0, 4).map(tag => (
                          <span key={tag} className="text-[10px] text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">@{tag}</span>
                        ))}
                        {run.confirmedUsernames.length > 4 && (
                          <span className="text-[10px] text-zinc-600 px-1 py-0.5">+{run.confirmedUsernames.length - 4}</span>
                        )}
                      </div>
                    )}
                 </div>
                 <button 
                   onClick={() => onRestore(run)}
                   className="p-3 bg-white/5 border border-white/5 rounded-xl text-zinc-500 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all opacity-0 group-hover:opacity-100 shrink-0 ml-4"
                   title="Restaurar Parâmetros"
                 >
                   <RefreshCw size={16} />
                 </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
