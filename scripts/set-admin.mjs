// Marca a un usuario como administrador de Ziater (custom claim admin=true).
//
// Uso (una sola vez). Lo más fácil, en Google Cloud Shell (sin archivos de claves):
//   cd ~/newziater && git pull && npm run admin:set -- tu-email@ejemplo.com
// Después, cierra sesión en Ziater y vuelve a entrar.
// También funciona en tu ordenador con service-account.json en esta carpeta
// (está en .gitignore: NUNCA lo subas a GitHub; bórralo al terminar).

import { readFileSync } from "node:fs";
import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const email = process.argv[2];
if (!email) {
  console.error("Uso: npm run admin:set -- email@ejemplo.com");
  process.exit(1);
}

let credential;
try { credential = cert(JSON.parse(readFileSync(new URL("../service-account.json", import.meta.url), "utf8"))); }
catch { credential = applicationDefault(); }
initializeApp({ credential, projectId: "ziater2" });

const user = await getAuth().getUserByEmail(email);
await getAuth().setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), admin: true });
console.log(`✓ ${email} (${user.uid}) ya es administrador. Cierra sesión y vuelve a entrar.`);
