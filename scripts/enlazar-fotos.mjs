// Enlaza a sus obras fotos que ya estaban en Cloudinary pero no en ninguna ficha.
// Pasa también las fotos del campo antiguo (fotosObra) a fotos_obra. Máximo 5 por obra.
//   node scripts/enlazar-fotos.mjs            ← solo muestra lo que haría
//   node scripts/enlazar-fotos.mjs --aplicar
import { readFileSync } from "node:fs";
import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

let credential;
try { credential = cert(JSON.parse(readFileSync(new URL("../service-account.json", import.meta.url), "utf8"))); }
catch { credential = applicationDefault(); }
initializeApp({ credential, projectId: "ziater2" });
const db = getFirestore();
const aplicar = process.argv.includes("--aplicar");
const C = "https://res.cloudinary.com/dk0vvcpyn/image/upload/";

const NUEVAS = {
  ls2EWk4jrPhdE9yyyGqk: [C + "v1742323346/fiest5_aqrdfr.jpg"], // La Fiesta de la Democracia
  xnFQnZIZJr1wvmEWTKuM: [C + "v1743441979/1___etebxu.jpg", C + "v1743441983/2___x4vlve.jpg", C + "v1743441988/3___gkn6tf.jpg", C + "v1743441994/4___cquqfc.jpg"], // [ _ ]
};

for (const [id, nuevas] of Object.entries(NUEVAS)) {
  const ref = db.collection("obra").doc(id);
  const o = (await ref.get()).data();
  if (!o) { console.log(`${id}: no existe`); continue; }
  const fotos = [...new Set([...(o.fotos_obra ?? []), ...(o.fotosObra ?? []), ...nuevas])].filter(Boolean).slice(0, 5);
  console.log(`${o.titulo}: ${fotos.length} fotos`);
  fotos.forEach((f) => console.log("   " + f));
  if (aplicar) await ref.update({ fotos_obra: fotos, ...("fotosObra" in o ? { fotosObra: FieldValue.delete() } : {}) });
}
console.log(aplicar ? "Hecho." : "Prueba: no se ha cambiado nada. Añade --aplicar para guardar.");
