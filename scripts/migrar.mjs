// Prepara las fichas antiguas para la búsqueda y las selecciones de portada.
// Añade a cada documento los campos que la web nueva necesita y que las fichas
// antiguas no tienen. No borra ni cambia nada más. Se puede ejecutar varias veces.
//
//   obra         → claves (búsqueda) y creado (fecha de alta del documento)
//   persona      → claves
//   productoras  → claves
//
// Uso (una sola vez). Lo más fácil: Google Cloud Shell (sin archivos de claves).
// También en tu ordenador con service-account.json como en set-admin.mjs:
//   npm run migrar            ← solo cuenta lo que cambiaría
//   npm run migrar -- --aplicar

import { readFileSync } from "node:fs";
import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const aplicar = process.argv.includes("--aplicar");
// Con service-account.json si existe; si no (p. ej. en Google Cloud Shell),
// con las credenciales de la cuenta con la que has iniciado sesión.
let credential;
try {
  credential = cert(JSON.parse(readFileSync(new URL("../service-account.json", import.meta.url), "utf8")));
} catch {
  credential = applicationDefault();
}
initializeApp({ credential, projectId: "ziater2" });
const db = getFirestore();

// Misma lógica que src/lib/claves.ts
const normalizar = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9ñ\s]/g, " ").replace(/\s+/g, " ").trim();
function clavesDe(...textos) {
  const set = new Set();
  for (const palabra of normalizar(textos.filter(Boolean).join(" ")).split(" ")) {
    for (let i = 2; i <= Math.min(palabra.length, 15); i++) set.add(palabra.slice(0, i));
  }
  return [...set].slice(0, 200);
}

async function migrar(col, campos) {
  const snap = await db.collection(col).get();
  let batch = db.batch(), enLote = 0, cambios = 0;
  for (const d of snap.docs) {
    const upd = campos(d);
    if (!Object.keys(upd).length) continue;
    cambios++;
    if (aplicar) {
      batch.update(d.ref, upd);
      if (++enLote === 400) { await batch.commit(); batch = db.batch(); enLote = 0; }
    }
  }
  if (aplicar && enLote) await batch.commit();
  console.log(`${col}: ${cambios} de ${snap.size} documentos ${aplicar ? "actualizados" : "por actualizar"}`);
}

const igual = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

await migrar("obra", (d) => {
  const o = d.data(), upd = {};
  const claves = clavesDe(o.titulo ?? "");
  if (!igual(o.claves, claves)) upd.claves = claves;
  if (!o.creado) upd.creado = d.createTime; // fecha real en la que se creó la ficha
  return upd;
});
await migrar("persona", (d) => {
  const p = d.data();
  const claves = clavesDe(p.Nombre ?? "", p.Apellidos ?? "");
  return igual(p.claves, claves) ? {} : { claves };
});
await migrar("productoras", (d) => {
  const p = d.data();
  const claves = clavesDe(p.nombre_prod ?? "");
  return igual(p.claves, claves) ? {} : { claves };
});

if (!aplicar) console.log("\nNo se ha cambiado nada. Ejecuta «npm run migrar -- --aplicar» para guardar los cambios.");
