import type { Metadata, Viewport } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TabBar } from "@/components/TabBar";
import { ToastProvider } from "@/components/Toast";
import { PendientesProvider } from "@/components/Pendientes";
import { SCRIPT_MODO } from "@/components/ModoToggle";
import { SITE_URL } from "@/lib/firebase-config";
// Analítica de Vercel: sin cookies ni datos personales, así que no necesita banner
import { Analytics } from "@vercel/analytics/next";

// Dos fuentes legibles: Fraunces para titulares y Source Sans 3 para el texto.
const serif = Fraunces({ subsets: ["latin"], variable: "--font-serif", display: "swap", weight: ["500", "600"] });
const sans = Source_Sans_3({ subsets: ["latin"], variable: "--font-sans", display: "swap", weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Ziater — La base de datos de las artes escénicas", template: "%s | Ziater" },
  description: "Obras de teatro, danza, circo e improvisación, con sus artistas, compañías y teatros. Descubre qué hay en cartel y la trayectoria de los profesionales de las artes vivas.",
  applicationName: "Ziater",
  openGraph: { type: "website", locale: "es_ES", siteName: "Ziater", url: SITE_URL },
  formatDetection: { telephone: false },
  appleWebApp: { title: "Ziater", statusBarStyle: "black-translucent" },
  twitter: { card: "summary_large_image" },
  // La canonical va en cada página (si estuviera aquí, todas las que no la definen apuntarían a la portada)
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
};

export const viewport: Viewport = { themeColor: "#131210", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        {/* Aplica el modo claro guardado antes de pintar, sin destello */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_MODO }} />
      </head>
      <body>
        <a href="#contenido" className="sr-only">Saltar al contenido</a>
        <AuthProvider>
          <PendientesProvider>
            <ToastProvider>
              <Header />
              <div id="contenido">{children}</div>
              <Footer />
              <TabBar />
            </ToastProvider>
          </PendientesProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
