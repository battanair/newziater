import "server-only";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Solo se usa para VERIFICAR los tokens de sesión de los usuarios en las rutas
// /api. Verificar un token solo necesita el projectId (descarga las claves
// públicas de Google), por eso no hace falta guardar una cuenta de servicio.
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "ziater2";

const adminApp = getApps()[0] ?? initializeApp({ projectId });

export async function verifyRequest(req: Request): Promise<{ uid: string; admin: boolean } | null> {
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer (.+)$/);
  if (!match) return null;
  try {
    const decoded = await getAuth(adminApp).verifyIdToken(match[1]);
    return { uid: decoded.uid, admin: decoded.admin === true };
  } catch {
    return null;
  }
}
