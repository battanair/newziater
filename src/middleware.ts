import { NextResponse, type NextRequest } from "next/server";

// Idiomas en la dirección: el español no lleva prefijo (ziater.com/obra/…) y el inglés
// lleva /en (ziater.com/en/obra/…). Por dentro, las páginas viven en app/[lang]/…,
// así que las direcciones sin prefijo se sirven (sin cambiar la URL) desde /es/….
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // /es/… no se usa: se redirige a la dirección sin prefijo
  if (pathname === "/es" || pathname.startsWith("/es/")) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }
  if (pathname === "/en" || pathname.startsWith("/en/")) return NextResponse.next();

  // Quien eligió inglés en el selector vuelve a la versión en inglés
  if (req.cookies.get("ziater-idioma")?.value === "en" && req.method === "GET") {
    const url = req.nextUrl.clone();
    url.pathname = pathname === "/" ? "/en" : "/en" + pathname;
    return NextResponse.redirect(url, 307);
  }

  const url = req.nextUrl.clone();
  url.pathname = "/es" + (pathname === "/" ? "" : pathname);
  url.search = search;
  return NextResponse.rewrite(url);
}

export const config = {
  // Fuera quedan la API, los archivos de Next y los archivos con extensión (imágenes, sitemap…)
  matcher: ["/((?!api/|_next/|_vercel/|opengraph-image|icon|apple-icon|.*\\.[a-zA-Z0-9]+$).*)"],
};
