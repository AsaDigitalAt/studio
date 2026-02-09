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
import { type TaggingRun } from '@/lib/types';
import { analyzeLink } from '@/lib/utils';
import AppHeader from '@/components/app/app-header';
import StarField from '@/components/app/starfield';
import HistorySection from '@/components/app/history-section';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Instagram, MessageCircle, Hash, Send } from 'lucide-react';
import { useAuth, useFirestore, useUser } from '@/firebase';

// Main Application Component
export default function CosmicObserverPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { firestore } = useFirestore();

  const [url, setUrl] = useState('');
  const [optionalText, setOptionalText] = useState('');
  const [commentCount, setCommentCount] = useState<string>('');
  
  const [status, setStatus] = useState<'idle' | 'analyzing'>('idle');
  
  const { toast } = useToast();
  const [history, setHistory] = useState<TaggingRun[]>([]);
  
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/');
    }
  }, [user, userLoading, router]);
  
  useEffect(() => {
    if (!user || !firestore) return;

    const q = query(
      collection(firestore, 'tagging_runs'),
      where('createdBy', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const runs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TaggingRun[];

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

  const resetForm = () => {
    setUrl('');
    setOptionalText('');
    setCommentCount('');
    setStatus('idle');
  };

  const handleAnalyze = () => {
    if (!url || !optionalText || !user || !firestore) return;
    
    setStatus('analyzing');

    startTransition(async () => {
      const { sourceType, normalizedUrl, suggestedUsernames } = analyzeLink(url, optionalText);
      try {
        const runData: Omit<TaggingRun, 'id' | 'createdAt'> & {createdAt: any} = {
          sourceUrl: url,
          normalizedUrl: normalizedUrl,
          sourceType: sourceType,
          confirmedUsernames: suggestedUsernames,
          commentCount: commentCount ? parseInt(commentCount) : 0,
          sentimentSummary: "Análise em processamento...",
          createdBy: user.uid,
          createdAt: serverTimestamp(),
          ...(optionalText && { optionalText }),
        };
        await addDoc(collection(firestore, 'tagging_runs'), runData);
      } catch (error) {
        console.error("Error saving pre-analysis run to history", error);
      }

      const result = await getSentimentAnalysis(url, optionalText, commentCount);

      if (result.success) {
        toast({
          title: "Varredura Iniciada",
          description: "O webhook foi ativado. O processamento continuará em segundo plano.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Falha na Ativação",
          description: result.error || "Não foi possível ativar o webhook de análise.",
        });
      }
      resetForm();
    });
  };

  const restoreFromHistory = (run: TaggingRun) => {
    setUrl(run.sourceUrl);
    setOptionalText((run as any).optionalText || ''); 
    setCommentCount(run.commentCount ? run.commentCount.toString() : '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast({ title: "Dados Recuperados do Histórico", description: "Formulário preenchido com os parâmetros da missão." });
  };
  
  const isAnalyzing = status === 'analyzing' || isPending;

  if (userLoading) {
    return null; 
  }
  
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans pb-20 relative overflow-x-hidden">
      <StarField />
      <AppHeader />

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-10 relative z-10">
        
        <div className="text-center space-y-4 py-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400">
            Análise de Sentimento Orbital
          </h2>
          <p className="text-zinc-400 text-lg max-w-md mx-auto leading-relaxed">
            Insira os parâmetros abaixo. Nossa sonda processará o tom emocional diretamente do sinal.
          </p>
        </div>

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
                  disabled={isAnalyzing}
                  className="w-full bg-black/40 border-white/10 rounded-2xl px-5 py-4 text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all disabled:opacity-50 font-mono text-sm shadow-inner"
                />
              </div>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-3 gap-6`}>
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
                  disabled={isAnalyzing}
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
                  disabled={isAnalyzing}
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
                  <p className="text-zinc-400 text-sm font-medium tracking-wide animate-pulse">Ativando o webhook...</p>
               </div>
            )}
          </div>
        </div>

        <HistorySection history={history} onRestore={restoreFromHistory} />
      </main>
    </div>
  );
}
