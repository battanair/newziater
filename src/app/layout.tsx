import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SITE_URL } from "@/lib/firebase-config";

const serif = Bodoni_Moda({ subsets: ["latin"], variable: "--font-serif", display: "swap", weight: ["400", "500", "600", "700"], style: ["normal", "italic"] });
const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Ziater — La base de datos de las artes escénicas", template: "%s | Ziater" },
  description: "Obras de teatro, danza, circo e improvisación, con sus artistas, compañías y teatros. Descubre qué hay en cartel y la trayectoria de los profesionales de las artes vivas.",
  applicationName: "Ziater",
  openGraph: { type: "website", locale: "es_ES", siteName: "Ziater", url: SITE_URL },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#12100E", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <a href="#contenido" className="sr-only">Saltar al contenido</a>
        <AuthProvider>
          <Header />
          <div id="contenido">{children}</div>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
