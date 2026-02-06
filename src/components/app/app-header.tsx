'use client';

import { LogOut, Sparkles, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useState, useEffect } from 'react';

import { useAuth, useFirestore, useUser } from '@/firebase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface UserProfile {
  displayName?: string;
  photoURL?: string;
  email?: string;
}

export default function AppHeader() {
  const router = useRouter();
  const { auth } = useAuth();
  const { firestore } = useFirestore();
  const { user, loading: userLoading } = useUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user && firestore) {
      const userDocRef = doc(firestore, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          setUserProfile(doc.data() as UserProfile);
        } else {
          // Fallback to auth data if firestore doc doesn't exist yet
          setUserProfile({
            displayName: user.displayName || user.email?.split('@')[0],
            photoURL: user.photoURL || `https://api.dicebear.com/8.x/bottts/svg?seed=${user.uid}`,
            email: user.email,
          });
        }
      });
      return () => unsubscribe();
    } else {
      setUserProfile(null);
    }
  }, [user, firestore]);

  const handleSignOut = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/');
  };

  const getInitials = (email: string | null | undefined) => {
    return email ? email.charAt(0).toUpperCase() : <UserIcon size={20} />;
  };

  const isLoading = userLoading || (user && !userProfile);

  return (
    <header className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-3xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center border border-primary/30 shadow-[0_0_15px_-3px_hsl(var(--primary))]">
            <Sparkles size={20} className="text-primary animate-pulse duration-1500" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-white leading-none">M.I.A.</h1>
            <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-medium">Extração Orbital</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isLoading ? (
             <div className="w-10 h-10 bg-zinc-800 rounded-full animate-pulse"></div>
          ) : user && userProfile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 border-2 border-transparent hover:border-primary transition-colors">
                    <AvatarImage src={userProfile.photoURL ?? ''} alt={userProfile.displayName ?? 'Avatar'} />
                    <AvatarFallback className="bg-zinc-800 text-zinc-400">
                      {getInitials(userProfile.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-zinc-900/80 backdrop-blur-xl border-white/10 text-zinc-200" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-white">{userProfile.displayName}</p>
                    <p className="text-xs leading-none text-zinc-400">
                      {userProfile.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onSelect={handleSignOut} className="cursor-pointer focus:bg-red-500/20 focus:text-red-400">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>
    </header>
  );
}
