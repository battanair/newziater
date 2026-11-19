import type { Metadata } from "next";
import Link from "@/components/Idioma";
import { LegalPage } from "@/components/LegalPage";
import { alternos, idiomaDe } from "@/lib/i18n";


export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = idiomaDe((await params).lang);
  return lang === "en"
    ? { title: "Cookie policy", description: "What Ziater stores in your browser and why.", alternates: alternos(lang, "/politica-de-cookies") }
    : { title: "Política de cookies", description: "Qué guarda Ziater en tu navegador y para qué.", alternates: alternos(lang, "/politica-de-cookies") };
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  return idiomaDe((await params).lang) === "en" ? <En /> : <Es />;
}

const H = ({ children }: { children: React.ReactNode }) => <h2 className="h3" style={{ marginTop: 36 }}>{children}</h2>;

function Es() {
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
        <li><strong>Tráiler de las obras:</strong> mostramos la imagen de portada del vídeo, que se descarga de los servidores de YouTube (Google) sin cookies. El reproductor no se carga hasta que pulsas sobre él; al hacerlo, YouTube puede guardar sus propios datos en tu navegador. Usamos su modo de privacidad mejorada.</li>
        <li><strong>Preferencias:</strong> modo claro u oscuro, tu idioma, y una marca que indica si tienes la sesión iniciada para mostrarte la portada adecuada.</li>
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

// English version
function En() {
  return (
    <LegalPage title="Cookie policy">
      <p>Last updated: 8 November 2026.</p>
      <p>
        Ziater does not use advertising or tracking cookies, and does not share your browsing with third parties to show you ads. We only store
        in your browser what the website needs to work, and a few preferences.
      </p>

      <H>What we store in your browser</H>
      <ul>
        <li><strong>Session (Firebase Authentication):</strong> if you sign in, the browser keeps your session so you are not asked for your password on every visit. It is essential for the service and disappears when you sign out.</li>
        <li><strong>Show trailers:</strong> we display the video&apos;s cover image, downloaded from YouTube (Google) servers without cookies. The player does not load until you click on it; when you do, YouTube may store its own data in your browser. We use its privacy-enhanced mode.</li>
        <li><strong>Preferences:</strong> light or dark mode, your language, and a flag that shows whether you are signed in so we can show you the right home page.</li>
        <li><strong>Your cookie choice:</strong> we remember whether you accepted or rejected statistics so we do not ask you again.</li>
        <li><strong>Our own visit counter (only if you accept it):</strong> a marker with the day&apos;s date so the same visitor is not counted twice in the daily statistics. It contains no personal data and is not shared with anyone.</li>
      </ul>

      <H>Statistics</H>
      <p>
        If you accept statistics in the cookie notice, we measure visits anonymously and in aggregate with our own counter and with Vercel Web
        Analytics, which works without cookies and without identifying you. We only see totals (for example, how many people visited show pages
        on a given day). If you reject them, Vercel Web Analytics does not load and our counter only adds the visit, without storing anything in
        your browser. You can change your choice at any time from &quot;Cookie settings&quot; in the footer.
      </p>

      <H>How to delete it</H>
      <p>
        You can delete the data stored by Ziater at any time from your browser settings (under &quot;Site data&quot; or &quot;Cookies and site
        data&quot;). If you do, you will need to sign in again.
      </p>
      <p>More information on how we handle your data in the <Link href="/politica-de-privacidad">privacy policy</Link>.</p>
    </LegalPage>
  );
}
