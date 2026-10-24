"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { ObraCard } from "./Cards";
import { creditosDe, misNotas, miUsuario, porIds } from "@/lib/client-data";
import { fechaCorta, partirFunciones } from "@/lib/format";
import type { Obra } from "@/lib/types";

type Bloques = { enCartel: Obra[]; porPuntuar: Obra[]; deSeguidos: Obra[]; nombre: string };

/**
 * Portada personalizada (solo con sesión): obras de tu lista que están en
 * cartel, novedades de los artistas que sigues y obras vistas sin puntuar.
 */
export function ParaTi() {
  const { user } = useAuth();
  const [b, setB] = useState<Bloques | null>(null);

  useEffect(() => {
    if (!user) return setB(null);
    (async () => {
      try {
        const u = await miUsuario(user.uid);
        const quiero = (u.favoritos_obra ?? []).slice(-60);
        const vistas = (u.vistas ?? []).slice(-60);
        const seguidos = (u.favoritos_persona ?? []).slice(-10);
        const [obrasQuiero, notas, creditos] = await Promise.all([
          porIds<Obra>("obra", quiero),
          misNotas(user.uid).then((r) => r.notas).catch(() => []),
          Promise.all(seguidos.map((p) => creditosDe("id_persona", p).catch(() => []))),
        ]);
        const puntuadas = new Set(notas.map((n) => n.obra));
        const sinNota = vistas.filter((id) => !puntuadas.has(id)).slice(-6).reverse();
        const idsSeguidos = [...new Set(creditos.flat().filter((c) => (c.estado ?? "confirmado") === "confirmado").map((c) => c.id_obra))].filter((id) => !quiero.includes(id) && !vistas.includes(id));
        const [porPuntuar, deSeguidosTodas] = await Promise.all([porIds<Obra>("obra", sinNota), porIds<Obra>("obra", idsSeguidos.slice(0, 30))]);
        const enCartel = obrasQuiero.filter((o) => partirFunciones(o.funciones).proximas.length);
        const deSeguidos = deSeguidosTodas
          .sort((a, b) => String(b.ultima ?? b.anoinicio ?? "").localeCompare(String(a.ultima ?? a.anoinicio ?? "")))
          .slice(0, 6);
        setB({ enCartel, porPuntuar, deSeguidos, nombre: u.Nombre ?? "" });
      } catch {
        setB(null);
      }
    })();
  }, [user]);

  if (!user || !b) return null;
  const vacio = !b.enCartel.length && !b.porPuntuar.length && !b.deSeguidos.length;

  return (
    <div className="para-ti">
      {vacio ? (
        <section className="wrap section">
          <div className="panel" style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
            <p className="soft" style={{ margin: 0, flex: "1 1 320px" }}>
              {b.nombre ? `${b.nombre}, aquí` : "Aquí"} verás tus novedades: las obras de tu lista que estén en cartel y lo nuevo de los artistas que sigues. Empieza guardando una obra con «Quiero verla» o siguiendo a un artista.
            </p>
            <Link href="/obras" className="btn">Explorar obras</Link>
          </div>
        </section>
      ) : null}

      {b.enCartel.length ? (
        <section className="wrap section">
          <div className="section-head">
            <div><h2 className="h2">De tu lista, en cartel</h2><p className="muted" style={{ margin: "6px 0 0" }}>Obras que querías ver con funciones próximas</p></div>
            <Link href="/panel/listas/quiero-ver">Tu lista →</Link>
          </div>
          <div className="grid-posters">{b.enCartel.slice(0, 6).map((o) => <ObraCard key={o.id} obra={o} etiqueta={`Próxima: ${fechaCorta(partirFunciones(o.funciones).proximas[0].fecha)}`} />)}</div>
        </section>
      ) : null}

      {b.deSeguidos.length ? (
        <section className="wrap section">
          <div className="section-head">
            <div><h2 className="h2">De los artistas que sigues</h2><p className="muted" style={{ margin: "6px 0 0" }}>Obras en las que participan</p></div>
            <Link href="/panel/listas/artistas">Artistas que sigues →</Link>
          </div>
          <div className="grid-posters">{b.deSeguidos.map((o) => <ObraCard key={o.id} obra={o} />)}</div>
        </section>
      ) : null}

      {b.porPuntuar.length ? (
        <section className="wrap section">
          <div className="section-head">
            <div><h2 className="h2">¿Qué te parecieron?</h2><p className="muted" style={{ margin: "6px 0 0" }}>Las has visto pero aún no las has puntuado</p></div>
          </div>
          <div className="grid-posters">{b.porPuntuar.map((o) => <ObraCard key={o.id} obra={o} etiqueta="Puntúala ★" />)}</div>
        </section>
      ) : null}
    </div>
  );
}
