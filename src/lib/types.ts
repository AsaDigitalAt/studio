import type { Timestamp } from 'firebase/firestore';

export type LinkType = 'post' | 'reel' | 'profile' | 'story' | 'unknown';

export interface CommentAnalysis {
  nome_usuario: string;
  link_comentario: string;
  texto: string;
  sentimento: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  justificativa_curta: string;
  confianca: number;
}

export interface SentimentTotals {
  positivos: number;
  neutros: number;
  negativos: number;
  total: number;
}

export interface SentimentOutput {
  resumo_geral: string;
  totais: SentimentTotals;
  comentarios_analisados: CommentAnalysis[];
}

export interface AnalysisResult {
  sourceType: LinkType;
  normalizedUrl: string;
  suggestedUsernames: string[];
  warnings: string[];
  sentimentData?: SentimentOutput;
}

export interface TaggingRun {
  id: string;
  sourceUrl: string;
  normalizedUrl: string;
  sourceType: LinkType;
  confirmedUsernames: string[];
  commentCount?: number;
  sentimentSummary?: string;
  createdAt: Timestamp;
  createdBy: string;
  optionalText?: string;
}
