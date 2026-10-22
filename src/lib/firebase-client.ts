"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "./firebase-config";

// Instancia única en el navegador
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
// Sin API key (p. ej. una compilación sin variables) no se inicia el login:
// las páginas públicas siguen funcionando y AuthProvider trata a todos como invitados.
export const authDisponible = Boolean(firebaseConfig.apiKey);
export const auth = (authDisponible ? getAuth(app) : null) as unknown as Auth;
export const db = getFirestore(app);
