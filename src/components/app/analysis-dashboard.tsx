'use client';

import React from 'react';
import {
  AlertCircle,
  BarChart3,
  ExternalLink,
  Loader2,
  MessageCircle,
  Plus,
  Quote,
} from 'lucide-react';
import { type AnalysisResult } from '@/lib/types';
import StatusBadge from './status-badge';
import SentimentBadge from './sentiment-badge';
import TagChip from './tag-chip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AnalysisDashboardProps {
  analysis: AnalysisResult;
  confirmedTags: string[];
  manualInput: string;
  status: 'review' | 'saving';
  onAddManualTag: (e: React.FormEvent) => void;
  onRemoveTag: (tag: string) => void;
  onManualInputChange: (value: string) => void;
  onConfirm: () => void;
  onReset: () => void;
}

export default function AnalysisDashboard({
  analysis,
  confirmedTags,
  manualInput,
  status,
  onAddManualTag,
  onRemoveTag,
  onManualInputChange,
  onConfirm,
  onReset,
}: AnalysisDashboardProps) {

  return (
    <div className="space-y-8 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div className="flex items-center gap-4 overflow-hidden">
          <StatusBadge type={analysis.sourceType} />
          <p className="text-zinc-400 text-xs truncate font-mono">
            {analysis.normalizedUrl}
          </p>
        </div>
        <button onClick={onReset} className="text-xs text-primary hover:text-white transition-colors uppercase tracking-wider font-bold shrink-0 ml-4">
          Reiniciar
        </button>
      </div>

      {analysis.warnings.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex items-start gap-3 text-orange-200/80 text-xs backdrop-blur-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-orange-400" />
          <p>{analysis.warnings.join(' ')}</p>
        </div>
      )}

      {analysis.sentimentData ? (
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Quote size={40} className="text-white" />
            </div>
            <h4 className="text-[11px] uppercase tracking-widest font-bold text-zinc-500 mb-3 flex items-center gap-2">
              <BarChart3 size={14} /> Resumo Estratégico
            </h4>
            <p className="text-zinc-200 text-sm leading-relaxed border-l-2 border-primary/50 pl-4">
              {analysis.sentimentData.resumo_geral}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 hover:bg-emerald-500/10 transition-colors">
              <span className="text-2xl font-bold text-emerald-400">{analysis.sentimentData.totais.positivos}</span>
              <span className="text-[10px] uppercase tracking-wider text-emerald-500/70 font-bold">Positivos</span>
            </div>
            <div className="bg-zinc-500/5 border border-zinc-500/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 hover:bg-zinc-500/10 transition-colors">
              <span className="text-2xl font-bold text-zinc-400">{analysis.sentimentData.totais.neutros}</span>
              <span className="text-[10px] uppercase tracking-wider text-zinc-500/70 font-bold">Neutros</span>
            </div>
            <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 hover:bg-red-500/10 transition-colors">
              <span className="text-2xl font-bold text-red-400">{analysis.sentimentData.totais.negativos}</span>
              <span className="text-[10px] uppercase tracking-wider text-red-500/70 font-bold">Negativos</span>
            </div>
          </div>

          {analysis.sentimentData.comentarios_analisados.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-[11px] uppercase tracking-widest font-bold text-zinc-500 flex items-center gap-2">
                <MessageCircle size={14} /> Comentários Analisados ({analysis.sentimentData.comentarios_analisados.length})
              </h4>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {analysis.sentimentData.comentarios_analisados.map((comment, idx) => (
                  <div key={idx} className="bg-black/40 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-zinc-300 text-sm">@{comment.nome_usuario}</span>
                        <SentimentBadge sentiment={comment.sentimento} confidence={comment.confianca} />
                      </div>
                      <a href={comment.link_comentario} target="_blank" rel="noreferrer" className="text-zinc-600 hover:text-white transition-colors" title="Ver no Instagram">
                        <ExternalLink size={14} />
                      </a>
                    </div>
                    <p className="text-zinc-400 text-xs italic mb-3">"{comment.texto}"</p>
                    <div className="text-[11px] text-zinc-500 bg-white/5 rounded-lg p-2 border border-white/5">
                      <span className="text-primary/80 font-bold">Análise: </span> {comment.justificativa_curta}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
            <label className="text-[11px] uppercase tracking-widest font-bold text-zinc-500 ml-1 flex justify-between items-center">
                <span>Alvos Detectados (Fallback)</span>
                <span className="bg-white/10 text-white px-2 py-0.5 rounded text-[10px] font-mono">{confirmedTags.length}</span>
            </label>
            <div className="min-h-[80px] p-2 flex flex-wrap gap-3 bg-black/40 rounded-2xl border border-white/5 shadow-inner">
                {confirmedTags.map(tag => (
                <TagChip key={tag} username={tag} onRemove={() => onRemoveTag(tag)} />
                ))}
            </div>
        </div>
      )}

      <div className="space-y-3 pt-4 border-t border-white/5">
        <label className="text-[11px] uppercase tracking-widest font-bold text-zinc-500 ml-1">Inserção Manual de Usuário</label>
        <form onSubmit={onAddManualTag} className="flex gap-3">
          <div className="relative flex-1 group">
            <span className="absolute left-4 top-3.5 text-zinc-600 font-medium group-focus-within:text-primary transition-colors">@</span>
            <Input
              type="text"
              value={manualInput}
              onChange={(e) => onManualInputChange(e.target.value)}
              placeholder="username"
              className="w-full bg-black/40 border-white/10 rounded-xl pl-9 pr-4 py-3 text-zinc-200 focus:outline-none focus:border-primary/50 focus:bg-black/60 transition-all text-sm"
            />
          </div>
          <Button type="submit" disabled={!manualInput} variant="outline" className="px-6 py-3 bg-white/5 hover:bg-white/10 border-white/10 text-white font-bold transition-all disabled:opacity-30 hover:scale-105 active:scale-95">
            <Plus size={16} />
          </Button>
        </form>
      </div>

      <div className="pt-6 border-t border-white/10 flex gap-4">
        <Button onClick={onReset} variant="outline" className="flex-1 py-4 rounded-xl border-white/10 text-zinc-400 font-bold hover:bg-white/5 hover:text-white transition-all uppercase tracking-wide text-xs h-auto">
          Abortar
        </Button>
        <Button onClick={onConfirm} disabled={status === 'saving'} className="flex-[2] bg-white hover:bg-zinc-200 text-black font-bold py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-[0.98] h-auto">
          {status === 'saving' ? <Loader2 className="animate-spin" /> : 'CONFIRMAR DADOS'}
        </Button>
      </div>
    </div>
  );
}
