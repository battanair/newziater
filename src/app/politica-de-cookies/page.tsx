import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Política de cookies", description: "Qué guarda Ziater en tu navegador y para qué.", alternates: { canonical: "/politica-de-cookies" } };

const H = ({ children }: { children: React.ReactNode }) => <h2 className="h3" style={{ marginTop: 36 }}>{children}</h2>;

export default function Page() {
  return (
    <LegalPage title="Política de cookies">
      <p>Última actualización: 8 de noviembre de 2026.</p>
      <p>
        Ziater no usa cookies publicitarias ni de seguimiento, ni comparte tu navegación con terceros para hacerte publicidad. Solo guardamos en
        tu navegador lo necesario para que la web funcione, y algunas preferencias.
      </p>

      <H>Qué guardamos en tu navegador</H>
      <ul>
        <li><strong>Sesión (Firebase Authentication):</strong> si entras con tu cuenta, el navegador guarda tu sesión para no pedirte la contraseña en cada visita. Es imprescindible para el servicio y desaparece al cerrar sesión.</li>
        <li><strong>Tráiler de las obras:</strong> los vídeos de YouTube no se cargan hasta que pulsas «Ver tráiler». Al hacerlo, YouTube (Google) puede guardar sus propios datos en tu navegador; usamos su modo de privacidad mejorada.</li>
        <li><strong>Preferencias:</strong> modo claro u oscuro, y una marca que indica si tienes la sesión iniciada para mostrarte la portada adecuada.</li>
        <li><strong>Tu elección sobre cookies:</strong> recordamos si aceptaste o rechazaste las estadísticas para no volver a preguntarte.</li>
        <li><strong>Contador de visitas propio (solo si lo aceptas):</strong> una marca con la fecha del día para no contar dos veces al mismo visitante en las estadísticas diarias. No contiene datos personales ni se comparte con nadie.</li>
      </ul>

      <H>Estadísticas</H>
      <p>
        Si aceptas las estadísticas en el aviso de cookies, medimos las visitas de forma anónima y agregada con nuestro propio contador y con
        Vercel Web Analytics, que funciona sin cookies y sin identificarte. Solo vemos cifras totales (por ejemplo, cuántas personas visitaron
        las fichas de obras un día). Si las rechazas, Vercel Web Analytics no se carga y nuestro contador solo suma la visita, sin guardar nada
        en tu navegador. Puedes cambiar tu elección cuando quieras desde «Configurar cookies», en el pie de la web.
      </p>

      <H>Cómo borrarlo</H>
      <p>
        Puedes borrar en cualquier momento los datos guardados por Ziater desde la configuración de tu navegador (en «Datos de sitios» o
        «Cookies y datos de sitios»). Si lo haces, tendrás que volver a iniciar sesión.
      </p>
      <p>Más información sobre cómo tratamos tus datos en la <Link href="/politica-de-privacidad">política de privacidad</Link>.</p>
    </LegalPage>
  );
}
