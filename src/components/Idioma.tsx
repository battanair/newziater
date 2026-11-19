"use client";

import NextLink from "next/link";
import { usePathname as useNextPathname, useRouter as useNextRouter } from "next/navigation";
import { createContext, forwardRef, useContext, useMemo, type ComponentProps } from "react";
import { ruta, sinIdioma, traductor, type Idioma, type T } from "@/lib/i18n";

const Ctx = createContext<Idioma>("es");

export function IdiomaProvider({ lang, children }: { lang: Idioma; children: React.ReactNode }) {
  return <Ctx.Provider value={lang}>{children}</Ctx.Provider>;
}
export function useIdioma(): Idioma {
  return useContext(Ctx);
}
export function useT(): T {
  const lang = useIdioma();
  return useMemo(() => traductor(lang), [lang]);
}
/** Para navegar desde código: useRuta()("/panel") → «/en/panel» en inglés. */
export function useRuta() {
  const lang = useIdioma();
  return (href: string) => ruta(lang, href);
}

/** next/link con el prefijo de idioma puesto (en inglés, /obra/x → /en/obra/x). */
const Enlace = forwardRef<HTMLAnchorElement, ComponentProps<typeof NextLink>>(function Enlace({ href, ...props }, ref) {
  const lang = useIdioma();
  const h = typeof href === "string" ? ruta(lang, href) : href;
  return <NextLink ref={ref} href={h} {...props} />;
});
export default Enlace;

/** useRouter de Next con el prefijo de idioma en push/replace/prefetch. */
export function useRouter() {
  const r = useNextRouter();
  const lang = useIdioma();
  return useMemo(() => ({
    ...r,
    push: (href: string, o?: Parameters<typeof r.push>[1]) => r.push(ruta(lang, href), o),
    replace: (href: string, o?: Parameters<typeof r.replace>[1]) => r.replace(ruta(lang, href), o),
    prefetch: (href: string) => r.prefetch(ruta(lang, href)),
  }), [r, lang]);
}

/** usePathname de Next sin el prefijo de idioma («/en/obras» → «/obras»), para comparar rutas. */
export function usePathname(): string {
  return sinIdioma(useNextPathname() || "/");
}
