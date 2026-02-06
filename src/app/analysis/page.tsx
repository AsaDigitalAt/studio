'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

// --- Firebase Imports ---
import { type User } from 'firebase/auth';
import { collection, addDoc, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore';

// --- Local Imports ---
import { useToast } from '@/hooks/use-toast';
import { getSentimentAnalysis } from '@/lib/actions';
import { type AnalysisResult, type TaggingRun } from '@/lib/types';
import { analyzeLink, sanitizeUsername } from '@/lib/utils';
import AppHeader from '@/components/app/app-header';
import StarField from '@/components/app/starfield';
import HistorySection from '@/components/app/history-section';
import AnalysisDashboard from '@/components/app/analysis-dashboard';
import SuccessView from '@/components/app/success-view';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Instagram, MessageCircle, Hash, Send } from 'lucide-react';
import { useAuth, useFirestore, useUser } from '@/firebase';

// Main Application Component
export default function CosmicObserverPage() {
  const router = useRouter();
  const { user } = useUser();
  const { firestore } = useFirestore();
  const { auth } = useAuth();

  const [url, setUrl] = useState('');
  const [optionalText, setOptionalText] = useState('');
  const [commentCount, setCommentCount] = useState<string>('');
  
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'review' | 'saving' | 'success'>('idle');
  const [loadingText, setLoadingText] = useState<string>('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  
  const [confirmedTags, setConfirmedTags] = useState<string[]>([]);
  const [manualInput, setManualInput] = useState('');
  
  const { toast } = useToast();
  const [history, setHistory] = useState<TaggingRun[]>([]);
  
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);
  
  useEffect(() => {
    if (!user || !firestore) return;

    // The query on createdBy and createdAt requires a composite index in Firestore.
    // To avoid forcing manual index creation in the Firebase console,
    // we'll fetch without ordering and sort on the client.
    const q = query(
      collection(firestore, 'tagging_runs'),
      where('createdBy', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const runs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TaggingRun[];

      // Sort client-side to ensure the newest runs are first
      runs.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.toMillis() - a.createdAt.toMillis();
        }
        return 0;
      });

      setHistory(runs.slice(0, 20));
    }, (err) => {
        console.error("History fetch error:", err)
        toast({
          variant: "destructive",
          title: "History Error",
          description: "Could not fetch past runs.",
        });
    });

    return () => unsubscribe();
  }, [user, firestore, toast]);

  const handleAnalyze = () => {
    if (!url || !optionalText) return;
    
    setStatus('analyzing');
    setLoadingText('Acessando os fluxos de sentimento...');

    startTransition(async () => {
      const result = await getSentimentAnalysis(url, optionalText, commentCount);
      
      if (result.error) {
        toast({
          variant: "destructive",
          title: "Análise Remota Indisponível",
          description: result.error,
        });
        setStatus('idle');
        return;
      }
      
      const localResult = analyzeLink(url, optionalText);
      const sentimentData = result.data;
      const webhookUsernames = sentimentData.comentarios_analisados.map(c => sanitizeUsername(c.nome_usuario));
      const allTags = Array.from(new Set([...localResult.suggestedUsernames, ...webhookUsernames]));
      const warnings = [...localResult.warnings];
      if (allTags.length === 0) {
         if (!warnings.includes('Nenhum dado detectado.')) warnings.push('Nenhum dado detectado.');
      }

      setAnalysis({
        ...localResult,
        suggestedUsernames: allTags,
        sentimentData: sentimentData,
        warnings: warnings
      });
      setConfirmedTags(allTags);
      
      toast({
        title: "Análise Concluída",
        description: "Dados de sentimento recebidos com sucesso!",
      });
      setStatus('review');
    });
  };

  const handleAddManualTag = (e?: React.FormEvent) => {
    e?.preventDefault();
    const tag = sanitizeUsername(manualInput);
    if (!tag || confirmedTags.includes(tag)) {
      setManualInput('');
      return;
    }
    setConfirmedTags(prev => [...prev, tag]);
    setManualInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setConfirmedTags(prev => prev.filter(t => t !== tag));
  };

  const handleConfirm = async () => {
    if (!user || !firestore || !analysis) return;
    
    if (confirmedTags.length === 0 && !analysis.sentimentData) {
      toast({ variant: "destructive", title: "Nenhum dado para salvar." });
      return;
    }

    setStatus('saving');

    try {
      const runData: Omit<TaggingRun, 'id' | 'createdAt'> & {createdAt: any} = {
        sourceUrl: url,
        normalizedUrl: analysis.normalizedUrl,
        sourceType: analysis.sourceType,
        confirmedUsernames: confirmedTags,
        commentCount: commentCount ? parseInt(commentCount) : 0,
        sentimentSummary: analysis.sentimentData?.resumo_geral || undefined,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        ...(optionalText && { optionalText }),
      };

      await addDoc(collection(firestore, 'tagging_runs'), runData);

      setStatus('success');
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro ao Salvar", description: "Não foi possível arquivar os dados." });
      setStatus('review');
    }
  };

  const resetForm = () => {
    setUrl('');
    setOptionalText('');
    setCommentCount('');
    setStatus('idle');
    setAnalysis(null);
    setConfirmedTags([]);
    setManualInput('');
  };

  const restoreFromHistory = (run: TaggingRun) => {
    setUrl(run.sourceUrl);
    setOptionalText((run as any).optionalText || ''); 
    setCommentCount(run.commentCount ? run.commentCount.toString() : '');
    setAnalysis({
        sourceType: run.sourceType,
        normalizedUrl: run.normalizedUrl,
        suggestedUsernames: [],
        warnings: ["Análise detalhada de sentimento não é persistida no histórico."],
        sentimentData: run.sentimentSummary ? { resumo_geral: run.sentimentSummary, totais: {positivos: 0, negativos: 0, neutros: 0, total: run.commentCount || 0}, comentarios_analisados: [] } : undefined
    });
    setConfirmedTags(run.confirmedUsernames);
    setStatus('review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast({ title: "Dados Recuperados do Histórico" });
  };
  
  const isAnalyzing = status === 'analyzing' || isPending;
  const isInputDisabled = isAnalyzing || status === 'review' || status === 'saving';

  if (!user) {
    return null; // Ou um spinner de carregamento
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans pb-20 relative overflow-x-hidden">
      <StarField />
      <AppHeader />

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-10 relative z-10">
        
        {status === 'idle' && (
          <div className="text-center space-y-4 py-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400">
              Análise de Sentimento Orbital
            </h2>
            <p className="text-zinc-400 text-lg max-w-md mx-auto leading-relaxed">
              Insira os parâmetros abaixo. Nossa sonda processará o tom emocional diretamente do sinal.
            </p>
          </div>
        )}

        {status === 'success' && <SuccessView onReset={resetForm} />}

        {status !== 'success' && (
          <div className="bg-zinc-900/30 border border-white/10 rounded-3xl p-1 backdrop-blur-xl shadow-2xl shadow-black/50">
            <div className="bg-black/20 rounded-[22px] p-8 space-y-8">
              
              <div className="space-y-3">
                <label className="text-[11px] uppercase tracking-widest font-bold text-zinc-500 ml-1 flex items-center gap-2">
                  <Instagram size={12} /> Link do Post
                </label>
                <div className="relative group">
                  <Input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://instagram.com/p/..."
                    disabled={isInputDisabled}
                    className="w-full bg-black/40 border-white/10 rounded-2xl px-5 py-4 text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all disabled:opacity-50 font-mono text-sm shadow-inner"
                  />
                  {isAnalyzing && (
                    <div className="absolute right-5 top-4">
                      <Loader2 className="animate-spin text-primary" size={20} />
                    </div>
                  )}
                </div>
              </div>

              <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-500 ${isInputDisabled ? 'hidden opacity-0' : 'block opacity-100'}`}>
                <div className="md:col-span-2 space-y-3">
                  <div className="flex justify-between items-end">
                     <label className="text-[11px] uppercase tracking-widest font-bold text-zinc-500 ml-1 flex items-center gap-2">
                       <MessageCircle size={12} /> Legenda
                     </label>
                     <span className="text-[10px] text-zinc-600 font-mono">OBRIGATÓRIO</span>
                  </div>
                  <Textarea
                    value={optionalText}
                    onChange={(e) => setOptionalText(e.target.value)}
                    placeholder="Cole a legenda completa aqui..."
                    disabled={isInputDisabled}
                    className="w-full bg-black/40 border-white/10 rounded-2xl px-5 py-4 text-zinc-300 placeholder:text-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all min-h-[120px] resize-none text-sm leading-relaxed shadow-inner"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] uppercase tracking-widest font-bold text-zinc-500 ml-1 flex items-center gap-2">
                     <Hash size={12} /> Qtd. Comentários
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={commentCount}
                    onChange={(e) => setCommentCount(e.target.value)}
                    placeholder="0"
                    disabled={isInputDisabled}
                    className="w-full bg-black/40 border-white/10 rounded-2xl px-5 py-4 text-zinc-100 placeholder:text-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-sm font-mono shadow-inner h-[120px] text-center text-3xl"
                  />
                </div>
              </div>

              {status === 'idle' && (
                <div className="pt-4">
                  <Button
                    onClick={handleAnalyze}
                    disabled={!url || !optionalText || isAnalyzing}
                    className="w-full relative overflow-hidden bg-white text-black font-bold py-4 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.5)] hover:scale-[1.01] active:scale-[0.99] text-base"
                    size="lg"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-200/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <div className="flex items-center justify-center gap-3 relative z-10">
                      <span>INICIAR VARREDURA</span>
                      <Send size={18} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Button>
                </div>
              )}

              {isAnalyzing && (
                 <div className="py-12 flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in duration-500">
                    <div className="relative">
                       <div className="absolute inset-0 bg-primary/20 blur-2xl animate-pulse"></div>
                       <Loader2 className="animate-spin text-primary w-12 h-12 relative z-10" />
                    </div>
                    <p className="text-zinc-400 text-sm font-medium tracking-wide animate-pulse">{loadingText}</p>
                 </div>
              )}
              
              {(status === 'review' || status === 'saving') && analysis && (
                <AnalysisDashboard
                  analysis={analysis}
                  confirmedTags={confirmedTags}
                  manualInput={manualInput}
                  status={status}
                  onAddManualTag={handleAddManualTag}
                  onRemoveTag={handleRemoveTag}
                  onManualInputChange={setManualInput}
                  onConfirm={handleConfirm}
                  onReset={resetForm}
                />
              )}
            </div>
          </div>
        )}

        <HistorySection history={history} onRestore={restoreFromHistory} />
      </main>
    </div>
  );
}
