import "server-only";

// Límite de peticiones sencillo (ventana deslizante en memoria). Cada instancia del
// servidor lleva su propia cuenta, así que es una primera barrera contra abusos y bots,
// no un límite exacto. Para un límite global, usar el cortafuegos (WAF) de Vercel.
const cubos = new Map<string, number[]>();

export function limitar(clave: string, maximo: number, ventanaMs = 60_000): boolean {
  const ahora = Date.now();
  const recientes = (cubos.get(clave) ?? []).filter((t) => ahora - t < ventanaMs);
  if (recientes.length >= maximo) {
    cubos.set(clave, recientes);
    return false;
  }
  recientes.push(ahora);
  cubos.set(clave, recientes);
  if (cubos.size > 5000) for (const [k, v] of cubos) if (!v.length || ahora - v[v.length - 1] > ventanaMs) cubos.delete(k);
  return true;
}

/** IP del cliente según Vercel (la primera de x-forwarded-for). */
export function ipDe(req: Request): string {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "desconocida";
}
