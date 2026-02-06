'use client';

import React, { useMemo } from 'react';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { FirebaseProvider, type FirebaseContextType } from './provider';
import { firebaseConfig } from './config';

interface FirebaseClientProviderProps {
  children: React.ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseInstances = useMemo((): FirebaseContextType => {
    // If the API key is missing, don't even try to initialize.
    // This helps prevent crashes, especially during Server-Side Rendering.
    if (!firebaseConfig.apiKey) {
      console.error(
        'Firebase API Key is missing. The application will not be able to connect to Firebase. Please add your NEXT_PUBLIC_FIREBASE_API_KEY to the .env file.'
      );
      return { app: null, auth: null, firestore: null };
    }

    try {
      const apps = getApps();
      const app: FirebaseApp = apps.length > 0 ? apps[0]! : initializeApp(firebaseConfig);
      const auth: Auth = getAuth(app);
      const firestore: Firestore = getFirestore(app);
      return { app, auth, firestore };
    } catch (error) {
      console.error('--------------------------------------------------');
      console.error('🔥 Firebase initialization failed! 🔥');
      console.error('Error:', error);
      console.error('This is likely due to an incorrect or invalid Firebase configuration in your .env file.');
      console.error('Please double-check your NEXT_PUBLIC_FIREBASE_* variables.');
      console.error('--------------------------------------------------');
      return { app: null, auth: null, firestore: null };
    }
  }, []);

  return <FirebaseProvider value={firebaseInstances}>{children}</FirebaseProvider>;
}
