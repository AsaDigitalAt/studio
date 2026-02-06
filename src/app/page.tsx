'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useAuth } from '@/firebase'; // Assumindo que useAuth existe
import { Button } from '@/components/ui/button';
import { Chrome } from 'lucide-react';
import StarField from '@/components/app/starfield';
import AppHeader from '@/components/app/app-header';

export default function LoginPage() {
  const router = useRouter();
  const { auth } = useAuth(); // Hook para acessar a instância de autenticação

  const handleGoogleSignIn = async () => {
    if (!auth) {
      console.error("Firebase Auth is not initialized.");
      // Adicionar um toast de erro aqui seria uma boa prática
      return;
    }
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/analysis');
    } catch (error) {
      console.error('Error signing in with Google:', error);
      // Adicionar um toast de erro aqui
    }
  };
  
  // Efeito para redirecionar se o usuário já estiver logado
  React.useEffect(() => {
    if (auth?.currentUser) {
      router.push('/analysis');
    }
  }, [auth, router]);


  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans pb-20 relative overflow-x-hidden">
      <StarField />
      <AppHeader />

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-10 relative z-10">
        <div className="text-center space-y-6 py-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400">
            Acesso à M.I.A.
          </h1>
          <p className="text-zinc-400 text-lg max-w-md mx-auto leading-relaxed">
            Faça login para iniciar a extração e análise de sentimento orbital.
          </p>
          <div className="pt-6">
            <Button
              onClick={handleGoogleSignIn}
              className="bg-white text-black font-bold py-4 px-8 rounded-2xl transition-all disabled:opacity-50 group shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.5)] hover:scale-[1.02] active:scale-[0.99] text-base"
              size="lg"
            >
              <div className="flex items-center justify-center gap-3">
                <Chrome size={20} />
                <span>Entrar com Google</span>
              </div>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
