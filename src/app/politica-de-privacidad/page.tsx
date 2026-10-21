import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Política de privacidad", alternates: { canonical: "/politica-de-privacidad" } };

// Texto migrado de la web anterior (10/03/2025). Revísalo con un asesor legal:
// conviene añadir responsable del tratamiento, base legal y derechos RGPD.
export default function Page() {
  return (
    <LegalPage title="Política de privacidad">
      <p>Fecha de entrada en vigor: 10/03/2025</p>
      <h2 className="h3" style={{ marginTop: 32 }}>1. Información que recopilamos</h2>
      <ul>
        <li>Información de autenticación a través de Firebase Authentication.</li>
        <li>Información de perfil: biografía, redes sociales o fotografías.</li>
        <li>Contenido proporcionado por el usuario: publicaciones, reseñas y comentarios.</li>
        <li>Datos de uso y tecnología: información sobre acceso y cookies.</li>
      </ul>
      <h2 className="h3" style={{ marginTop: 32 }}>2. Uso de la información</h2>
      <p>Utilizamos la información recopilada para permitir el acceso a Ziater.com, personalizar tu experiencia y mejorar la plataforma.</p>
      <h2 className="h3" style={{ marginTop: 32 }}>3. Compartición de información</h2>
      <p>No vendemos tu información, pero podríamos compartirla con proveedores de servicios y cumplir con requisitos legales.</p>
      <h2 className="h3" style={{ marginTop: 32 }}>4. Seguridad de los datos</h2>
      <p>Implementamos medidas de seguridad, pero recomendamos utilizar contraseñas seguras.</p>
    </LegalPage>
  );
}
