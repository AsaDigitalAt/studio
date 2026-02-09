'use client';

import React from 'react';
import {
  AlertCircle,
  BarChart3,
  ExternalLink,
  MessageCircle,
  Quote,
  Loader2,
} from 'lucide-react';
import { type TaggingRun } from '@/lib/types';
import StatusBadge from './status-badge';
import SentimentBadge from './sentiment-badge';
import RunStatusBadge from './run-status-badge';

interface AnalysisResultDashboardProps {
  run: TaggingRun;
}

export default function AnalysisResultDashboard({ run }: AnalysisResultDashboardProps) {

  const analysis = run.sentimentData;

  return (
    <div className="space-y-8 pt-4">
      <div className="border-b border-white/10 pb-6">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            {run.status && <RunStatusBadge status={run.status} />}
            <StatusBadge type={run.sourceType} />
          </div>
          <a href={run.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-400 text-xs truncate font-mono hover:text-primary transition-colors flex items-center gap-2">
            {run.normalizedUrl} <ExternalLink size={12} />
          </a>
      </div>

      {run.status === 'processing' && (
        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center space-y-6 text-center backdrop-blur-xl">
             <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-2xl animate-pulse"></div>
                <Loader2 className="animate-spin text-primary w-12 h-12 relative z-10" />
             </div>
             <h3 className="text-xl font-bold text-white">Análise em Processamento</h3>
             <p className="text-zinc-400 text-sm max-w-sm">
               Nossa sonda ainda está coletando e analisando os dados. Os resultados aparecerão aqui automaticamente assim que estiverem prontos.
             </p>
        </div>
      )}
      
      {run.status === 'failed' && (
          <div className="bg-red-900/50 border border-red-500/20 rounded-2xl p-12 flex flex-col items-center justify-center space-y-6 text-center backdrop-blur-xl">
             <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 blur-2xl animate-pulse"></div>
                <AlertCircle className="text-red-400 w-12 h-12 relative z-10" />
             </div>
             <h3 className="text-xl font-bold text-white">Falha na Análise</h3>
             <p className="text-zinc-400 text-sm max-w-sm">
               Ocorreu um erro durante o processamento desta análise. Por favor, tente novamente mais tarde ou inicie uma nova varredura.
             </p>
        </div>
      )}


      {run.status === 'completed' && analysis ? (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Quote size={40} className="text-white" />
            </div>
            <h4 className="text-[11px] uppercase tracking-widest font-bold text-zinc-500 mb-3 flex items-center gap-2">
              <BarChart3 size={14} /> Resumo Estratégico
            </h4>
            <p className="text-zinc-200 text-sm leading-relaxed border-l-2 border-primary/50 pl-4">
              {analysis.resumo_geral}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 hover:bg-emerald-500/10 transition-colors">
              <span className="text-2xl font-bold text-emerald-400">{analysis.totais.positivo}</span>
              <span className="text-[10px] uppercase tracking-wider text-emerald-500/70 font-bold">Positivos</span>
            </div>
            <div className="bg-zinc-500/5 border border-zinc-500/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 hover:bg-zinc-500/10 transition-colors">
              <span className="text-2xl font-bold text-zinc-400">{analysis.totais.neutro}</span>
              <span className="text-[10px] uppercase tracking-wider text-zinc-500/70 font-bold">Neutros</span>
            </div>
            <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 hover:bg-red-500/10 transition-colors">
              <span className="text-2xl font-bold text-red-400">{analysis.totais.negativo}</span>
              <span className="text-[10px] uppercase tracking-wider text-red-500/70 font-bold">Negativos</span>
            </div>
          </div>

          {analysis.comentarios_analisados.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-[11px] uppercase tracking-widest font-bold text-zinc-500 flex items-center gap-2">
                <MessageCircle size={14} /> Comentários Analisados ({analysis.comentarios_analisados.length})
              </h4>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {analysis.comentarios_analisados.map((comment, idx) => (
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
      ) : null}

    </div>
  );
}
