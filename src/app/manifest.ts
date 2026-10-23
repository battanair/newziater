import type { MetadataRoute } from "next";

// Permite "Añadir a la pantalla de inicio" con nombre, colores e iconos de Ziater.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ziater — La base de datos de las artes escénicas",
    short_name: "Ziater",
    description: "Obras, artistas y compañías de teatro, danza, circo e improvisación.",
    lang: "es",
    start_url: "/",
    display: "standalone",
    background_color: "#131210",
    theme_color: "#131210",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
