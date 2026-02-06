'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, Send } from 'lucide-react';
import StarField from '@/components/app/starfield';
import AppHeader from '@/components/app/app-header';

export default function LoginPage() {
  const router = useRouter();
  const { auth } = useAuth();
  const { firestore } = useFirestore();
  const { toast } = useToast();
  const { user, loading: userLoading } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) {
      toast({
        variant: "destructive",
        title: "Erro de Configuração",
        description: "O serviço de autenticação ou banco de dados não está pronto.",
      });
      return;
    }
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user document in Firestore on first login
      const userDocRef = doc(firestore, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          status: 'active',
          createdAt: serverTimestamp(),
          displayName: user.displayName || user.email?.split('@')[0],
          photoURL: user.photoURL || `https://api.dicebear.com/8.x/bottts/svg?seed=${user.uid}`
        });
      }
      
      router.push('/analysis');

    } catch (error: any) {
      console.error('Error signing in:', error);
      let description = `Ocorreu um erro desconhecido. (Código: ${error.code})`;
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          description = "Email ou senha inválidos. Por favor, tente novamente.";
      } else if (error.code === 'auth/invalid-email') {
          description = "O formato do email é inválido.";
      } else if (error.code === 'auth/operation-not-allowed') {
          description = "Login por email e senha não está ativado no Firebase. Por favor, ative-o no console.";
      } else if (error.code === 'auth/network-request-failed') {
          description = "Erro de rede. Verifique sua conexão com a internet.";
      } else if (error.code === 'auth/invalid-api-key') {
          description = "A chave da API do Firebase é inválida. Verifique a configuração no arquivo .env.";
      } else if (error.code === 'permission-denied') {
          description = "Permissão negada para acessar o banco de dados. Verifique as regras de segurança do Firestore.";
      }
      
      toast({
        variant: "destructive",
        title: "Falha no Login",
        description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (!userLoading && user) {
      router.push('/analysis');
    }
  }, [user, userLoading, router]);

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans pb-20 relative overflow-x-hidden">
      <StarField />
      <AppHeader />

      <main className="max-w-md mx-auto px-6 py-12 space-y-10 relative z-10">
        <div className="text-center space-y-4 py-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400">
            Acesso à M.I.A.
          </h1>
          <p className="text-zinc-400 text-lg max-w-sm mx-auto leading-relaxed">
            Insira suas credenciais para iniciar a extração e análise de sentimento orbital.
          </p>
        </div>

        <div className="bg-zinc-900/30 border border-white/10 rounded-3xl p-1 backdrop-blur-xl shadow-2xl shadow-black/50">
          <form onSubmit={handleEmailSignIn} className="bg-black/20 rounded-[22px] p-8 space-y-6">
            <div className="space-y-3">
              <label className="text-[11px] uppercase tracking-widest font-bold text-zinc-500 ml-1 flex items-center gap-2">
                <Mail size={12} /> Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                disabled={isLoading}
                className="w-full bg-black/40 border-white/10 rounded-xl px-5 py-3 text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all disabled:opacity-50 font-mono text-sm shadow-inner"
                required
              />
            </div>
            <div className="space-y-3">
              <label className="text-[11px] uppercase tracking-widest font-bold text-zinc-500 ml-1 flex items-center gap-2">
                <Lock size={12} /> Senha
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                disabled={isLoading}
                className="w-full bg-black/40 border-white/10 rounded-xl px-5 py-3 text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all disabled:opacity-50 font-mono text-sm shadow-inner"
                required
              />
            </div>
            <div className="pt-4">
              <Button
                type="submit"
                className="w-full relative overflow-hidden bg-white text-black font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.5)] hover:scale-[1.01] active:scale-[0.99] text-base"
                size="lg"
                disabled={isLoading || !email || !password}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-200/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <div className="flex items-center justify-center gap-3 relative z-10">
                  {isLoading ? (
                     <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                  ) : (
                    <>
                      <span>ENTRAR</span>
                      <Send size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
