// Marca a un usuario como administrador de Ziater (custom claim admin=true).
//
// Uso (en tu ordenador, una sola vez):
//   1. Consola de Firebase → Configuración del proyecto → Cuentas de servicio →
//      «Generar nueva clave privada». Guarda el JSON como service-account.json
//      en esta carpeta (está en .gitignore: NUNCA lo subas a GitHub).
//   2. npm run admin:set -- tu-email@ejemplo.com
//   3. Cierra sesión y vuelve a entrar en Ziater.
//   4. Borra service-account.json cuando termines.

import { readFileSync } from "node:fs";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const email = process.argv[2];
if (!email) {
  console.error("Uso: npm run admin:set -- email@ejemplo.com");
  process.exit(1);
}

const sa = JSON.parse(readFileSync(new URL("../service-account.json", import.meta.url), "utf8"));
initializeApp({ credential: cert(sa) });

const user = await getAuth().getUserByEmail(email);
await getAuth().setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), admin: true });
console.log(`✓ ${email} (${user.uid}) ya es administrador. Cierra sesión y vuelve a entrar.`);
