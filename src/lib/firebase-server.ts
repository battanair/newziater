import "server-only";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "./firebase-config";

// Lecturas públicas desde el servidor (render de fichas para SEO).
// Usa el SDK web con una app con nombre propio: solo puede leer lo que las
// reglas permiten leer a cualquiera, así que no necesita credenciales secretas.
const SERVER_APP = "ziater-server";

const app = getApps().some((a) => a.name === SERVER_APP)
  ? getApp(SERVER_APP)
  : initializeApp(firebaseConfig, SERVER_APP);

export const serverDb = getFirestore(app);
