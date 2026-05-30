import { getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  type Auth,
} from "firebase/auth";

function requireEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing Firebase environment variable: ${name}`);
  }
  return value;
}

function getFirebaseConfig(): FirebaseOptions {
  return {
    apiKey: requireEnv(
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      "NEXT_PUBLIC_FIREBASE_API_KEY"
    ),
    authDomain: requireEnv(
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
    ),
    projectId: requireEnv(
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
    ),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: requireEnv(
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      "NEXT_PUBLIC_FIREBASE_APP_ID"
    ),
  };
}

export function getFirebaseAuth(): Auth {
  const app = getApps()[0] ?? initializeApp(getFirebaseConfig());
  return getAuth(app);
}

export async function getGoogleFirebaseIdToken(): Promise<string> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(getFirebaseAuth(), provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (!credential || !credential.idToken) {
    throw new Error("Unable to retrieve Google ID token from Firebase.");
  }
  return credential.idToken;
}
