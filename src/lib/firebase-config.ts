// Configuración pública de Firebase. Estos valores no son secretos: la seguridad
// la ponen las reglas de Firestore (firestore.rules) y la autenticación.
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "ziater2",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://ziater.com").replace(/\/$/, "");
