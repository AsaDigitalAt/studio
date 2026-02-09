'use client';

import { useState } from 'react';
import Link from 'next/link';
import { History, CloudLightning, ChevronRight } from 'lucide-react';
import { type TaggingRun } from '@/lib/types';
import StatusBadge from './status-badge';
import { cn } from '@/lib/utils';
import RunStatusBadge from './run-status-badge';

interface HistorySectionProps {
  history: TaggingRun[];
}

export default function HistorySection({ history }: HistorySectionProps) {
  const [historyOpen, setHistoryOpen] = useState(true);

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
        <div className="mt-6 space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
          {history.length === 0 ? (
            <div className="text-center py-12 text-zinc-800 text-sm font-mono border border-white/5 rounded-2xl bg-black/20">
              Nenhum registro no diário de bordo.
            </div>
          ) : (
            history.map((run) => (
              <Link href={`/analysis/${run.id}`} key={run.id} className="block">
                <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:bg-white/5 hover:border-primary/50 transition-all group backdrop-blur-sm">
                   <div className="flex flex-col gap-2 overflow-hidden w-full">
                      <div className="flex items-center gap-3 flex-wrap">
                         {run.status && <RunStatusBadge status={run.status} />}
                         <StatusBadge type={run.sourceType} />
                         <span className="text-[10px] text-zinc-600 font-mono flex items-center gap-1">
                           <CloudLightning size={10} />
                           {run.createdAt?.seconds ? new Date(run.createdAt.seconds * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'}) : 'Processando...'}
                         </span>
                      </div>
                      <p className="truncate text-zinc-500 font-mono text-xs pr-4">{run.sourceUrl}</p>
                      {run.status === 'completed' && run.sentimentSummary && run.sentimentSummary !== 'Análise em processamento...' && (
                        <div className="mt-1 text-[11px] text-zinc-500 italic border-l-2 border-white/10 pl-2 line-clamp-2">
                           "{run.sentimentSummary}"
                        </div>
                      )}
                   </div>
                   <ChevronRight size={20} className="text-zinc-600 group-hover:text-white transition-colors shrink-0 ml-4" />
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
