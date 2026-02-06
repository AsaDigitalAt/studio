import { FirebaseOptions } from 'firebase/app';

// This configuration is loaded from environment variables.
// You must add your Firebase project configuration to a .env file.
export const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

if (!firebaseConfig.apiKey) {
  console.error(
    '*******************************************************************************************\n' +
    '** FATAL ERROR: FIREBASE API KEY IS MISSING!                                             **\n' +
    '** The application cannot connect to Firebase without a valid API key.                   **\n' +
    '** Please add your NEXT_PUBLIC_FIREBASE_API_KEY from your Firebase project to the `.env` file. **\n' +
    '*******************************************************************************************'
  );
}
