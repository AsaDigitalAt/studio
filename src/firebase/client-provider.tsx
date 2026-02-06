'use client';

import React, { useMemo } from 'react';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { FirebaseProvider } from './provider';
import { firebaseConfig } from './config';

interface FirebaseClientProviderProps {
  children: React.ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseInstances = useMemo(() => {
    const apps = getApps();
    let app: FirebaseApp;
    if (apps.length > 0) {
      app = apps[0]!;
    } else {
      app = initializeApp(firebaseConfig);
    }
    const auth: Auth = getAuth(app);
    const firestore: Firestore = getFirestore(app);
    return { app, auth, firestore };
  }, []);

  return <FirebaseProvider value={firebaseInstances}>{children}</FirebaseProvider>;
}
