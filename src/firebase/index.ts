import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';
import { FirebaseClientProvider } from './client-provider';
import { useUser } from './auth/use-user';
import {
  useAuth,
  useFirestore,
  useFirebaseApp,
  FirebaseProvider,
} from './provider';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const firestore = getFirestore(app);

export {
  app,
  auth,
  firestore,
  FirebaseClientProvider,
  useUser,
  useAuth,
  useFirestore,
  useFirebaseApp,
  FirebaseProvider,
};
