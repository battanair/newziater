import type { Metadata } from "next";
import Link from "@/components/Idioma";
import { LegalPage } from "@/components/LegalPage";
import { alternos, idiomaDe } from "@/lib/i18n";


export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = idiomaDe((await params).lang);
  return lang === "en"
    ? { title: "Privacy policy", description: "What data Ziater processes, why, on what legal basis and how to exercise your rights.", alternates: alternos(lang, "/politica-de-privacidad") }
    : { title: "Política de privacidad", description: "Qué datos trata Ziater, para qué, con qué base legal y cómo ejercer tus derechos.", alternates: alternos(lang, "/politica-de-privacidad") };
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  return idiomaDe((await params).lang) === "en" ? <En /> : <Es />;
}

const H = ({ children }: { children: React.ReactNode }) => <h2 className="h3" style={{ marginTop: 36 }}>{children}</h2>;

function Es() {
  return (
    <LegalPage title="Política de privacidad">
      <p>Última actualización: 8 de noviembre de 2026.</p>
      <p>
        En Ziater nos tomamos en serio tus datos: recogemos solo los necesarios, no los vendemos y no usamos publicidad ni rastreadores de
        terceros. Aquí te explicamos qué datos tratamos, para qué y cómo puedes controlarlos, conforme al Reglamento General de Protección de
        Datos (RGPD) y a la Ley Orgánica 3/2018 de Protección de Datos (LOPDGDD).
      </p>

      <H>1. Quién es el responsable</H>
      <p>
        El responsable del tratamiento es el titular de Ziater (ziater.com), cuyos datos figuran en el <Link href="/aviso-legal">aviso legal</Link>.
        Para cualquier cuestión sobre privacidad puedes escribirnos desde el <Link href="/contacto?motivo=borrado">formulario de contacto</Link>.
      </p>

      <H>2. Qué datos tratamos</H>
      <ul>
        <li><strong>Datos de tu cuenta:</strong> tu email y, si entras con Google, el nombre y la foto de tu cuenta de Google. La contraseña nunca la vemos: la gestiona Firebase Authentication de forma cifrada.</li>
        <li><strong>Tu perfil y tu actividad:</strong> nombre, obras que guardas o has visto, puntuaciones, sugerencias de cambio y solicitudes para gestionar fichas.</li>
        <li><strong>Contenido que publicas:</strong> fichas de obras, artistas, compañías y salas (textos, fechas, créditos, enlaces e imágenes), y el historial de cambios de esas fichas.</li>
        <li><strong>Fichas de artistas:</strong> nombre profesional, biografía, fotografía, ciudad, roles y trayectoria. Pueden haberlas creado la propia persona o terceros al añadir una obra.</li>
        <li><strong>Mensajes de contacto:</strong> nombre, email y el mensaje que nos envías.</li>
        <li><strong>Datos técnicos:</strong> la dirección IP y datos del navegador que llegan a nuestros servidores al visitar la web, y estadísticas de visitas anónimas y agregadas (ver apartado 6).</li>
      </ul>

      <H>3. Para qué los usamos y con qué base legal</H>
      <ul>
        <li><strong>Prestarte el servicio</strong> (crear tu cuenta, guardar tus listas y puntuaciones, publicar y editar fichas): ejecución de las <Link href="/terminos-de-uso">condiciones de uso</Link> que aceptas al registrarte (art. 6.1.b RGPD).</li>
        <li><strong>Mantener una base de datos pública de las artes escénicas</strong>, con la trayectoria profesional de quienes participan en ellas: interés legítimo en documentar y difundir la cultura (art. 6.1.f RGPD). Si aparece una ficha sobre ti, puedes reclamarla, corregirla u oponerte a ella (apartado 8).</li>
        <li><strong>Responder a tus mensajes:</strong> tu consentimiento al enviarlos (art. 6.1.a RGPD).</li>
        <li><strong>Seguridad, prevención de abusos y copias de seguridad:</strong> interés legítimo en proteger el servicio y los datos (art. 6.1.f RGPD).</li>
      </ul>
      <p>No tomamos decisiones automatizadas sobre ti ni elaboramos perfiles con fines comerciales.</p>

      <H>4. Qué es público y qué no</H>
      <p>
        Son públicas las fichas de obras, artistas, compañías y salas, la nota media de cada obra y, solo si lo activas, tu perfil de
        colaborador en el ranking. No son públicos tu email, tus puntuaciones individuales, tus listas, tus sugerencias ni tus mensajes.
      </p>

      <H>5. Con quién compartimos los datos</H>
      <p>No vendemos ni cedemos tus datos. Para que Ziater funcione usamos proveedores que los tratan por cuenta nuestra (encargados del tratamiento):</p>
      <ul>
        <li><strong>Google (Firebase):</strong> cuentas de usuario y base de datos.</li>
        <li><strong>Cloudinary:</strong> almacenamiento y optimización de imágenes.</li>
        <li><strong>Vercel:</strong> alojamiento de la web y estadísticas de visitas anónimas.</li>
        <li><strong>GitHub:</strong> copias de seguridad de la base de datos, en un repositorio privado.</li>
      </ul>
      <p>
        Algunos de estos proveedores pueden tratar datos fuera del Espacio Económico Europeo (por ejemplo, en Estados Unidos). En esos casos la
        transferencia se ampara en garantías adecuadas, como el Marco de Privacidad de Datos UE-EE. UU. o cláusulas contractuales tipo
        aprobadas por la Comisión Europea. También podremos comunicar datos a las autoridades cuando lo exija la ley.
      </p>

      <H>6. Estadísticas y cookies</H>
      <p>
        No usamos cookies publicitarias ni de seguimiento. Contamos las visitas de forma anónima y agregada (cuántas visitas recibe cada
        sección al día), sin guardar quién eres. Las estadísticas que necesitan guardar algo en tu navegador solo se activan si las aceptas en
        el aviso de cookies, y puedes cambiar de opinión desde «Configurar cookies», en el pie de la web. Los detalles están en la{" "}
        <Link href="/politica-de-cookies">política de cookies</Link>.
      </p>

      <H>7. Cuánto tiempo los guardamos</H>
      <ul>
        <li>Los datos de tu cuenta, mientras la mantengas activa. Si la borras desde «Mi espacio» → «Cuenta», tu acceso, email, nombre y listas se eliminan al instante y el resto se completa en un máximo de 7 días.</li>
        <li>Las fichas públicas y su historial, mientras Ziater exista, porque forman parte de la base de datos cultural, salvo que ejerzas tu derecho de oposición o supresión.</li>
        <li>Los mensajes de contacto, el tiempo necesario para atenderlos y como máximo un año.</li>
        <li>Las copias de seguridad semanales, un máximo de 90 días; después se borran.</li>
      </ul>

      <H>8. Tus derechos</H>
      <p>
        Puedes pedir en cualquier momento <strong>acceso</strong> a tus datos, su <strong>rectificación</strong> o <strong>supresión</strong>,
        la <strong>limitación</strong> del tratamiento, la <strong>portabilidad</strong> o <strong>oponerte</strong> a él, escribiéndonos desde
        el <Link href="/contacto?motivo=borrado">formulario de contacto</Link> (motivo «Borrar mis datos o ejercer otro derecho de privacidad»).
        Si tienes cuenta, también puedes borrarla tú mismo desde «Mi espacio» → «Cuenta» → «Borrar mi cuenta y mis datos». Muchas cosas puedes hacerlas tú directamente desde «Mi espacio»: editar tu
        ficha, reclamar una ficha que habla de ti o borrar tus listas.
      </p>
      <p>
        Si crees que no hemos atendido bien tu solicitud, puedes reclamar ante la Agencia Española de Protección de Datos
        (<a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">aepd.es</a>).
      </p>

      <H>9. Menores</H>
      <p>Para crear una cuenta en Ziater debes tener al menos 14 años: te lo pedimos al registrarte. Si eres madre, padre o tutor y crees que un menor de 14 años se ha registrado, escríbenos desde el <Link href="/contacto?motivo=borrado">formulario de contacto</Link> y borraremos su cuenta.</p>

      <H>10. Seguridad</H>
      <p>
        Las conexiones van cifradas (HTTPS), las contraseñas no se guardan en claro y el acceso a los datos está limitado por reglas de seguridad
        en el servidor: cada persona solo puede modificar lo suyo. Aun así, ningún sistema es infalible; usa una contraseña segura y única.
      </p>

      <H>11. Cambios</H>
      <p>Si cambiamos esta política de forma importante, lo avisaremos en la web. La fecha de arriba indica la última versión.</p>
    </LegalPage>
  );
}

// English version
function En() {
  return (
    <LegalPage title="Privacy policy">
      <p>Last updated: 8 November 2026. This is a translation; the Spanish version prevails in case of discrepancy.</p>
      <p>
        At Ziater we take your data seriously: we only collect what we need, we do not sell it and we do not use advertising or third-party
        trackers. Here we explain which data we process, why, and how you can control it, in accordance with the General Data Protection
        Regulation (GDPR) and the Spanish Organic Law 3/2018 on Data Protection (LOPDGDD).
      </p>

      <H>1. Who is the controller</H>
      <p>
        The data controller is the owner of Ziater (ziater.com), whose details appear in the <Link href="/aviso-legal">legal notice</Link>.
        For any privacy question you can write to us through the <Link href="/contacto?motivo=borrado">contact form</Link>.
      </p>

      <H>2. What data we process</H>
      <ul>
        <li><strong>Your account data:</strong> your email and, if you sign in with Google, the name and photo of your Google account. We never see your password: Firebase Authentication manages it in encrypted form.</li>
        <li><strong>Your profile and activity:</strong> name, shows you save or have seen, ratings, suggested changes and requests to manage profiles.</li>
        <li><strong>Content you publish:</strong> pages for shows, artists, companies and venues (texts, dates, credits, links and images), and the change history of those pages.</li>
        <li><strong>Artist profiles:</strong> professional name, biography, photo, city, roles and career. They may have been created by the person themselves or by others when adding a show.</li>
        <li><strong>Contact messages:</strong> name, email and the message you send us.</li>
        <li><strong>Technical data:</strong> the IP address and browser data that reach our servers when you visit the website, and anonymous, aggregated visit statistics (see section 6).</li>
      </ul>

      <H>3. Why we use it and on what legal basis</H>
      <ul>
        <li><strong>To provide the service</strong> (creating your account, saving your lists and ratings, publishing and editing pages): performance of the <Link href="/terminos-de-uso">terms of use</Link> you accept when you sign up (art. 6.1.b GDPR).</li>
        <li><strong>To maintain a public database of the performing arts</strong>, including the professional careers of the people involved: legitimate interest in documenting and spreading culture (art. 6.1.f GDPR). If there is a profile about you, you can claim it, correct it or object to it (section 8).</li>
        <li><strong>To answer your messages:</strong> your consent when you send them (art. 6.1.a GDPR).</li>
        <li><strong>Security, abuse prevention and backups:</strong> legitimate interest in protecting the service and the data (art. 6.1.f GDPR).</li>
      </ul>
      <p>We do not make automated decisions about you or build profiles for commercial purposes.</p>

      <H>4. What is public and what is not</H>
      <p>
        Pages for shows, artists, companies and venues are public, as is each show&apos;s average rating and, only if you turn it on, your
        contributor profile in the ranking. Your email, your individual ratings, your lists, your suggestions and your messages are not public.
      </p>

      <H>5. Who we share data with</H>
      <p>We do not sell or transfer your data. To run Ziater we use providers that process it on our behalf (data processors):</p>
      <ul>
        <li><strong>Google (Firebase):</strong> user accounts and database.</li>
        <li><strong>Cloudinary:</strong> image storage and optimisation.</li>
        <li><strong>Vercel:</strong> website hosting and anonymous visit statistics.</li>
        <li><strong>GitHub:</strong> database backups, in a private repository.</li>
      </ul>
      <p>
        Some of these providers may process data outside the European Economic Area (for example, in the United States). In those cases the
        transfer relies on appropriate safeguards, such as the EU-US Data Privacy Framework or standard contractual clauses approved by the
        European Commission. We may also disclose data to the authorities when required by law.
      </p>

      <H>6. Statistics and cookies</H>
      <p>
        We do not use advertising or tracking cookies. We count visits anonymously and in aggregate (how many visits each section gets per day),
        without storing who you are. Statistics that need to store something in your browser are only turned on if you accept them in the
        cookie notice, and you can change your mind from &quot;Cookie settings&quot; in the footer. The details are in the{" "}
        <Link href="/politica-de-cookies">cookie policy</Link>.
      </p>

      <H>7. How long we keep it</H>
      <ul>
        <li>Your account data, for as long as you keep the account. If you delete it from &quot;My space&quot; → &quot;Account&quot;, your access, email, name and lists are deleted immediately and the rest within 7 days at most.</li>
        <li>Public pages and their history, for as long as Ziater exists, because they are part of the cultural database, unless you exercise your right to object or to erasure.</li>
        <li>Contact messages, for as long as needed to handle them and one year at most.</li>
        <li>Weekly backups, 90 days at most; after that they are deleted.</li>
      </ul>

      <H>8. Your rights</H>
      <p>
        You can ask at any time for <strong>access</strong> to your data, its <strong>rectification</strong> or <strong>erasure</strong>,
        <strong> restriction</strong> of processing, <strong>portability</strong>, or <strong>object</strong> to it, by writing to us through
        the <Link href="/contacto?motivo=borrado">contact form</Link> (reason &quot;Delete my data or exercise another privacy right&quot;).
        If you have an account, you can also delete it yourself from &quot;My space&quot; → &quot;Account&quot; → &quot;Delete my account and my data&quot;.
        Many things you can do directly from &quot;My space&quot;: edit your profile, claim a profile about you or delete your lists.
      </p>
      <p>
        If you think we have not handled your request properly, you can complain to the Spanish Data Protection Agency
        (<a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">aepd.es</a>) or to the data protection authority of your country.
      </p>

      <H>9. Minors</H>
      <p>You must be at least 14 years old to create a Ziater account: we ask you when you sign up. If you are a parent or guardian and believe a child under 14 has signed up, write to us through the <Link href="/contacto?motivo=borrado">contact form</Link> and we will delete the account.</p>

      <H>10. Security</H>
      <p>
        Connections are encrypted (HTTPS), passwords are never stored in plain text and access to data is limited by security rules on the
        server: each person can only change their own content. Even so, no system is infallible; use a strong, unique password.
      </p>

      <H>11. Changes</H>
      <p>If we make important changes to this policy, we will announce them on the website. The date above shows the latest version.</p>
    </LegalPage>
  );
}
