'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

// --- Firebase Imports ---
import { collection, onSnapshot, query, where } from 'firebase/firestore';

// --- Local Imports ---
import { useToast } from '@/hooks/use-toast';
import { startSentimentAnalysis, getAnalysisResult } from '@/lib/actions';
import { type TaggingRun } from '@/lib/types';
import AppHeader from '@/components/app/app-header';
import StarField from '@/components/app/starfield';
import HistorySection from '@/components/app/history-section';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Instagram, MessageCircle, Hash, Send } from 'lucide-react';
import { useAuth, useFirestore, useUser } from '@/firebase';

type Status = 'idle' | 'starting' | 'polling';

// Main Application Component
export default function CosmicObserverPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { firestore } = useFirestore();
  const { toast } = useToast();

  // Form State
  const [url, setUrl] = useState('');
  const [optionalText, setOptionalText] = useState('');
  const [commentCount, setCommentCount] = useState<string>('');
  
  // Async State
  const [status, setStatus] = useState<Status>('idle');
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Data State
  const [history, setHistory] = useState<TaggingRun[]>([]);

  // --- Effects ---

  // Redirect if not logged in
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/');
    }
  }, [user, userLoading, router]);
  
  // Listen for history changes in Firestore
  useEffect(() => {
    if (!user || !firestore) return;
    const q = query(
      collection(firestore, 'analysisRuns'), // Updated collection name
      where('createdBy', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const runs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TaggingRun[];
      runs.sort((a, b) => (b.startedAt?.toMillis() ?? 0) - (a.startedAt?.toMillis() ?? 0));
      setHistory(runs.slice(0, 20));
    }, (err) => {
        console.error("History fetch error:", err);
        toast({ variant: "destructive", title: "History Error", description: "Could not fetch past runs." });
    });
    return () => unsubscribe();
  }, [user, firestore, toast]);

  // Poll for results when a run is active
  useEffect(() => {
    if (status !== 'polling' || !currentRunId) return;

    const intervalId = setInterval(async () => {
      const result = await getAnalysisResult(currentRunId);
      
      if (result.error) {
        console.error("Polling error:", result.error);
        // Keep polling for a while even on error, in case it's transient
        return;
      }

      if (result.status === 'completed') {
        clearInterval(intervalId);
        toast({ title: 'Análise Concluída!', description: 'O resultado foi atualizado no seu histórico.' });
        resetForm();
      } else if (result.status === 'failed') {
        clearInterval(intervalId);
        toast({ variant: "destructive", title: 'Análise Falhou', description: result.error || 'Ocorreu um erro durante o processamento.' });
        resetForm();
      }
      // If status is 'processing', do nothing and let the interval continue.
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [status, currentRunId, toast]);


  // --- Handlers ---

  const resetForm = () => {
    setUrl('');
    setOptionalText('');
    setCommentCount('');
    setStatus('idle');
    setCurrentRunId(null);
  };

  const handleAnalyze = () => {
    if (!url || !optionalText || !user) return;
    
    setStatus('starting');
    startTransition(async () => {
      const result = await startSentimentAnalysis(url, optionalText, commentCount);

      if (result.runId) {
        setCurrentRunId(result.runId);
        setStatus('polling');
        toast({
          title: "Análise Iniciada",
          description: "O processo já começou. Você será notificado quando terminar.",
        });
        // Don't reset the form here, keep it disabled
      } else {
        toast({
          variant: "destructive",
          title: "Falha ao Iniciar",
          description: result.error || "Não foi possível iniciar a análise.",
        });
        setStatus('idle'); // Reset on failure
      }
    });
  };

  const restoreFromHistory = (run: TaggingRun) => {
    setUrl(run.sourceUrl);
    setOptionalText((run as any).optionalText || '');
    setCommentCount(run.commentCount ? run.commentCount.toString() : '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast({ title: "Dados Recuperados do Histórico", description: "Formulário preenchido com os parâmetros da missão." });
  };
  
  const isProcessing = status === 'starting' || status === 'polling' || isPending;

  // --- Render ---

  if (userLoading || !user) {
    return null; // Or a full-page loader
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
            
            {/* --- FORM INPUTS --- */}
            <div className="space-y-3">
              <label className="text-[11px] uppercase tracking-widest font-bold text-zinc-500 ml-1 flex items-center gap-2"><Instagram size={12} /> Link do Post</label>
              <Input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://instagram.com/p/..." disabled={isProcessing} className="..." />
            </div>
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-6`}>
              <div className="md:col-span-2 space-y-3">
                <label>...</label>
                <Textarea value={optionalText} onChange={(e) => setOptionalText(e.target.value)} placeholder="Cole a legenda completa aqui..." disabled={isProcessing} className="..." />
              </div>
              <div className="space-y-3">
                <label>...</label>
                <Input type="number" min="0" value={commentCount} onChange={(e) => setCommentCount(e.target.value)} placeholder="0" disabled={isProcessing} className="..." />
              </div>
            </div>

            {status === 'idle' && (
              <div className="pt-4">
                <Button onClick={handleAnalyze} disabled={!url || !optionalText || isProcessing} className="...">
                   <span>INICIAR VARREDURA</span> <Send size={18} />
                </Button>
              </div>
            )}

            {isProcessing && (
               <div className="py-12 flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in duration-500">
                  <div className="relative">
                     <div className="absolute inset-0 bg-primary/20 blur-2xl animate-pulse"></div>
                     <Loader2 className="animate-spin text-primary w-12 h-12 relative z-10" />
                  </div>
                  <p className="text-zinc-400 text-sm font-medium tracking-wide text-center">
                    {status === 'starting' ? 'Iniciando conexão com o webhook...' : 'Análise em andamento...\nIsso pode levar alguns minutos. Você pode sair desta tela.'}
                  </p>
               </div>
            )}
          </div>
        </div>

        <HistorySection history={history} onRestore={restoreFromHistory} />
      </main>
    </div>
  );
}
