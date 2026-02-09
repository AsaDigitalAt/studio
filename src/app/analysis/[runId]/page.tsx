'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { useFirestore, useUser } from '@/firebase';
import { type TaggingRun } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import AppHeader from '@/components/app/app-header';
import StarField from '@/components/app/starfield';
import AnalysisResultDashboard from '@/components/app/analysis-result-dashboard';

export default function AnalysisResultPage() {
  const router = useRouter();
  const params = useParams();
  const { runId } = params;
  
  const { user, loading: userLoading } = useUser();
  const { firestore } = useFirestore();
  const { toast } = useToast();

  const [run, setRun] = useState<TaggingRun | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/');
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (!firestore || !runId || !user) return;

    const docRef = doc(firestore, 'tagging_runs', runId as string);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Omit<TaggingRun, 'id'>;
        // Basic security check
        if (data.createdBy !== user.uid) {
            toast({ variant: "destructive", title: "Acesso Negado", description: "Você não tem permissão para ver esta análise." });
            router.push('/analysis');
            return;
        }
        setRun({ id: docSnap.id, ...data } as TaggingRun);
      } else {
        toast({ variant: "destructive", title: "Não Encontrado", description: "A análise solicitada não existe." });
        router.push('/analysis');
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching analysis run:", error);
      toast({ variant: "destructive", title: "Erro ao Carregar", description: "Não foi possível carregar os dados da análise." });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, runId, user, router, toast]);

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans pb-20 relative overflow-x-hidden">
      <StarField />
      <AppHeader />
      <main className="max-w-3xl mx-auto px-6 py-12 space-y-10 relative z-10">
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <Link href="/analysis" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6 text-sm font-bold uppercase tracking-wider">
                <ArrowLeft size={16} />
                Voltar para Análises
            </Link>

            {loading || userLoading ? (
                <div className="py-24 flex flex-col items-center justify-center space-y-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-2xl animate-pulse"></div>
                        <Loader2 className="animate-spin text-primary w-12 h-12 relative z-10" />
                    </div>
                    <p className="text-zinc-400 text-sm font-medium tracking-wide text-center">
                        Carregando dados da missão...
                    </p>
                </div>
            ) : run ? (
                <AnalysisResultDashboard run={run} />
            ) : (
                <p className="text-center text-zinc-500 py-20">Análise não encontrada.</p>
            )}
        </div>
      </main>
    </div>
  );
}
