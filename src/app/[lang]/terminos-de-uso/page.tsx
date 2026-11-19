import type { Metadata } from "next";
import Link from "@/components/Idioma";
import { LegalPage } from "@/components/LegalPage";
import { alternos, idiomaDe } from "@/lib/i18n";


export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = idiomaDe((await params).lang);
  return lang === "en"
    ? { title: "Terms of use", description: "Conditions for using Ziater, creating an account and publishing content.", alternates: alternos(lang, "/terminos-de-uso") }
    : { title: "Términos de uso", description: "Condiciones para usar Ziater, crear una cuenta y publicar contenido.", alternates: alternos(lang, "/terminos-de-uso") };
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  return idiomaDe((await params).lang) === "en" ? <En /> : <Es />;
}

const H = ({ children }: { children: React.ReactNode }) => <h2 className="h3" style={{ marginTop: 36 }}>{children}</h2>;

function Es() {
  return (
    <LegalPage title="Términos de uso">
      <p>Última actualización: 8 de noviembre de 2026.</p>
      <p>
        Ziater (ziater.com) es una base de datos abierta y gratuita de las artes escénicas (los datos del titular están en el{" "}
        <Link href="/aviso-legal">aviso legal</Link>). Al usar la web o
        crear una cuenta aceptas estos términos. Si no estás de acuerdo, por favor no la uses.
      </p>

      <H>1. El servicio</H>
      <p>
        Ziater permite consultar y publicar información sobre obras, artistas, compañías y salas: fichas, elencos, fechas de funciones, imágenes
        y valoraciones. Consultar la web es libre y gratuito. Para publicar, puntuar o guardar listas necesitas una cuenta, también gratuita.
      </p>

      <H>2. Tu cuenta</H>
      <ul>
        <li>Debes tener al menos 14 años y dar datos veraces.</li>
        <li>Eres responsable de lo que se haga con tu cuenta: guarda tu contraseña y no la compartas.</li>
        <li>Puedes dejar de usar Ziater cuando quieras y pedirnos que borremos tu cuenta desde el <Link href="/contacto">formulario de contacto</Link>.</li>
      </ul>

      <H>3. Lo que publicas</H>
      <ul>
        <li>Lo que publiques debe ser verdadero y respetuoso. Ziater es una base de datos: corrige errores, no inventes datos.</li>
        <li>Solo puedes subir imágenes y textos que sean tuyos o que tengas permiso para usar (por ejemplo, el cartel o las fotos de tu compañía), indicando la autoría cuando corresponda.</li>
        <li>No está permitido suplantar a otras personas, publicar datos personales que no sean profesionales (como teléfonos o direcciones particulares), ni contenido ofensivo, discriminatorio, ilegal o publicitario ajeno a las artes escénicas.</li>
        <li>
          Sigues siendo titular de tus textos e imágenes. Al publicarlos, nos concedes una licencia gratuita, no exclusiva y mundial para
          mostrarlos, adaptarlos al formato de la web (por ejemplo, recortar o comprimir imágenes) y difundirlos dentro de Ziater y en sus
          redes, mientras estén publicados.
        </li>
        <li>Los datos sobre obras (títulos, fechas, elencos, salas) forman parte de la base de datos común y pueden seguir visibles aunque borres tu cuenta.</li>
      </ul>

      <H>4. Fichas de otras personas</H>
      <p>
        Al añadir una obra puedes incluir a las personas que participaron en ella; se crea así una ficha profesional que la persona puede
        reclamar después. Incluye solo información profesional y pública. Si existe una ficha sobre ti, puedes reclamarla para gestionarla,
        sugerir cambios o pedirnos que la corrijamos o la retiremos (consulta la <Link href="/politica-de-privacidad">política de privacidad</Link>).
        Quien crea una obra o una sala es quien la gestiona; los demás pueden sugerir cambios.
      </p>

      <H>5. Moderación</H>
      <p>
        Podemos corregir, ocultar o retirar contenido que incumpla estos términos o la ley, y suspender cuentas que abusen del servicio. Si
        crees que algo publicado en Ziater infringe tus derechos (por ejemplo, una imagen tuya usada sin permiso), avísanos desde el
        <Link href="/contacto"> formulario de contacto</Link> y lo revisaremos lo antes posible.
      </p>

      <H>6. Enlaces y entradas</H>
      <p>
        Ziater enlaza a webs de terceros, como las de venta de entradas, las salas o las redes sociales. No vendemos entradas ni somos
        responsables de esas webs, de sus precios ni de cambios o cancelaciones de funciones: confirma siempre los datos con la sala o la
        ticketera.
      </p>

      <H>7. Responsabilidad</H>
      <p>
        Gran parte del contenido lo aportan los usuarios. Trabajamos para que sea correcto, pero no podemos garantizar que todo esté completo o
        actualizado, ni que la web esté siempre disponible. Ziater se ofrece tal cual, y no seremos responsables de daños derivados del uso de
        la información publicada, salvo en los casos en que la ley no permita esta limitación.
      </p>

      <H>8. Propiedad intelectual de Ziater</H>
      <p>El nombre, el logotipo, el diseño y el código de Ziater son de su titular. No puedes copiarlos ni usarlos para crear servicios que se hagan pasar por Ziater.</p>

      <H>9. Cambios en los términos</H>
      <p>Podemos actualizar estos términos. Si el cambio es importante, lo avisaremos en la web. Seguir usando Ziater después implica aceptar la nueva versión.</p>

      <H>10. Ley aplicable</H>
      <p>Estos términos se rigen por la ley española. Si eres consumidor, podrás acudir a los tribunales de tu domicilio.</p>
    </LegalPage>
  );
}

// English version
function En() {
  return (
    <LegalPage title="Terms of use">
      <p>Last updated: 8 November 2026. This is a translation; the Spanish version prevails in case of discrepancy.</p>
      <p>
        Ziater (ziater.com) is an open, free database of the performing arts (the owner&apos;s details are in the{" "}
        <Link href="/aviso-legal">legal notice</Link>). By using the website or creating an account you accept these terms. If you do not
        agree, please do not use it.
      </p>

      <H>1. The service</H>
      <p>
        Ziater lets you browse and publish information about shows, artists, companies and venues: pages, casts, performance dates, images and
        ratings. Browsing the website is open and free. To publish, rate or save lists you need an account, which is also free.
      </p>

      <H>2. Your account</H>
      <ul>
        <li>You must be at least 14 years old and provide truthful information.</li>
        <li>You are responsible for what is done with your account: keep your password safe and do not share it.</li>
        <li>You can stop using Ziater whenever you like and ask us to delete your account through the <Link href="/contacto">contact form</Link>.</li>
      </ul>

      <H>3. What you publish</H>
      <ul>
        <li>What you publish must be true and respectful. Ziater is a database: correct mistakes, do not make up information.</li>
        <li>You may only upload images and texts that are yours or that you have permission to use (for example, your company&apos;s poster or photos), crediting the author where appropriate.</li>
        <li>You may not impersonate others, publish personal details that are not professional (such as private phone numbers or addresses), or post offensive, discriminatory, illegal content or advertising unrelated to the performing arts.</li>
        <li>
          You remain the owner of your texts and images. By publishing them, you grant us a free, non-exclusive, worldwide licence to display
          them, adapt them to the website&apos;s format (for example, cropping or compressing images) and share them within Ziater and on its
          social media, for as long as they are published.
        </li>
        <li>Information about shows (titles, dates, casts, venues) is part of the shared database and may remain visible even if you delete your account.</li>
      </ul>

      <H>4. Other people&apos;s profiles</H>
      <p>
        When adding a show you can include the people who took part in it; this creates a professional profile that the person can claim later.
        Only include professional, public information. If there is a profile about you, you can claim it to manage it, suggest changes or ask us
        to correct or remove it (see the <Link href="/politica-de-privacidad">privacy policy</Link>). Whoever creates a show or a venue manages
        it; everyone else can suggest changes.
      </p>

      <H>5. Moderation</H>
      <p>
        We may correct, hide or remove content that breaches these terms or the law, and suspend accounts that abuse the service. If you believe
        something published on Ziater infringes your rights (for example, an image of yours used without permission), let us know through the
        <Link href="/contacto"> contact form</Link> and we will review it as soon as possible.
      </p>

      <H>6. Links and tickets</H>
      <p>
        Ziater links to third-party websites, such as ticket sellers, venues or social media. We do not sell tickets and we are not responsible
        for those websites, their prices or changes to or cancellations of performances: always check the details with the venue or the
        ticket seller.
      </p>

      <H>7. Liability</H>
      <p>
        Much of the content is contributed by users. We work to keep it accurate, but we cannot guarantee that everything is complete or up to
        date, or that the website is always available. Ziater is provided as is, and we will not be liable for damages arising from the use of
        the published information, except where the law does not allow this limitation.
      </p>

      <H>8. Ziater&apos;s intellectual property</H>
      <p>Ziater&apos;s name, logo, design and code belong to its owner. You may not copy them or use them to create services that pass themselves off as Ziater.</p>

      <H>9. Changes to the terms</H>
      <p>We may update these terms. If the change is important, we will announce it on the website. Continuing to use Ziater afterwards means you accept the new version.</p>

      <H>10. Governing law</H>
      <p>These terms are governed by Spanish law. If you are a consumer, you may also go to the courts of your place of residence and rely on the mandatory consumer protections of your country.</p>
    </LegalPage>
  );
}
