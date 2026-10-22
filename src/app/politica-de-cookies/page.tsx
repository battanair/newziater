import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Política de cookies", alternates: { canonical: "/politica-de-cookies" } };

// Texto migrado de la web anterior (10/03/2025).
export default function Page() {
  return (
    <LegalPage title="Política de cookies">
      <p>Fecha de entrada en vigor: 10/03/2025</p>
      <h2 className="h3" style={{ marginTop: 32 }}>¿Qué son las cookies?</h2>
      <p>Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web. En Ziater las utilizamos para mejorar tu experiencia y analizar el uso del sitio.</p>
      <h2 className="h3" style={{ marginTop: 32 }}>Tipos de cookies que utilizamos</h2>
      <ul>
        <li>Cookies técnicas necesarias para el funcionamiento del sitio.</li>
        <li>Cookies de análisis para entender cómo se utiliza la plataforma.</li>
        <li>Cookies de autenticación para mantener tu sesión iniciada.</li>
      </ul>
      <h2 className="h3" style={{ marginTop: 32 }}>Cómo gestionar las cookies</h2>
      <p>Puedes configurar tu navegador para rechazar cookies o eliminar las existentes. Ten en cuenta que algunas funciones del sitio podrían dejar de funcionar correctamente.</p>
    </LegalPage>
  );
}
