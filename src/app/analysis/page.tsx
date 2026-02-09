'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

// --- Firebase Imports ---
import { collection, onSnapshot, query, where } from 'firebase/firestore';

// --- Local Imports ---
import { useToast } from '@/hooks/use-toast';
import { startSentimentAnalysis } from '@/lib/actions';
import { type TaggingRun } from '@/lib/types';
import AppHeader from '@/components/app/app-header';
import StarField from '@/components/app/starfield';
import HistorySection from '@/components/app/history-section';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Instagram, Send } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';

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
      collection(firestore, 'tagging_runs'),
      where('createdBy', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const runs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TaggingRun[];
      runs.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
      setHistory(runs.slice(0, 20));
    }, (err) => {
        console.error("History fetch error:", err);
        toast({ variant: "destructive", title: "History Error", description: "Could not fetch past runs." });
    });
    return () => unsubscribe();
  }, [user, firestore, toast]);

  // --- Handlers ---

  const handleAnalyze = () => {
    if (!url || !user) return;
    
    startTransition(async () => {
      const result = await startSentimentAnalysis(url, optionalText, commentCount, user.uid);

      if (result.success && result.runId) {
        toast({
          title: "Análise Concluída!",
          description: "Os resultados foram processados e estão prontos.",
        });
        router.push(`/analysis/${result.runId}`);
      } else {
        toast({
          variant: "destructive",
          title: "Falha na Análise",
          description: result.error || "Não foi possível concluir a análise.",
        });
      }
    });
  };
  
  const isFormDisabled = isPending;

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
              <Input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://instagram.com/p/..." disabled={isFormDisabled} className="w-full bg-black/40 border-white/10 rounded-xl px-5 py-3 text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all disabled:opacity-50 font-mono text-sm shadow-inner" />
            </div>
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-6`}>
              <div className="md:col-span-2 space-y-3">
                <label className="text-[11px] uppercase tracking-widest font-bold text-zinc-500 ml-1">Legenda (Opcional)</label>
                <Textarea value={optionalText} onChange={(e) => setOptionalText(e.target.value)} placeholder="Cole a legenda completa aqui..." disabled={isFormDisabled} className="w-full bg-black/40 border-white/10 rounded-xl px-5 py-3 text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all disabled:opacity-50 font-mono text-sm shadow-inner min-h-[100px]" />
              </div>
              <div className="space-y-3">
                <label className="text-[11px] uppercase tracking-widest font-bold text-zinc-500 ml-1">Nº de Comentários</label>
                <Input type="number" min="0" value={commentCount} onChange={(e) => setCommentCount(e.target.value)} placeholder="0" disabled={isFormDisabled} className="w-full bg-black/40 border-white/10 rounded-xl px-5 py-3 text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all disabled:opacity-50 font-mono text-sm shadow-inner" />
              </div>
            </div>

            {!isFormDisabled && (
              <div className="pt-4">
                <Button onClick={handleAnalyze} disabled={!url} className="w-full relative overflow-hidden bg-white text-black font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.5)] hover:scale-[1.01] active:scale-[0.99] text-base">
                   <span>INICIAR VARREDURA</span> <Send size={18} />
                </Button>
              </div>
            )}

            {isFormDisabled && (
               <div className="py-12 flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in duration-500">
                  <div className="relative">
                     <div className="absolute inset-0 bg-primary/20 blur-2xl animate-pulse"></div>
                     <Loader2 className="animate-spin text-primary w-12 h-12 relative z-10" />
                  </div>
                  <p className="text-zinc-400 text-sm font-medium tracking-wide text-center">
                    Análise em processamento... Por favor, aguarde.
                  </p>
               </div>
            )}
          </div>
        </div>

        <HistorySection history={history} />
      </main>
    </div>
  );
}
