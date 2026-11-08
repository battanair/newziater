import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Qué datos trata Ziater, para qué, con qué base legal y cómo ejercer tus derechos.",
  alternates: { canonical: "/politica-de-privacidad" },
};

const H = ({ children }: { children: React.ReactNode }) => <h2 className="h3" style={{ marginTop: 36 }}>{children}</h2>;

export default function Page() {
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
